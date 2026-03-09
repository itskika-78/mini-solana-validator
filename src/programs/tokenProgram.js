import { getAccount, setAccount } from "../ledger/ledger.js";
import { 
    validateAccountExists, 
    validateAccountNotExists,
    validateAccountOwnership, 
    validateSigner, 
    validateTokenAccount, 
    validateMintAccount,
    validateTokenTransferBalance,
    validateNonNegative
} from "../ledger/validation.js";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/**
 * SPL TOKEN PROGRAM
 * 
 * Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
 * Manages fungible and non-fungible tokens.
 */

export function handleTokenProgram(instruction, accountKeys, signers) {
    const data = instruction.data;
    const discriminator = data[0];
    const keys = instruction.keys.map(k => k.pubkey.toBase58());

    if (discriminator === 20) {
        // InitializeMint2
        // [u8 disc][u8 decimals][32 bytes mintAuthority][u8 hasFreezeAuth][32 bytes freezeAuthority]
        const mint = keys[0];
        const decimals = data[1];
        const mintAuthority = data.slice(2, 34);
        const hasFreezeAuth = data[34] === 1;
        const freezeAuthority = data.slice(35, 67);

        // Validate mint doesn't already exist
        validateAccountNotExists(mint);
        
        // Validate decimals range (0-255)
        if (decimals > 255) {
            throw new Error(`Invalid decimals: ${decimals}, must be 0-255`);
        }

        const mintData = Buffer.alloc(82);
        mintData.writeUInt32LE(1, 0); // mintAuthorityOption = Some
        mintAuthority.copy(mintData, 4);
        mintData.writeBigUInt64LE(0n, 36); // supply
        mintData[44] = decimals;
        mintData[45] = 1; // isInitialized
        if (hasFreezeAuth) {
            mintData.writeUInt32LE(1, 46); // freezeAuthorityOption = Some
            freezeAuthority.copy(mintData, 50);
        }

        setAccount(mint, { data: mintData, owner: TOKEN_PROGRAM_ID });
        console.log(`Token: InitializeMint2 ${mint}`);

    } else if (discriminator === 18) {
        // InitializeAccount3: [u8 disc][32 bytes owner]
        const tokenAccount = keys[0];
        const mint = keys[1];
        const owner = new PublicKey(data.slice(1, 33)).toBase58();

        // Validate token account doesn't already exist
        validateAccountNotExists(tokenAccount);
        
        // Validate mint exists and is a valid mint
        validateMintAccount(mint);

        const accountData = Buffer.alloc(165);
        new PublicKey(mint).toBuffer().copy(accountData, 0);    // 0-32: mint
        new PublicKey(owner).toBuffer().copy(accountData, 32);   // 32-64: owner
        accountData.writeBigUInt64LE(0n, 64);                   // 64-72: amount
        accountData[108] = 1;                                  // 108: state = initialized

        setAccount(tokenAccount, { data: accountData, owner: TOKEN_PROGRAM_ID });
        console.log(`Token: InitializeAccount3 ${tokenAccount} (owner: ${owner})`);

    } else if (discriminator === 7) {
        // MintTo: [u8 disc][u64 amount]
        // Accounts: [mint, destination, authority]
        const mint = keys[0];
        const dest = keys[1];
        const authority = keys[2];
        const amount = data.readBigUInt64LE(1);

        // Validate amount is non-negative
        validateNonNegative(amount, "Mint amount");
        
        // Validate mint exists and is properly formatted
        const mintAcc = validateMintAccount(mint);
        
        const mintAuth = new PublicKey(mintAcc.data.slice(4, 36)).toBase58();
        if (authority !== mintAuth) {
            throw new Error("Invalid mint authority");
        }
        validateSigner(authority, signers);

        // Validate destination token account
        const destAcc = validateTokenAccount(dest);
        
        // Verify destination account belongs to the same mint
        const destMint = new PublicKey(destAcc.data.slice(0, 32)).toBase58();
        if (destMint !== mint) {
            throw new Error("Destination token account mint mismatch");
        }
        
        // Update destination amount
        const currentAmount = destAcc.data.readBigUInt64LE(64);
        destAcc.data.writeBigUInt64LE(currentAmount + amount, 64);
        
        // Update mint supply
        const currentSupply = mintAcc.data.readBigUInt64LE(36);
        mintAcc.data.writeBigUInt64LE(currentSupply + amount, 36);

        console.log(`Token: MintTo ${amount} to ${dest}`);

    } else if (discriminator === 3 || discriminator === 12) {
        // Transfer (3) [source, destination, owner]
        // TransferChecked (12) [source, mint, destination, owner]
        const source = keys[0];
        const dest = (discriminator === 3) ? keys[1] : keys[2];
        const owner = (discriminator === 3) ? keys[2] : keys[3];
        const amount = data.readBigUInt64LE(1);

        // Validate amount is non-negative
        validateNonNegative(amount, "Transfer amount");
        
        // Validate source token account and ownership
        const srcAcc = validateTokenAccount(source);
        const srcOwner = new PublicKey(srcAcc.data.slice(32, 64)).toBase58();
        if (owner !== srcOwner) {
            throw new Error("Invalid token account owner");
        }
        validateSigner(owner, signers);

        // Validate destination token account
        const destAcc = validateTokenAccount(dest);
        
        // Validate sufficient balance
        validateTokenTransferBalance(source, amount);
        
        // For TransferChecked, verify mint matches and decimals
        if (discriminator === 12) {
            const mint = keys[1];
            const expectedDecimals = data[9]; // decimals at offset 9
            
            // Verify both accounts belong to the same mint
            const srcMint = new PublicKey(srcAcc.data.slice(0, 32)).toBase58();
            const destMint = new PublicKey(destAcc.data.slice(0, 32)).toBase58();
            
            if (srcMint !== mint || destMint !== mint) {
                throw new Error("Mint mismatch in TransferChecked");
            }
            
            // Verify mint decimals
            const mintAcc = validateMintAccount(mint);
            const mintDecimals = mintAcc.data[44];
            if (mintDecimals !== expectedDecimals) {
                throw new Error(`Decimals mismatch: expected ${mintDecimals}, got ${expectedDecimals}`);
            }
        }

        // Perform transfer
        const srcBal = srcAcc.data.readBigUInt64LE(64);
        srcAcc.data.writeBigUInt64LE(srcBal - amount, 64);
        const dstBal = destAcc.data.readBigUInt64LE(64);
        destAcc.data.writeBigUInt64LE(dstBal + amount, 64);

        console.log(`Token: Transfer ${amount} from ${source} to ${dest}`);
    } else {
        throw new Error(`Unsupported Token Program instruction: ${discriminator}`);
    }
}
