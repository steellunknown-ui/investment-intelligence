export interface ParsedTransaction {
  is_transaction: boolean;
  amount?: number;
  type?: 'credit' | 'debit';
  method?: 'upi' | 'card' | 'neft' | 'imps' | 'atm' | 'emi' | 'unknown';
  merchant?: string | null;
  bank?: string | null;
  account_last4?: string | null;
  upi_id?: string | null;
  balance_after?: number | null;
  transaction_ref?: string | null;
  transaction_date?: string;
  category?: string;
}

const IGNORE_PATTERNS = [
  /\botp\b/i,
  /one.?time.?pass/i,
  /do not share/i,
  /offer|cashback|reward points/i,
  /dear customer.*click/i,
  /login.*attempt/i,
  /password.*changed/i,
  /pre.?approved/i,
  /card.*block/i,
  /kyc.*update/i,
];

function extractAmount(text: string): number | null {
  const match = text.match(
    /(?:rs\.?\s*|inr\s*|₹\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i
  );
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

function extractAccount(text: string): string | null {
  const match = text.match(
    /(?:xx+|x+|\*+|ending|a\/c|acct|account)[^\d]*(\d{4})/i
  );
  return match ? match[1] : null;
}

function extractBank(text: string): string | null {
  const bankMap: Record<string, string> = {
    hdfc: 'HDFC',
    'state bank': 'SBI',
    sbi: 'SBI',
    icici: 'ICICI',
    axis: 'Axis',
    kotak: 'Kotak',
    pnb: 'PNB',
    'bank of baroda': 'Bank of Baroda',
    bob: 'Bank of Baroda',
    'yes bank': 'Yes Bank',
    yesb: 'Yes Bank',
    idfc: 'IDFC First',
    indusind: 'IndusInd',
    canara: 'Canara',
    union: 'Union Bank',
    central: 'Central Bank',
    gpay: 'GPay',
    'google pay': 'GPay',
    phonepe: 'PhonePe',
    paytm: 'Paytm',
    fampay: 'FamPay',
    famcard: 'FamPay',
    'amazon pay': 'Amazon Pay',
    mobikwik: 'MobiKwik',
  };
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(bankMap)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function extractMethod(text: string): ParsedTransaction['method'] {
  if (/\bupi\b/i.test(text)) return 'upi';
  if (/\bneft\b/i.test(text)) return 'neft';
  if (/\bimps\b/i.test(text)) return 'imps';
  if (/atm|cash withdrawal/i.test(text)) return 'atm';
  if (/\bemi\b/i.test(text)) return 'emi';
  if (/credit card|debit card/i.test(text)) return 'card';
  return 'unknown';
}

function extractCategory(merchant: string | null, method: string | undefined, type: string | undefined): string {
  const m = (merchant ?? '').toLowerCase();
  if (/swiggy|zomato|domino|mcdonald|kfc|pizza|burger|food|cafe|restaurant/i.test(m)) return 'Food & Dining';
  if (/amazon|flipkart|myntra|meesho|ajio|nykaa|snapdeal/i.test(m)) return 'Shopping';
  if (/bpcl|hpcl|shell|iocl|petrol|fuel/i.test(m)) return 'Fuel';
  if (/apollo|medplus|pharmeasy|netmeds|hospital|clinic|doctor/i.test(m)) return 'Healthcare';
  if (/netflix|spotify|hotstar|prime|youtube|zee5|jiocinema/i.test(m)) return 'Entertainment';
  if (/uber|ola|rapido|metro|irctc|railway|flight|indigo/i.test(m)) return 'Transport';
  if (/electricity|water|airtel|jio|broadband|vi |vodafone/i.test(m)) return 'Utilities';
  if (/rent|housing|society|maintenance/i.test(m)) return 'Rent';
  if (method === 'atm') return 'Cash Withdrawal';
  if (method === 'emi') return 'EMI';
  if (type === 'credit') return 'Income';
  return 'Others';
}

export function generateFingerprint(parsed: ParsedTransaction): string {
  const date = parsed.transaction_date?.split('T')[0]
    ?? new Date().toISOString().split('T')[0];
  const ref = parsed.transaction_ref
    ?? parsed.merchant
    ?? 'no-ref';
  const raw = `${parsed.amount}-${parsed.bank}-${date}-${ref}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function parseTransaction(text: string): ParsedTransaction {
  // Step 1: Ignore non-transactions
  if (IGNORE_PATTERNS.some((p) => p.test(text))) {
    return { is_transaction: false };
  }

  // Step 2: Must have amount
  const amount = extractAmount(text);
  if (!amount) return { is_transaction: false };

  // Step 3: Precise Type Detection (Priority to Debit)
  // Check for debit keywords first to avoid misclassifying messages like "Debited... Friend Credited"
  const isDebit = /\b(debited|paid|spent|withdrawn|deducted|sent|used for)\b/i.test(text);
  const isCredit = /\b(credited|received|refund|added|deposited)\b/i.test(text);

  // If both exist, we prioritize Debit for ICICI style messages
  const type = isDebit ? 'debit' : (isCredit ? 'credit' : null);
  if (!type) return { is_transaction: false };

  // Step 4: Extract all fields
  const account_last4 = extractAccount(text);
  const upiId = text.match(/([\w.\-]+@[a-zA-Z]+)/)?.[1] ?? null;
  const bank = extractBank(text);
  const method = extractMethod(text);
  const ref = text.match(
    /(?:ref|utr|txn|transaction|upi)[:\s#]*([A-Z0-9]{8,20})/i
  )?.[1] ?? null;
  const bal = text.match(
    /(?:avl|avail|bal|balance)[^\d]*([0-9,]+(?:\.[0-9]{1,2})?)/i
  )?.[1] ?? null;

  // Refined Merchant Extraction
  let merchantRaw: string | null = null;

  if (upiId) {
    merchantRaw = upiId.split('@')[0];
  } else if (isDebit) {
    // Look for who received the money (e.g., "...Abhishek Deepna credited")
    const creditedMatch = text.match(/(?:;\s+)?([A-Za-z0-9 &.'-]{2,30?})\s+credited/i);
    if (creditedMatch) {
      merchantRaw = creditedMatch[1].trim();
    } else {
      merchantRaw = text.match(
        /(?:to|at|paid to)\s+([A-Za-z0-9 &.'-]{2,25?})(?:\s+via|\s+on|\s+ref|\.|$)/i
      )?.[1]?.trim() ?? null;
    }
  } else {
    // Credit case
    merchantRaw = text.match(
      /(?:from|by)\s+([A-Za-z0-9 &.'-]{2,25?})(?:\s+via|\s+on|\s+ref|\.|$)/i
    )?.[1]?.trim() ?? null;
  }

  const category = extractCategory(merchantRaw, method, type);

  return {
    is_transaction: true,
    amount,
    type,
    method,
    merchant: merchantRaw,
    bank,
    account_last4,
    upi_id: upiId,
    balance_after: bal ? parseFloat(bal.replace(/,/g, '')) : null,
    transaction_ref: ref,
    transaction_date: new Date().toISOString(),
    category,
  };
}
