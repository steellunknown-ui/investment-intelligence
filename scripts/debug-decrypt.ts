import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { decrypt, decryptNumber } from '../src/lib/encryption'

const rawText = '795a94d58cdea4bb23e09fc1123b37e5:f31aff8ca85a50ec90143ac69e09862d';
const decryptedText = decrypt(rawText);
console.log('Decrypted text:', decryptedText, 'Type:', typeof decryptedText);

const decryptedNum = decryptNumber(rawText);
console.log('Decrypted num:', decryptedNum, 'Type:', typeof decryptedNum);
