import crypto from 'crypto';

/**
 * Hash sensitive ID numbers (Aadhaar, PAN) using SHA-256.
 * NEVER store or log raw values.
 * 
 * @param rawValue - The raw Aadhaar or PAN number
 * @returns SHA-256 hex hash
 */
export function hashIdNumber(rawValue: string): string {
    // Remove spaces and normalize
    const normalized = rawValue.replace(/\s+/g, '').trim();

    if (!normalized) {
        throw new Error('ID number cannot be empty');
    }

    return crypto
        .createHash('sha256')
        .update(normalized)
        .digest('hex');
}

/**
 * Verify a raw ID number against a stored hash.
 * 
 * @param rawValue - The raw Aadhaar or PAN number to verify
 * @param storedHash - The stored SHA-256 hash
 * @returns true if the hash matches
 */
export function verifyIdNumber(rawValue: string, storedHash: string): boolean {
    const hash = hashIdNumber(rawValue);
    return hash === storedHash;
}

/**
 * Validate Aadhaar number format (12 digits)
 */
export function isValidAadhaar(value: string): boolean {
    const cleaned = value.replace(/\s+/g, '');
    return /^\d{12}$/.test(cleaned);
}

/**
 * Validate PAN number format (ABCDE1234F)
 */
export function isValidPAN(value: string): boolean {
    const cleaned = value.replace(/\s+/g, '').toUpperCase();
    return /^[A-Z]{5}\d{4}[A-Z]$/.test(cleaned);
}
