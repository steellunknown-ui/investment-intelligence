import crypto from 'crypto'
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
console.log('Key length:', ENCRYPTION_KEY?.length);

const text = '795a94d58cdea4bb23e09fc1123b37e5:f31aff8ca85a50ec90143ac69e09862d';
const textParts = text.split(':');
const ivHex = textParts.shift();
const encryptedTextHex = textParts.join(':');

const iv = Buffer.from(ivHex as string, 'hex');
const encryptedText = Buffer.from(encryptedTextHex, 'hex');

console.log('IV:', iv);
console.log('Encrypted text:', encryptedText);

try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY as string), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    console.log('Success:', decrypted.toString());
} catch (err) {
    console.error('Decryption failed for a string:', err);
}
