const fs = require('fs');
const path = require('path');

const files = [
    'app/api/assets/route.ts',
    'app/api/banking/accounts/route.ts',
    'app/api/belongings/route.ts',
    'app/api/holdings/route.ts',
    'app/api/insurance/policies/route.ts',
    'app/api/liabilities/route.ts'
];

for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.warn('File not found:', file);
        continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace const newXData = encryptFields(...) with let newXData = encryptFields(...)
    content = content.replace(/const\s+(new\w+Data)\s*=\s*encryptFields\s*\(/g, 'let $1 = encryptFields(');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
}
