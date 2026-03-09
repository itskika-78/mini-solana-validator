import { PublicKey } from "@solana/web3.js";
import { getAccount, setAccount, subtractLamports } from "../ledger/ledger.js";
import { 
    validateAccountNotExists,
    validateSigner,
    validateTransferBalance
} from "../ledger/validation.js";
import { TOKEN_PROGRAM_ID } from "./tokenProgram.js";

const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

/**
 * ASSOCIATED TOKEN ACCOUNT (ATA) PROGRAM
 * 
 * Program ID: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL
 * Handles deterministic creation of token accounts for a given owner and mint.
 */

export function handleAtaProgram(instruction, accountKeys, signers) {
    const keys = instruction.keys.map(k => k.pubkey.toBase58());
    
    // Default ATA Create accounts: [payer, ata, owner, mint, systemProgram, tokenProgram]
    const payer = keys[0];
    const ata = keys[1];
    const owner = keys[2];
    const mint = keys[3];

    // Validate deterministic address
    const [expectedAta] = PublicKey.findProgramAddressSync(
        [new PublicKey(owner).toBuffer(), new PublicKey(TOKEN_PROGRAM_ID).toBuffer(), new PublicKey(mint).toBuffer()],
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
    );

    if (expectedAta.toBase58() !== ata) {
        throw new Error("Invalid Associated Token Account address derivation");
    }

    // Validate ATA doesn't already exist
    validateAccountNotExists(ata);

    // Validate payer signature and balance
    validateSigner(payer, signers);

    // Fixed rent-exempt balance for 165 bytes (Standard SPL Token Account size)
    const RENT_EXEMPT_MIN = 2039280; 
    validateTransferBalance(payer, RENT_EXEMPT_MIN);

    // Execute ATA creation
    subtractLamports(payer, RENT_EXEMPT_MIN);

    const accountData = Buffer.alloc(165);
    new PublicKey(mint).toBuffer().copy(accountData, 0);   // set mint
    new PublicKey(owner).toBuffer().copy(accountData, 32);  // set owner
    accountData.writeBigUInt64LE(0n, 64);                 // set amount = 0
    accountData[108] = 1;                                // set state = initialized

    setAccount(ata, {
        data: accountData,
        owner: TOKEN_PROGRAM_ID,
        lamports: RENT_EXEMPT_MIN
    });

    console.log(`ATA: Created ${ata} for owner ${owner}`);
}
