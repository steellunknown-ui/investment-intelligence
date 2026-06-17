import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypts a string using AES-256-CBC.
 * If the input is null/undefined or the encryption key is missing, it returns the input unchanged.
 */
export function encrypt(text: string | null | undefined): string | null {
    if (!text) return text as any;
    
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL: ENCRYPTION_KEY is missing or invalid in production.');
        }
        console.warn('⚠️ ENCRYPTION_KEY is missing or invalid (must be 32 characters). Data will not be encrypted.');
        return text;
    }

    // Don't encrypt if it already looks like our encrypted format (hex:hex)
    // A standard IV in hex is 32 chars long (16 bytes)
    if (typeof text === 'string' && text.includes(':') && text.split(':')[0].length === 32) {
        return text;
    }

    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Format: iv:encrypted_data
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error('Encryption failed:', err);
        return text;
    }
}

/**
 * Decrypts a string using AES-256-CBC.
 * If the input is not encrypted or the key is missing, it returns the input unchanged.
 */
export function decrypt(text: string | null | undefined): string | null {
    if (!text) return text as any;
    
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
        return text;
    }

    if (!text.includes(':')) {
        return text; // Probably plain text, return as is
    }

    try {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        const encryptedTextHex = textParts.join(':');

        if (!ivHex || ivHex.length !== 32 || !encryptedTextHex) {
            return text; // Invalid format, probably not encrypted by us
        }

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedTextHex, 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (err) {
        // If decryption fails (e.g. wrong key, tampered data, or coincidentally matched the format)
        console.error('Decryption failed for a string:', err);
        return text;
    }
}

/**
 * Utility to encrypt multiple string fields in an object.
 */
export function encryptFields<T extends Record<string, any>>(record: T, fields: (keyof T)[]): T {
    const result = { ...record };
    for (const field of fields) {
        if (result[field] !== undefined && result[field] !== null) {
            result[field] = encrypt(String(result[field])) as any;
        }
    }
    return result;
}

/**
 * Utility to decrypt multiple string fields in an object.
 */
export function decryptFields<T extends Record<string, any>>(data: T, fields: (keyof T)[]): T {
    if (!data) return data;
    
    const result = { ...data };
    for (const field of fields) {
        if (result[field] !== undefined && typeof result[field] === 'string') {
            const decryptedValue = decrypt(result[field] as string);
            if (decryptedValue !== null) {
                result[field] = decryptedValue as any;
            }
        }
    }
    return result;
}

// ----------------------------------------------------
// Helpers for Numeric Fields
// ----------------------------------------------------

export function encryptNumber(num: number | string | null | undefined): string | null {
    if (num === null || num === undefined || num === '') return null;
    return encrypt(num.toString());
}

export function decryptNumber(text: string | null | undefined): number | null {
    if (!text) return null;
    const decryptedStr = decrypt(text);
    if (decryptedStr === null || decryptedStr === text) {
        // If decrypt returned null, or returned the original string (meaning it wasn't encrypted)
        const parsed = Number(text);
        return isNaN(parsed) ? null : parsed;
    }
    const parsed = Number(decryptedStr);
    return isNaN(parsed) ? null : parsed;
}

export function encryptNumericFields<T extends Record<string, any>>(data: T, fields: (keyof T)[]): T {
    if (!data) return data;
    
    const result = { ...data };
    for (const field of fields) {
        if (result[field] !== undefined && result[field] !== null && result[field] !== '') {
            const val = result[field];
            if (typeof val === 'number') {
                result[field] = encryptNumber(val) as any;
            } else if (typeof val === 'string') {
                const parsed = Number(val);
                if (!isNaN(parsed)) {
                    result[field] = encryptNumber(parsed) as any;
                }
            }
        }
    }
    return result;
}

export function decryptNumericFields<T extends Record<string, any>>(data: T, fields: (keyof T)[]): T {
    if (!data) return data;
    
    const result = { ...data };
    for (const field of fields) {
        if (result[field] !== undefined && result[field] !== null) {
            if (typeof result[field] === 'string') {
                const decryptedValue = decryptNumber(result[field] as string);
                if (decryptedValue !== null) {
                    result[field] = decryptedValue as any;
                }
            } else if (typeof result[field] === 'number') {
                // Already a number (maybe unencrypted row), just keep it
            }
        }
    }
    return result;
}
