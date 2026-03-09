import { accounts, getSlot, getBlockHeight, getBalance, getAccount, addLamports } from "./ledger/ledger.js";
import { getLatestBlockhash } from "./ledger/blockhash.js";
import { getSignatureStatuses, setSignatureStatus } from "./ledger/signatures.js";
import { processTransaction } from "./transaction/processor.js";
import { TOKEN_PROGRAM_ID } from "./programs/tokenProgram.js";
import crypto from "crypto";
import bs58 from "bs58";

/**
 * RPC ROUTER
 * 
 * Central entry point for all JSON-RPC 2.0 requests.
 * 1. Validates standard JSON-RPC 2.0 structure.
 * 2. Routes methods to ledger queries or transaction processing.
 * 3. Handles error mapping to standard Solana/JSON-RPC codes.
 */

export async function handleRpc(req) {
    // Validate basic JSON-RPC 2.0 structure
    if (!req || typeof req !== "object") {
        return createErrorResponse(null, -32600, "Invalid request (malformed JSON-RPC)");
    }
    
    if (req.jsonrpc !== "2.0") {
        return createErrorResponse(req.id, -32600, "Invalid JSON-RPC version");
    }
    
    if (typeof req.method !== "string") {
        return createErrorResponse(req.id, -32600, "Method must be a string");
    }

    const { method, params, id } = req;

    try {
        switch (method) {
            case "getHealth":
                return { jsonrpc: "2.0", id, result: "ok" };

            case "getSlot":
                return { jsonrpc: "2.0", id, result: getSlot() };

            case "getBlockHeight":
                return { jsonrpc: "2.0", id, result: getBlockHeight() };

            case "getVersion":
                return {
                    jsonrpc: "2.0",
                    id,
                    result: { "solana-core": "1.17.0", "feature-set": 1 }
                };

            case "getLatestBlockhash":
                const { hash, lastValidBlockHeight } = getLatestBlockhash(getSlot());
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        context: { slot: getSlot() },
                        value: { blockhash: hash, lastValidBlockHeight }
                    }
                };

            case "getBalance":
                if (!validateParams(params, 1, "pubkey required")) {
                    return createErrorResponse(id, -32602, "Invalid params: pubkey required");
                }
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        context: { slot: getSlot() },
                        value: getBalance(params[0])
                    }
                };

            case "getAccountInfo":
                if (!validateParams(params, 1, "pubkey required")) {
                    return createErrorResponse(id, -32602, "Invalid params: pubkey required");
                }
                const account = getAccount(params[0]);
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        context: { slot: getSlot() },
                        value: account ? {
                            data: [account.data.toString("base64"), "base64"],
                            executable: account.executable,
                            lamports: account.lamports,
                            owner: account.owner,
                            rentEpoch: account.rentEpoch
                        } : null
                    }
                };

            case "getMinimumBalanceForRentExemption":
                if (!validateParams(params, 1, "dataSize required")) {
                    return createErrorResponse(id, -32602, "Invalid params: dataSize required");
                }
                const size = typeof params[0] === 'number' && params[0] >= 0 ? params[0] : 0;
                // Solana rent exemption formula: (dataSize + 128) * 2 lamports per byte
                // This matches mainnet's rent calculation for simplicity
                const rentExemptAmount = (size + 128) * 2;
                return { jsonrpc: "2.0", id, result: rentExemptAmount };

            case "getTokenAccountBalance":
                if (!validateParams(params, 1, "pubkey required")) {
                    return createErrorResponse(id, -32602, "Invalid params: pubkey required");
                }
                const tokenAcc = getAccount(params[0]);
                if (!tokenAcc || tokenAcc.owner !== TOKEN_PROGRAM_ID) {
                    return createErrorResponse(id, -32602, "Invalid account or not a token account");
                }
                const amount = tokenAcc.data.readBigUInt64LE(64);
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        context: { slot: getSlot() },
                        value: {
                            amount: amount.toString(),
                            decimals: 9, // Simplification
                            uiAmount: Number(amount) / 1e9
                        }
                    }
                };

            case "getTokenAccountsByOwner":
                if (!validateParams(params, 1, "owner required")) {
                    return createErrorResponse(id, -32602, "Invalid params: owner required");
                }
                const searchOwner = params[0];
                const results = [];
                
                for (const [pubkey, acc] of accounts.entries()) {
                    if (acc.owner === TOKEN_PROGRAM_ID && acc.data.length >= 64) {
                        const accOwner = bs58.encode(acc.data.slice(32, 64));
                        if (accOwner === searchOwner) {
                            results.push({
                                pubkey,
                                account: {
                                    data: [acc.data.toString("base64"), "base64"],
                                    executable: acc.executable,
                                    lamports: acc.lamports,
                                    owner: acc.owner,
                                    rentEpoch: acc.rentEpoch
                                }
                            });
                        }
                    }
                }
                return { jsonrpc: "2.0", id, result: { context: { slot: getSlot() }, value: results } };

            case "requestAirdrop":
                if (!validateParams(params, 2, "pubkey and amount required")) {
                    return createErrorResponse(id, -32602, "Invalid params: pubkey and amount required");
                }
                const airdropPubkey = params[0];
                const airdropAmount = Number(params[1]);
                if (airdropAmount <= 0) {
                    return createErrorResponse(id, -32602, "Invalid params: amount must be positive");
                }
                addLamports(airdropPubkey, airdropAmount);
                
                // Track signature status for airdrops
                const signature = bs58.encode(crypto.randomBytes(32));
                setSignatureStatus(signature, { slot: getSlot(), err: null });
                
                return { jsonrpc: "2.0", id, result: signature };

            case "sendTransaction":
                if (!validateParams(params, 1, "transaction required")) {
                    return createErrorResponse(id, -32602, "Invalid params: missing transaction");
                }
                const encodedTx = params[0];
                if (typeof encodedTx !== "string") {
                    return createErrorResponse(id, -32602, "Invalid params: transaction must be base64 string");
                }
                const txSig = await processTransaction(encodedTx);
                return { jsonrpc: "2.0", id, result: txSig };

            case "getSignatureStatuses":
                const sigs = params?.[0] || [];
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        context: { slot: getSlot() },
                        value: getSignatureStatuses(sigs)
                    }
                };

            default:
                return createErrorResponse(id, -32601, `Method not found: ${method}`);
        }
    } catch (err) {
        console.error(`RPC Error (${method}):`, err);
        const code = err.code || -32003; // -32003 = Transaction Failed
        return createErrorResponse(id, code, err.message || "Internal server error");
    }
}

/**
 * Creates a standardized JSON-RPC 2.0 error response.
 * @param {*} id - The request ID.
 * @param {number} code - Error code.
 * @param {string} message - Error message.
 * @returns {object} JSON-RPC error response.
 */
function createErrorResponse(id, code, message) {
    return {
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code, message }
    };
}

/**
 * Validates RPC parameters.
 * @param {Array} params - Parameters array.
 * @param {number} minCount - Minimum number of parameters required.
 * @param {string} errorMessage - Error message to return if validation fails.
 * @returns {boolean} True if parameters are valid.
 */
function validateParams(params, minCount, errorMessage) {
    return Array.isArray(params) && params.length >= minCount && params.every(p => p != null);
}