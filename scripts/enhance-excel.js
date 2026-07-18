const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '../app/api/export/excel/route.ts');
let content = fs.readFileSync(routePath, 'utf8');

// 1. Add decryptNumericFields
if (!content.includes('decryptNumericFields')) {
    content = content.replace(
        "import ExcelJS from 'exceljs';",
        "import ExcelJS from 'exceljs';\nimport { decryptNumericFields } from '@/src/lib/encryption';"
    );
}

const mapReplacements = {
    "const banking = bankingData.data || [];": "const banking = bankingData.data?.map((r: any) => decryptNumericFields(r, ['current_balance'])) || [];",
    "const insurance = insuranceData.data || [];": "const insurance = insuranceData.data?.map((r: any) => decryptNumericFields(r, ['sum_insured', 'premium_amount'])) || [];",
    "const insurancePayments = insurancePaymentsData.data || [];": "const insurancePayments = insurancePaymentsData.data?.map((r: any) => decryptNumericFields(r, ['amount'])) || [];",
    "const assets = assetsData.data || [];": "const assets = assetsData.data?.map((r: any) => decryptNumericFields(r, ['current_market_value', 'purchase_value'])) || [];",
    "const liabilities = liabilitiesData.data || [];": "const liabilities = liabilitiesData.data?.map((r: any) => decryptNumericFields(r, ['principal_amount', 'outstanding_amount', 'emi_amount'])) || [];",
    "const liabilityPayments = liabilityPaymentsData.data || [];": "const liabilityPayments = liabilityPaymentsData.data?.map((r: any) => decryptNumericFields(r, ['amount'])) || [];",
    "const receivables = receivablesData.data || [];": "const receivables = receivablesData.data?.map((r: any) => decryptNumericFields(r, ['principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount'])) || [];",
    "const belongings = belongingsData.data || [];": "const belongings = belongingsData.data?.map((r: any) => decryptNumericFields(r, ['quantity', 'purchase_value', 'current_estimated_value', 'weight_grams'])) || [];",
    "const holdings = holdingsData.data || [];": "const holdings = holdingsData.data?.map((r: any) => decryptNumericFields(r, ['quantity', 'avg_buy_price'])) || [];"
};

for (const [key, value] of Object.entries(mapReplacements)) {
    content = content.replace(key, value);
}

// 2. Add Premium Styling Function
const premiumStylingFunction = `
        const applyPremiumStyling = (sheet: ExcelJS.Worksheet, title: string) => {
            sheet.insertRow(1, [title.toUpperCase()]);
            sheet.mergeCells(1, 1, 1, sheet.columns.length || 5);
            const titleRow = sheet.getRow(1);
            titleRow.height = 30;
            titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

            const headerRow = sheet.getRow(2);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
            headerRow.height = 25;

            if (sheet.columns.length > 0) {
                sheet.autoFilter = {
                    from: { row: 2, column: 1 },
                    to: { row: 2, column: sheet.columns.length }
                };
            }

            sheet.eachRow((row, rowNumber) => {
                if (rowNumber > 2) {
                    const isEven = rowNumber % 2 === 0;
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }
                    };
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                        };
                    });
                }
            });
        };
`;

if (!content.includes('applyPremiumStyling')) {
    content = content.replace(
        /const maskAccountNumber =([\s\S]*?)\};/,
        match => match + '\n' + premiumStylingFunction
    );
}

// 3. Replace styling blocks
const sheets = [
    { name: 'Summary', var: 'summarySheet' },
    { name: 'Banking', var: 'bankingSheet' },
    { name: 'Insurance', var: 'insuranceSheet' },
    { name: 'Insurance Payments', var: 'insurancePaymentsSheet' },
    { name: 'Assets', var: 'assetsSheet' },
    { name: 'Liabilities', var: 'liabilitiesSheet' },
    { name: 'Liability Payments', var: 'liabilityPaymentsSheet' },
    { name: 'Receivables', var: 'receivablesSheet' },
    { name: 'Belongings', var: 'belongingsSheet' },
    { name: 'Documents', var: 'documentsSheet' },
    { name: 'Holdings', var: 'holdingsSheet' },
    { name: 'Nominees', var: 'nomineesSheet' },
    { name: 'Legacy Config', var: 'legacySheet' }
];

for (const sheet of sheets) {
    if (sheet.name === 'Summary') {
        const regex = new RegExp(sheet.var + "\\.getRow\\(1\\)\\.font = \\{ bold: true, size: 12 \\};[\\s\\S]*?" + sheet.var + "\\.getRow\\(1\\)\\.font = \\{ \\.\\.\\." + sheet.var + "\\.getRow\\(1\\)\\.font, color: \\{ argb: 'FFFFFFFF' \\} \\};");
        content = content.replace(regex, "applyPremiumStyling(" + sheet.var + ", '" + sheet.name + "');");
    } else {
        const regex = new RegExp(sheet.var + "\\.getRow\\(1\\)\\.font = \\{ bold: true \\};[\\s\\S]*?" + sheet.var + "\\.getRow\\(1\\)\\.fill = \\{[\\s\\S]*?fgColor: \\{ argb: 'FFD9E1F2' \\}\\s*\\};");
        content = content.replace(regex, "applyPremiumStyling(" + sheet.var + ", '" + sheet.name + "');");
    }
}

fs.writeFileSync(routePath, content, 'utf8');
console.log('Done!');
