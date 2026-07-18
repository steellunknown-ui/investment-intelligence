const fs = require('fs');
const crypto = require('crypto');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/ENCRYPTION_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        const encryptedTextHex = textParts.join(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedTextHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        console.error("Decryption error:", e.message);
        return null;
    }
}

console.log("Decrypted:", decrypt('795a94d58cdea4bb23e09fc1123b37e5:f31aff8ca85a50ec90143ac69e09862d'));
