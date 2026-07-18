const fs = require('fs');
const crypto = require('crypto');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/ENCRYPTION_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

console.log("Key found:", !!key, "Length:", key ? key.length : 0);

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const authTag = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        console.error("Decryption error:", e.message);
        return null;
    }
}

// Fetch one row from Supabase directly via REST to avoid dependencies
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

async function run() {
    const res = await fetch(`${url}/rest/v1/bank_accounts?select=current_balance,id&limit=1`, {
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        }
    });
    const data = await res.json();
    console.log("Raw from DB:", data);
    if (data && data.length > 0) {
        const val = data[0].current_balance;
        console.log("Decrypted:", decrypt(val));
        console.log("Number parsed:", Number(decrypt(val)));
    }
}

run().catch(console.error);
