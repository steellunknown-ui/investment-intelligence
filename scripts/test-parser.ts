import { parseTransaction } from '../services/smsParser.js';

const tests: string[] = [
  // 1. HDFC debit SMS
  'Your HDFC Bank A/c XX6789 debited for Rs.1,500.00 on 29-Jul-26 to AMAZON. Avl Bal:Rs.24,350.12',
  // 2. FamPay card
  'Your FamCard has been used for Rs.299 at Swiggy. Available balance: Rs.1,204.50',
  // 3. SBI NEFT credit
  'NEFT Credit: INR 75,000 credited to your SBI A/c XX1234 from ACME Corp Ltd. Ref: NEFT2026123',
  // 4. ICICI CC debit
  'ICICI Bank Credit Card XX4321 used for INR 3,299.00 at FLIPKART on 29-07-2026.',
  // 5. PhonePe UPI
  'Rs.500.00 paid to 9876543210@ybl via PhonePe UPI. UPI Ref: 432156789012',
  // 6. ATM withdrawal
  'Dear Customer, Cash Withdrawal of Rs.2,000 done at ATM on 29/07/2026. Avl Bal: Rs.5,400.00',
  // 7. NACH / EMI auto-debit
  'NACH Debit of Rs.3,500 for EMI processed for Kotak Bank A/c XX8888 on 29-Jul-26. Bal:Rs.12,000',
  // 8. Salary credit
  'Salary of Rs.75,000 credited to your Axis Bank A/c XX9999 on 29-Jul-2026. Balance: Rs.80,000',
  // 9. Cheque cleared
  'Cheque No. 001234 for Rs.10,000 cleared in your SBI A/c XX5555. Balance: Rs.45,000',
  // 10. OTP — should be IGNORED
  'Your OTP for UPI transaction is 123456. Do not share.',
  // 11. Deposit (cash)
  'Rs.5,000 deposited to your HDFC Bank A/c XX1111 on 29-Jul-26. Bal: Rs.15,000',
  // 12. Net banking transfer
  'INR 2,500 transferred via Net Banking from your ICICI A/c XX2345 to ABC Pvt Ltd. Ref: TXN20260729',
  // 13. Wallet top-up (credit)
  'Rs.1,000 added to your Paytm wallet. Available balance: Rs.1,050',
  // 14. Refund
  'Refund of Rs.399 from Netflix credited to your HDFC Card XX6789',
  // 15. UPI collect request paid
  'You have paid Rs.850 to merchant@okaxis via UPI. Ref: 123456789098',
];

console.log('═══════════════════════════════════════════════════════');
console.log('  smsParser v4.0 — Smoke Test');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

tests.forEach((msg, i) => {
  const r = parseTransaction(msg, 'test');
  const isIgnoreTest = i === 9; // test #10 must NOT be a transaction
  const ok = isIgnoreTest ? !r.is_transaction : r.is_transaction;

  if (ok) passed++; else failed++;

  const icon = ok ? '✅' : '❌';
  if (r.is_transaction) {
    console.log(
      `${icon} TEST ${String(i + 1).padStart(2, '0')} | ${(r.type ?? '?').padEnd(6)} ` +
      `| ₹${String(r.amount).padEnd(10)} | ${(r.method ?? '?').padEnd(11)} ` +
      `| merchant: ${r.merchant ?? 'n/a'} | bank: ${r.bank ?? 'n/a'} | cat: ${r.category}`,
    );
  } else {
    console.log(`${icon} TEST ${String(i + 1).padStart(2, '0')} | NOT A TRANSACTION${isIgnoreTest ? ' (expected ✓)' : ''}`);
  }
});

console.log(`\n═══ Results: ${passed} passed / ${failed} failed ═══`);
