import { getAccount, setAccount, subtractLamports, addLamports } from "../ledger/ledger.js";
import { 
    validateAccountExists, 
    validateAccountNotExists,
    validateSigner, 
    validateTransferBalance,
    validateNonNegative,
    validatePositive
} from "../ledger/validation.js";
import { PublicKey } from "@solana/web3.js";

/**
 * SYSTEM PROGRAM
 * 
 * Program ID: 11111111111111111111111111111111
 * Handles SOL transfers and Account creation/allocation.
 */

export function handleSystemProgram(instruction, accountKeys, signers) {
    const data = instruction.data;
    const discriminator = data.readUInt32LE(0);
    const keys = instruction.keys.map(k => k.pubkey.toBase58());

    if (discriminator === 0) {
        // CreateAccount: [u32 disc][u64 lamports][u64 space][32-byte owner pubkey]
        const lamports = Number(data.readBigUInt64LE(4));
        const space = Number(data.readBigUInt64LE(12));
        const ownerPubkey = new PublicKey(data.slice(20, 52)).toBase58();

        const payer = keys[0];
        const newAccount = keys[1];

        // Validate parameters
        validateNonNegative(lamports, "Lamports");
        validateNonNegative(space, "Space");
        
        // Validate signatures
        validateSigner(payer, signers);
        validateSigner(newAccount, signers);
        
        // Validate account doesn't already exist
        validateAccountNotExists(newAccount);
        
        // Validate payer has sufficient balance
        validateTransferBalance(payer, lamports);

        // Execute account creation
        subtractLamports(payer, lamports);
        setAccount(newAccount, {
            lamports,
            data: Buffer.alloc(space),
            owner: ownerPubkey
        });
        
        console.log(`System: CreateAccount ${newAccount} (owner: ${ownerPubkey})`);

    } else if (discriminator === 2) {
        // Transfer: [u32 disc][u64 lamports]
        const lamports = Number(data.readBigUInt64LE(4));
        const from = keys[0];
        const to = keys[1];

        // Validate parameters
        validatePositive(lamports, "Transfer amount");
        
        // Validate signature
        validateSigner(from, signers);
        
        // Validate sufficient balance
        validateTransferBalance(from, lamports);

        // Execute transfer
        subtractLamports(from, lamports);
        addLamports(to, lamports);
        
        console.log(`System: Transfer ${lamports} lamports from ${from} to ${to}`);
    } else {
        throw new Error(`Unsupported System Program instruction: ${discriminator}`);
    }
}
