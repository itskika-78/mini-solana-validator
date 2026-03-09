import { getAccount } from "./ledger.js";

/**
 * ACCOUNT VALIDATION UTILITIES
 * 
 * Provides helper functions for validating account state before executing instructions.
 * Ensures protocol compliance and prevents invalid state transitions.
 */

const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/**
 * Validates that an account exists.
 * @param {string} pubkey - Account public key.
 * @throws {Error} If account doesn't exist.
 */
export function validateAccountExists(pubkey) {
    const account = getAccount(pubkey);
    if (!account) {
        throw new Error(`Account does not exist: ${pubkey}`);
    }
    return account;
}

/**
 * Validates that an account does NOT exist.
 * @param {string} pubkey - Account public key.
 * @throws {Error} If account already exists.
 */
export function validateAccountNotExists(pubkey) {
    const account = getAccount(pubkey);
    if (account && (account.lamports > 0 || account.data.length > 0)) {
        throw new Error(`Account already exists: ${pubkey}`);
    }
}

/**
 * Validates that an account has sufficient lamports balance.
 * @param {string} pubkey - Account public key.
 * @param {number|bigint} requiredBalance - Required balance in lamports.
 * @throws {Error} If insufficient balance.
 */
export function validateSufficientBalance(pubkey, requiredBalance) {
    const account = validateAccountExists(pubkey);
    const balance = BigInt(account.lamports);
    const required = BigInt(requiredBalance);
    
    if (balance < required) {
        throw new Error(`Insufficient lamports: account ${pubkey} has ${balance}, needs ${required}`);
    }
}

/**
 * Validates that an account is owned by the specified program.
 * @param {string} pubkey - Account public key.
 * @param {string} expectedOwner - Expected owner program ID.
 * @throws {Error} If ownership doesn't match.
 */
export function validateAccountOwnership(pubkey, expectedOwner) {
    const account = validateAccountExists(pubkey);
    if (account.owner !== expectedOwner) {
        throw new Error(`Invalid account ownership: ${pubkey} owned by ${account.owner}, expected ${expectedOwner}`);
    }
}

/**
 * Validates that an account is a signer (present in signers set).
 * @param {string} pubkey - Account public key.
 * @param {Set<string>} signers - Set of signer public keys.
 * @throws {Error} If account is not a signer.
 */
export function validateSigner(pubkey, signers) {
    if (!signers.has(pubkey)) {
        throw new Error(`Missing signature for account: ${pubkey}`);
    }
}

/**
 * Validates that a value is a non-negative number.
 * @param {number|bigint} value - Value to validate.
 * @param {string} paramName - Parameter name for error messages.
 * @throws {Error} If value is negative.
 */
export function validateNonNegative(value, paramName) {
    if (value < 0) {
        throw new Error(`${paramName} cannot be negative: ${value}`);
    }
}

/**
 * Validates that a value is a positive number.
 * @param {number|bigint} value - Value to validate.
 * @param {string} paramName - Parameter name for error messages.
 * @throws {Error} If value is not positive.
 */
export function validatePositive(value, paramName) {
    if (value <= 0) {
        throw new Error(`${paramName} must be positive: ${value}`);
    }
}

/**
 * Validates token account data layout (165 bytes).
 * @param {Buffer} data - Account data buffer.
 * @throws {Error} If layout is invalid.
 */
export function validateTokenAccountLayout(data) {
    if (!data || data.length !== 165) {
        throw new Error(`Invalid token account layout: expected 165 bytes, got ${data?.length || 0}`);
    }
}

/**
 * Validates mint account data layout (82 bytes).
 * @param {Buffer} data - Account data buffer.
 * @throws {Error} If layout is invalid.
 */
export function validateMintAccountLayout(data) {
    if (!data || data.length !== 82) {
        throw new Error(`Invalid mint account layout: expected 82 bytes, got ${data?.length || 0}`);
    }
}

/**
 * Validates that an account is a valid token account.
 * @param {string} pubkey - Account public key.
 * @throws {Error} If account is not a valid token account.
 */
export function validateTokenAccount(pubkey) {
    const account = validateAccountExists(pubkey);
    validateAccountOwnership(pubkey, TOKEN_PROGRAM_ID);
    validateTokenAccountLayout(account.data);
    return account;
}

/**
 * Validates that an account is a valid mint account.
 * @param {string} pubkey - Account public key.
 * @throws {Error} If account is not a valid mint account.
 */
export function validateMintAccount(pubkey) {
    const account = validateAccountExists(pubkey);
    validateAccountOwnership(pubkey, TOKEN_PROGRAM_ID);
    validateMintAccountLayout(account.data);
    return account;
}

/**
 * Validates that a transfer amount won't result in negative balance.
 * @param {string} pubkey - Source account public key.
 * @param {number|bigint} amount - Amount to transfer.
 * @throws {Error} If transfer would result in negative balance.
 */
export function validateTransferBalance(pubkey, amount) {
    const account = validateAccountExists(pubkey);
    const balance = BigInt(account.lamports);
    const transferAmount = BigInt(amount);
    
    if (balance < transferAmount) {
        throw new Error(`Transfer would result in negative balance: account ${pubkey} has ${balance}, transferring ${transferAmount}`);
    }
}

/**
 * Validates that a token transfer amount won't exceed the token balance.
 * @param {string} pubkey - Source token account public key.
 * @param {number|bigint} amount - Amount to transfer.
 * @throws {Error} If transfer would exceed token balance.
 */
export function validateTokenTransferBalance(pubkey, amount) {
    const account = validateTokenAccount(pubkey);
    const balance = account.data.readBigUInt64LE(64); // Amount is at offset 64
    const transferAmount = BigInt(amount);
    
    if (balance < transferAmount) {
        throw new Error(`Insufficient token balance: account ${pubkey} has ${balance}, transferring ${transferAmount}`);
    }
}
