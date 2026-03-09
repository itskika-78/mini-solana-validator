/**
 * SIGNATURE STATUS TRACKER
 * 
 * Maintains a record of processed transactions and their execution results.
 * Provides replay protection by tracking processed signatures.
 */

const signatureStatuses = new Map(); // signature -> { slot, err, confirmationStatus }
const processedSignatures = new Set(); // Set of processed signatures for replay protection

/**
 * Records the status of a transaction signature.
 * @param {string} signature - Base58 encoded signature.
 * @param {object} status - { slot, err, confirmationStatus }
 */
export function setSignatureStatus(signature, status) {
    signatureStatuses.set(signature, {
        slot: status.slot,
        err: status.err,
        confirmationStatus: status.confirmationStatus || "confirmed"
    });
    processedSignatures.add(signature);
}

/**
 * Checks if a signature has already been processed (replay protection).
 * @param {string} signature - Base58 encoded signature.
 * @returns {boolean} True if signature was already processed.
 */
export function isSignatureProcessed(signature) {
    return processedSignatures.has(signature);
}

/**
 * Retrieves statuses for a list of signatures.
 * @param {string[]} signatures - Base58 encoded signatures.
 * @returns {Array} Array of status objects or null for unknown signatures.
 */
export function getSignatureStatuses(signatures) {
    return signatures.map(sig => {
        const status = signatureStatuses.get(sig);
        if (!status) return null;
        
        return {
            slot: status.slot,
            confirmations: null,
            err: status.err,
            confirmationStatus: status.confirmationStatus
        };
    });
}
