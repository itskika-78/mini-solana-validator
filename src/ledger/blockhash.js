import bs58 from "bs58";
import crypto from "crypto";

/**
 * BLOCKHASH SYSTEM
 * 
 * Maintains a rolling queue of the last 150 blockhashes with proper slot tracking.
 * Required to prevent transaction re-entry and ensure cluster timeliness.
 */

const MAX_BLOCKHASH_AGE = 150;
const blockhashes = new Map(); // hash -> { slot, lastValidBlockHeight }
const queue = []; // Rolling history of blockhashes in order

/**
 * Generates a new blockhash and adds it to the rolling queue.
 * @param {number} slot - Current slot number.
 * @returns {object} { hash, lastValidBlockHeight }
 */
export function generateBlockhash(slot) {
    const hash = bs58.encode(crypto.randomBytes(32));
    const lastValidBlockHeight = slot + MAX_BLOCKHASH_AGE;

    // Add to tracking structures
    blockhashes.set(hash, { slot, lastValidBlockHeight });
    queue.push(hash);

    // Maintain rolling queue of exactly 150 blockhashes
    if (queue.length > MAX_BLOCKHASH_AGE) {
        const oldestHash = queue.shift();
        blockhashes.delete(oldestHash);
    }

    return { hash, lastValidBlockHeight };
}

/**
 * Validates if a blockhash exists in the current valid window.
 * @param {string} hash - Base58 encoded blockhash.
 * @returns {boolean} True if blockhash is still valid.
 */
export function isValidBlockhash(hash) {
    const blockhashInfo = blockhashes.get(hash);
    if (!blockhashInfo) {
        return false;
    }
    return true; // In this simple implementation, all tracked blockhashes are valid
}

/**
 * Returns the latest blockhash or generates one if none exists.
 * @param {number} currentSlot - Current slot number.
 * @returns {object} { hash, lastValidBlockHeight }
 */
export function getLatestBlockhash(currentSlot) {
    if (queue.length > 0) {
        const latest = queue[queue.length - 1];
        const blockhashInfo = blockhashes.get(latest);
        return { 
            hash: latest, 
            lastValidBlockHeight: blockhashInfo.lastValidBlockHeight 
        };
    }
    return generateBlockhash(currentSlot);
}

/**
 * Gets the current size of the blockhash queue (for debugging/monitoring).
 * @returns {number} Number of tracked blockhashes.
 */
export function getBlockhashQueueSize() {
    return queue.length;
}

/**
 * Gets all tracked blockhashes (for debugging/monitoring).
 * @returns {Array} Array of blockhash strings.
 */
export function getAllBlockhashes() {
    return [...queue];
}
