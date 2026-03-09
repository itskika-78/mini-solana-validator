/**
 * LEDGER SYSTEM
 * 
 * An in-memory ledger implementation for the Mini Solana Validator.
 * Manages accounts, balances, and slot/block height tracking.
 */

export const accounts = new Map(); // pubkey (base58) -> AccountData
let slot = 1;

/**
 * Retrieves the current slot of the validator.
 */
export function getSlot() {
    return slot;
}

/**
 * Retrieves the current block height (synonymous with slot in this minimal implementation).
 */
export function getBlockHeight() {
    return slot;
}

/**
 * Increments the current slot, simulating a successful block progression.
 */
export function incrementSlot() {
    slot++;
}

/**
 * Retrieves an account from the ledger by its public key.
 */
export function getAccount(pubkey) {
    return accounts.get(pubkey) || null;
}

/**
 * Creates or updates an account in the ledger.
 * 
 * Account Schema:
 * - lamports: number
 * - owner: string (base58)
 * - data: Buffer
 * - executable: boolean
 * - rentEpoch: number
 */
export function setAccount(pubkey, data) {
    accounts.set(pubkey, {
        lamports: 0,
        owner: "11111111111111111111111111111111", // Default to System Program
        data: Buffer.alloc(0),
        executable: false,
        rentEpoch: 0,
        ...data
    });
}

/**
 * Returns the balance of an account in lamports.
 */
export function getBalance(pubkey) {
    const account = getAccount(pubkey);
    return account ? account.lamports : 0;
}

/**
 * Credits lamports to an account, creating it if it doesn't exist.
 */
export function addLamports(pubkey, amount) {
    const account = getAccount(pubkey) || { 
        lamports: 0, 
        owner: "11111111111111111111111111111111", 
        data: Buffer.alloc(0), 
        executable: false, 
        rentEpoch: 0 
    };
    account.lamports += amount;
    accounts.set(pubkey, account);
}

/**
 * Debits lamports from an account. Throws if insufficient funds exist.
 */
export function subtractLamports(pubkey, amount) {
    const account = getAccount(pubkey);
    if (!account || account.lamports < amount) {
        throw new Error("Insufficient funds");
    }
    account.lamports -= amount;
    accounts.set(pubkey, account);
}
