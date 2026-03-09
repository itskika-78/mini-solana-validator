import { Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { isValidBlockhash } from "../ledger/blockhash.js";
import { handleSystemProgram } from "../programs/systemProgram.js";
import { handleTokenProgram, TOKEN_PROGRAM_ID } from "../programs/tokenProgram.js";
import { handleAtaProgram } from "../programs/ataProgram.js";
import { setSignatureStatus, isSignatureProcessed } from "../ledger/signatures.js";
import { incrementSlot, getSlot } from "../ledger/ledger.js";

const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const ATA_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

/**
 * TRANSACTION PROCESSOR
 * 
 * Orchestrates transaction validation and execution.
 * 1. Deserialization
 * 2. Signature verification correlated with Message account keys.
 * 3. Instruction routing.
 */

export async function processTransaction(encodedTx) {
    const rawTx = Buffer.from(encodedTx, "base64");
    
    // Deserialize using web3.js
    let tx;
    try {
        tx = Transaction.from(rawTx);
    } catch (err) {
        throw new Error("Invalid transaction wire format");
    }

    const currentSlot = getSlot();
    const message = tx.compileMessage();
    const accountKeys = message.accountKeys.map(k => k.toBase58());
    const serializedMessage = tx.serializeMessage();

    // 0. REPLAY PROTECTION CHECK
    const firstSig = bs58.encode(tx.signatures[0].signature);
    if (isSignatureProcessed(firstSig)) {
        throw new Error("Transaction already processed");
    }

    // 1. SIGNATURE VERIFICATION
    // Solana signatures correspond to the first N account keys in the message header
    const numRequiredSignatures = message.header.numRequiredSignatures;
    const signers = new Set();
    
    for (let i = 0; i < numRequiredSignatures; i++) {
        const signatureEntry = tx.signatures[i];
        if (!signatureEntry || !signatureEntry.signature) {
            throw new Error(`Signature missing for account ${accountKeys[i]}`);
        }
        
        const signature = signatureEntry.signature;
        if (signature.every(b => b === 0)) {
            throw new Error(`Empty signature for account ${accountKeys[i]}`);
        }
        
        const publicKey = accountKeys[i];
        const isValid = nacl.sign.detached.verify(
            serializedMessage,
            signature,
            bs58.decode(publicKey)
        );
        
        if (!isValid) {
            throw new Error(`Signature verification failed for account ${publicKey}`);
        }
        signers.add(publicKey);
    }

    // 2. BLOCKHASH VALIDATION
    if (!isValidBlockhash(tx.recentBlockhash)) {
        throw new Error("Blockhash not found or expired");
    }

    // 3. INSTRUCTION EXECUTION
    try {
        for (const ix of tx.instructions) {
            const programId = ix.programId.toBase58();

            if (programId === SYSTEM_PROGRAM_ID) {
                handleSystemProgram(ix, accountKeys, signers);
            } else if (programId === TOKEN_PROGRAM_ID) {
                handleTokenProgram(ix, accountKeys, signers);
            } else if (programId === ATA_PROGRAM_ID) {
                handleAtaProgram(ix, accountKeys, signers);
            } else {
                throw new Error(`Program not implemented: ${programId}`);
            }
        }
    } catch (err) {
        setSignatureStatus(firstSig, { 
            slot: currentSlot, 
            err: err.message,
            confirmationStatus: "failed"
        });
        throw err;
    }

    // 4. COMMIT STATUS
    setSignatureStatus(firstSig, { 
        slot: currentSlot, 
        err: null,
        confirmationStatus: "confirmed"
    });
    incrementSlot();

    return firstSig;
}
