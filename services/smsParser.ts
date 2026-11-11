/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UNIVERSAL INDIAN TRANSACTION PARSER v5.0 (Fintech Edition)
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles ALL Indian banking & payment formats:
 *   - Bank SMS: Bank of Baroda (BOB), SBI, HDFC, ICICI, Axis, Kotak, PNB, Canara,
 *               Union Bank, IDFC First, IndusInd, Federal, RBL, Yes Bank, etc.
 *   - Directional parsing: Accurately parses compound messages like:
 *       "Rs.150.00 Dr. from A/C XXXXXX9683 and Cr. to paytm.s2fqhc4@pty."
 *   - Payment Instruments:
 *       - UPI (Bank Account)
 *       - RuPay Credit Card on UPI
 *       - Credit Card (Swipe/POS, Online) with Visa / Mastercard / RuPay / Amex
 *       - Debit Card (ATM / POS / Online)
 *       - Wallets (Paytm, FamPay, MobiKwik)
 *       - Net Banking / IMPS / NEFT / RTGS
 *   - Date parser: Handles BOB colon timestamp format (YYYY:MM:DD HH:MM:SS)
 *   - Clean merchant extraction & intelligent categorization
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ParsedTransaction {
  is_transaction: boolean;
  amount?: number;
  type?: 'credit' | 'debit';
  method?: 'upi' | 'card' | 'neft' | 'imps' | 'rtgs' | 'atm' | 'emi' |
           'netbanking' | 'wallet' | 'nach' | 'si' | 'cheque' | 'unknown';
  instrument?: string | null;
  card_network?: 'RuPay' | 'Visa' | 'Mastercard' | 'Amex' | null;
  merchant?: string | null;
  bank?: string | null;
  account_last4?: string | null;
  upi_id?: string | null;
  balance_after?: number | null;
  transaction_ref?: string | null;
  transaction_date?: string;
  category?: string;
  raw_source?: string;   // 'sms' | 'notification'
  raw_sender?: string | null;
  _debug?: string[];
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DEBUG_PARSER = false;

// ─── HARD-IGNORE PATTERNS ─────────────────────────────────────────────────────
// Messages that must NEVER be treated as completed financial transactions.
const IGNORE_PATTERNS: RegExp[] = [
  /\botp\b/i,
  /one.?time.?pass(word)?/i,
  /do not share/i,
  /never share/i,
  /login.{0,20}attempt/i,
  /password.{0,20}(changed|reset|updated)/i,
  /card.{0,20}(block|hotlist|cancelled|deactivat)/i,
  /kyc.{0,20}(update|complet|verif|pending|expir)/i,
  /please verify/i,
  /verify in your/i,
  /reward.?points?\s*(earned|added|credited)/i,
  /loan.{0,30}(approved|eligible|offer|disburse)/i,
  /fd.{0,30}(mature|interest|renew|open)/i,
  /statement.{0,20}(generat|available|ready)/i,
  /minimum.{0,20}due/i,
  /payment.{0,20}due.{0,20}date/i,
  /congratulations.{0,60}(offer|reward|win|voucher)/i,
  /pre.?approved/i,
  /credit.?limit.{0,30}(increas|decreas|updat)/i,
  /your\s+(?:upi|account)\s+(?:id|handle)\s+(?:is|has been)\s+(?:register|creat|activ)/i,
  /account\s+(?:open|creat|register)/i,
];

// ─── AMOUNT EXTRACTION ────────────────────────────────────────────────────────
function extractAmount(text: string): number | null {
  const strategies: RegExp[] = [
    // S1 — ₹ symbol immediately before number (₹1,234.56 or ₹ 299)
    /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/,

    // S2 — Rs. / INR / Re. before number (e.g. Rs.150.00, Rs150, INR 500)
    /(?:rs\.?\s*|inr\s*|re\.?\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S3 — "of Rs." / "of ₹"
    /(?:of\s*)(?:rs\.?\s*|inr\s*|₹\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S4 — "Amount: 2500" or "Amt: 1,200"
    /\bam(?:oun)?t[:\s]+([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S5 — "debited for Rs 150" or "debited by 299" (BOB style)
    /(?:debited|credited|dr\.?|cr\.?|paid|charged|spent|withdrawn|deposited)\s+(?:for\s+|by\s+|of\s+|rs\.?\s*|₹\s*|inr\s*)*([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S6 — "for ₹/Rs/INR 500"
    /for\s+(?:inr\s*|rs\.?\s*|₹\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S7 — "transfer of 5000" / "payment of 2300"
    /(?:transfer|payment|transaction)\s+of\s+(?:inr\s*|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S8 — NACH/SI auto-debit
    /(?:auto.?debit|standing\s+instruction|nach\s+debit)\s+(?:of\s+)?(?:inr\s*|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S9 — Cheque
    /ch(?:e?que|q)(?:\s+no\.?\s*\d+)?\s+(?:of\s+|for\s+)?(?:inr\s*|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S10 — Fallback: any standalone currency number
    /(?:inr|rs|₹)\s*([0-9]{2,}(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
  ];

  for (const re of strategies) {
    const m = text.match(re);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0 && val < 100_000_000) return val;
    }
  }
  return null;
}

// ─── DEBIT / CREDIT CLASSIFICATION ───────────────────────────────────────────
function classifyType(text: string): 'debit' | 'credit' | null {
  const t = text.toLowerCase();

  // ── 1. High-Priority Account Directional Checks ─────────────────────────────
  // Explicitly handles compound messages like Bank of Baroda (BOB):
  // "Rs.150.00 Dr. from A/C XXXXXX9683 and Cr. to paytm.s2fqhc4@pty."
  const isDrFromAccount =
    /\b(?:dr\.?|debited|deducted|withdrawn)\s+(?:from|for|in)\s+(?:a\/?c|acc(?:oun)?t|card|savings|current)/i.test(text) ||
    /\b(?:a\/?c|acc(?:oun)?t|card|savings|current)\b.{0,30}\b(?:is\s+)?(?:debited|dr\.?)\b/i.test(text) ||
    /\bdr\.?\s+from\s+(?:a\/?c|acc(?:oun)?t|card)/i.test(text) ||
    /\bdr\.\s+from\b/i.test(text);

  const isCrToAccount =
    /\b(?:cr\.?|credited|deposited)\s+(?:to|in|into)\s+(?:a\/?c|acc(?:oun)?t|card|savings|current)/i.test(text) ||
    /\b(?:a\/?c|acc(?:oun)?t|card|savings|current)\b.{0,30}\b(?:is\s+)?(?:credited|cr\.?)\b/i.test(text) ||
    /\bcr\.?\s+to\s+(?:a\/?c|acc(?:oun)?t|card)/i.test(text) ||
    /\bcredited\s+to\s+(?:a\/?c|your\s+account)/i.test(text);

  if (isDrFromAccount && !isCrToAccount) return 'debit';
  if (isCrToAccount && !isDrFromAccount) return 'credit';

  // ── 2. Standard Debit Signatures ───────────────────────────────────────────
  if (/\b(debited|deducted|withdrawn|charged|spent)\b/.test(t)) return 'debit';
  if (/\b(paid to|sent to|payment\s+(?:of|to|made|done|successful)|transferred\s+(?:via|to|from\s+your))\b/.test(t)) return 'debit';
  if (/\b(you\s+(?:have\s+)?(?:sent|paid|transferred))\b/.test(t)) return 'debit';
  if (/\b(used\s+(?:at|for)|purchase(?:d)?\s+at|swiped\s+at)\b/.test(t)) return 'debit';
  if (/famcard.{0,30}(used|charged|spent)/.test(t)) return 'debit';
  if (/credit\s*card.{0,40}(payment|paid|charged|debited|purchase|transaction|used)/.test(t)) return 'debit';
  if (/\b(atm\s+(?:withdrawal|cash)|cash\s+(?:withdrawal|withdrwl|withdrawn)|withdrew)\b/.test(t)) return 'debit';
  if (/\b(emi|nach|auto.?debit|standing\s+instruction)\b.{0,30}\b(debited|deducted|processed|executed)\b/.test(t)) return 'debit';
  if (/\bdebit\s+(?:of\s+)?(?:rs\.?|inr|₹)/i.test(text)) return 'debit';
  if (/\b(neft|imps|rtgs|upi)\b.{0,30}\b(sent|transfer(?:red)?|paid|debited)\b/.test(t)) return 'debit';

  // ── 3. Standard Credit Signatures ──────────────────────────────────────────
  if (/\b(credited|received|refund(?:ed)?|deposited|reversed|cashback\s+(?:credited|received)|money\s+(?:added|loaded))\b/.test(t)) return 'credit';
  if (/\b(salary|payroll)\b.{0,30}\b(credited|received|transferred)\b/.test(t)) return 'credit';
  if (/\b(neft|imps|rtgs|upi)\b.{0,30}\b(credit(?:ed)?|received|transferred\s+to\s+your)\b/.test(t)) return 'credit';
  if (/\bcredit\s+(?:of\s+)?(?:rs\.?|inr|₹)/i.test(text)) return 'credit';

  // ── 4. Fallback Short-forms ─────────────────────────────────────────────────
  if (/\bdr\b|\bdr\./i.test(text)) return 'debit';
  if (/\bcr\b|\bcr\./i.test(text)) return 'credit';

  // Bounce / return (ignore failed transactions)
  if (/\b(bounce(?:d)?|returned|dishonour(?:ed)?|insufficient\s+funds)\b/.test(t)) return null;

  return null;
}

// ─── INSTRUMENT & CARD NETWORK EXTRACTION ─────────────────────────────────────
export interface InstrumentDetails {
  instrument: string;
  card_network: 'RuPay' | 'Visa' | 'Mastercard' | 'Amex' | null;
  method: ParsedTransaction['method'];
}

function extractInstrumentAndCard(text: string, upiId: string | null): InstrumentDetails {
  // 1. Detect Card Network
  let card_network: 'RuPay' | 'Visa' | 'Mastercard' | 'Amex' | null = null;
  if (/\brupay\b/i.test(text)) card_network = 'RuPay';
  else if (/\bvisa\b/i.test(text)) card_network = 'Visa';
  else if (/\bmastercard\b|\bmaster\s*card\b|\bmc\b/i.test(text)) card_network = 'Mastercard';
  else if (/\bamex\b|\bamerican\s*express\b/i.test(text)) card_network = 'Amex';

  // 2. RuPay Credit Card on UPI
  // e.g. "RuPay Credit Card ending in XX1234 used on UPI" or "BOB RuPay CC on UPI at Zomato"
  if (card_network === 'RuPay' && (/\bcredit\b|\bcc\b/i.test(text)) && (/\bupi\b|@|vpa/i.test(text))) {
    return {
      instrument: 'RuPay Credit Card on UPI',
      card_network: 'RuPay',
      method: 'upi',
    };
  }

  // 3. Credit Card (Swipe / POS vs Online)
  if (/\bcredit\s*card\b|\bcc\s*(?:ending|no\.?|\*+|xx+)/i.test(text) || (card_network && /\bcard\b/i.test(text) && !/\bdebit\b/i.test(text))) {
    const isPos = /\b(?:swiped|pos|in-store|at\s*store|machine)\b/i.test(text);
    const isOnline = /\b(?:online|e-?commerce|e-?com|internet|otp|amazon|flipkart)\b/i.test(text);
    const instrument = isPos ? 'Credit Card (Swipe/POS)' : isOnline ? 'Credit Card (Online)' : 'Credit Card';
    return {
      instrument,
      card_network,
      method: 'card',
    };
  }

  // 4. Debit Card
  if (/\bdebit\s*card\b|\bdc\s*(?:ending|no\.?|\*+|xx+)/i.test(text) || (/\bcard\b/i.test(text) && /\b(?:atm|pos|cash\s*withdrawal)\b/i.test(text))) {
    const isAtm = /\batm\b|cash\s*withdrawal/i.test(text);
    return {
      instrument: 'Debit Card',
      card_network,
      method: isAtm ? 'atm' : 'card',
    };
  }

  // 5. UPI (Bank Account)
  // Presence of VPA (@pty, @okhdfcbank), word "UPI", or UPI apps (GPay, PhonePe, Paytm, Slice, FamPay)
  if (/\bupi\b|vpa/i.test(text) || upiId || /\bgpay\b|google\s*pay|phonepe|paytm\s*upi|bhim\b|cred\s*upi|slice\s*upi|fampay\b/i.test(text)) {
    return {
      instrument: 'UPI (Bank Account)',
      card_network: null,
      method: 'upi',
    };
  }

  // 6. Wallets / Fintechs
  if (/famcard|fampay|paytm\s*wallet|mobikwik|amazon\s*pay\s*balance/i.test(text)) {
    return {
      instrument: 'Wallet',
      card_network,
      method: 'wallet',
    };
  }

  // 7. Net Banking / IMPS / NEFT / RTGS / NACH
  if (/\bneft\b/i.test(text)) return { instrument: 'NEFT', card_network: null, method: 'neft' };
  if (/\bimps\b/i.test(text)) return { instrument: 'IMPS', card_network: null, method: 'imps' };
  if (/\brtgs\b/i.test(text)) return { instrument: 'RTGS', card_network: null, method: 'rtgs' };
  if (/net.?banking|netbanking/i.test(text)) return { instrument: 'Net Banking', card_network: null, method: 'netbanking' };
  if (/\bnach\b|auto.?debit|standing\s+instruction/i.test(text)) return { instrument: 'Auto Debit (NACH/SI)', card_network: null, method: 'nach' };
  if (/ch(?:e?que|q)/i.test(text)) return { instrument: 'Cheque', card_network: null, method: 'cheque' };

  return {
    instrument: 'Bank Account',
    card_network: null,
    method: 'unknown',
  };
}

// ─── BANK EXTRACTION ─────────────────────────────────────────────────────────
const BANK_MAP: Array<[RegExp, string]> = [
  // Bank of Baroda (BOB) — comprehensive patterns
  [/bank\s*of\s*baroda|bob\b|5000-bob|bobsms|bobtxn|baroda/i, 'Bank of Baroda'],

  // Major Indian Banks
  [/state\s*bank|sbi\b|sbicrd|sbiinb|sbiupi|sbipsg|sbimsg/i, 'State Bank of India'],
  [/hdfc\b|hdfcbk|hdfcbank/i,                                 'HDFC Bank'],
  [/icici\b|icicib|icicis|imobile/i,                            'ICICI Bank'],
  [/axis\b|axisbk|axisbnk/i,                                   'Axis Bank'],
  [/kotak\b|kotakb/i,                                          'Kotak Mahindra Bank'],
  [/pnb\b|punjab\s*national/i,                                 'Punjab National Bank'],
  [/canara\b|canbnk/i,                                         'Canara Bank'],
  [/union\s*bank|unionb/i,                                     'Union Bank of India'],
  [/idfc\b|idfc\s*first/i,                                     'IDFC First Bank'],
  [/indusind\b|indbnk/i,                                       'IndusInd Bank'],
  [/federal\s*bank/i,                                          'Federal Bank'],
  [/yes\s*bank|yesb\b|yesbnk/i,                                'Yes Bank'],
  [/rbl\s*bank/i,                                              'RBL Bank'],
  [/au\s*small|au\s*bank/i,                                    'AU Small Finance Bank'],
  [/central\s*bank/i,                                          'Central Bank of India'],
  [/bank\s*of\s*india\b/i,                                     'Bank of India'],
  [/indian\s*bank/i,                                           'Indian Bank'],

  // Fintech & Payments Banks
  [/fampay|famcard/i,                                          'FamPay'],
  [/slice\b/i,                                                 'Slice'],
  [/cred\b/i,                                                  'CRED'],
  [/paytm\s*payments?\s*bank|paytmb\b/i,                       'Paytm Payments Bank'],
  [/paytm/i,                                                   'Paytm'],
  [/google\s*pay|gpay|googlepay/i,                             'Google Pay'],
  [/phonepe/i,                                                 'PhonePe'],
  [/amazon\s*pay|amzpay/i,                                     'Amazon Pay'],
  [/navi\b/i,                                                  'Navi'],
  [/jupiter/i,                                                 'Jupiter'],
  [/one\s*card|onecard/i,                                      'OneCard'],
];

function extractBank(text: string): string | null {
  for (const [re, name] of BANK_MAP) {
    if (re.test(text)) return name;
  }
  return null;
}

// ─── ACCOUNT LAST 4 ──────────────────────────────────────────────────────────
function extractAccount(text: string): string | null {
  const patterns: RegExp[] = [
    // Handles BOB: XXXXXX9683 or **9683
    /(?:xx+|\*+)\s*(\d{4})\b/i,
    /(?:ending|ending\s+in|a\/c|acct\.?|account|card)\s*[^a-z0-9]*(\d{4})\b/i,
    /(?:credit|debit)\s+card\s+(\d{4})\b/i,
    /(?:savings?|current|salary)\s+a\/c\s*(\d{4})\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

// ─── UPI ID / VPA ─────────────────────────────────────────────────────────────
function extractUpiId(text: string): string | null {
  // Matches standard VPA: handle@bank or paytm.xxx@pty
  const m = text.match(/\b([a-zA-Z0-9._\-+]{2,}@[a-zA-Z0-9]{2,})\b/);
  return m ? m[1] : null;
}

// ─── REFERENCE / UTR ─────────────────────────────────────────────────────────
function extractRef(text: string): string | null {
  const patterns: RegExp[] = [
    // Matches Ref:631331741267 or Ref 631331741267
    /(?:ref(?:erence)?|utr|upi\s*ref(?:erence)?|txn(?:id)?|transaction\s+(?:id|no\.?|ref))[.:\s#]*([A-Z0-9]{6,30})/i,
    /(?:imps|neft|rtgs)\s*(?:ref|no\.?|id)[.:\s#]*([A-Z0-9]{6,30})/i,
    /(?:ch(?:e?que|q)\s*(?:no\.?|number)?)[.:\s#]*([0-9]{4,12})/i,
    /\b([0-9]{12})\b/, // 12-digit UTR fallback
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

// ─── BALANCE AFTER ───────────────────────────────────────────────────────────
function extractBalance(text: string): number | null {
  const patterns: RegExp[] = [
    // Matches AvlBal:Rs2065.63 or Avl Bal: Rs 2,065.63
    /(?:avl\.?\s*bal(?:ance)?|avail\.?\s*bal(?:ance)?|available\s*balance|bal(?:ance)?|total\s*bal)\s*[:\-]?\s*(?:rs\.?\s*|₹\s*|inr\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:bal\.?|bal(?:ance)?):?\s*(?:rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val)) return val;
    }
  }
  return null;
}

// ─── DATE EXTRACTION ─────────────────────────────────────────────────────────
function extractDate(text: string): string {
  // 1. Colon-separated format e.g. BOB: (2026:11:09 09:35:26) or 2026:11:09
  const mColon = text.match(/(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (mColon) {
    const yr = mColon[1];
    const mon = mColon[2];
    const day = mColon[3];
    const hr = mColon[4] || '00';
    const min = mColon[5] || '00';
    const sec = mColon[6] || '00';
    return `${yr}-${mon}-${day}T${hr}:${min}:${sec}.000Z`;
  }

  const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  // 2. DD-Mon-YY or DD-Mon-YYYY (e.g. 09-Nov-26, 09-Nov-2026)
  const m1 = text.match(/(\d{1,2})[-\/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s](\d{2,4})/i);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const mon = MONTHS[m1[2].toLowerCase().slice(0, 3)];
    const yr = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
    return `${yr}-${mon}-${day}T00:00:00.000Z`;
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY
  const m2 = text.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
  if (m2) {
    return `${m2[3]}-${m2[2]}-${m2[1]}T00:00:00.000Z`;
  }

  // 4. YYYY-MM-DD
  const m3 = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m3) {
    return `${m3[1]}-${m3[2]}-${m3[3]}T00:00:00.000Z`;
  }

  return new Date().toISOString();
}

// ─── MERCHANT EXTRACTION & CLEANING ──────────────────────────────────────────
const JUNK_WORDS = /^(your|the|a|an|this|our|his|her|my|at|to|on|for|via|by|with|bank|account|acct|card|wallet|upi|payment|transaction|transfer|amount|balance|avl|avail|bal|debit|credit|neft|imps|rtgs|nach|si|atm|call|not you)$/i;

function cleanMerchant(raw: string): string | null {
  let candidate = raw
    .trim()
    .replace(/\s+on\s+\d{1,2}[-/][A-Za-z0-9]{2,4}[-/]\d{2,4}$/i, '')
    .replace(/[.,;:!?]+$/, '')
    .replace(/\.\s*(?:Ref|AvlBal|Not you).*$/i, '')
    .trim();

  // If VPA like paytm.s2fqhc4@pty -> Clean to readable merchant
  if (candidate.includes('@')) {
    const handle = candidate.split('@')[0];
    if (handle.toLowerCase().startsWith('paytm.')) {
      const code = handle.replace(/^paytm\./i, '');
      return `Paytm Merchant (${code})`;
    }
    candidate = handle;
  }

  if (candidate.length < 2 || candidate.length > 45) return null;
  if (JUNK_WORDS.test(candidate)) return null;
  if (/^\d+$/.test(candidate)) return null;

  return candidate;
}

function extractMerchant(
  text: string,
  upiId: string | null,
  type: 'debit' | 'credit'
): string | null {
  // 1. UPI P2M format: UPI/P2M/431627819201/SWIGGY BUNDL/BARB
  const p2m = text.match(/upi\/(?:p2m|p2a|p2p)\/\d+\/([A-Za-z0-9\s&.-]+?)(?:\/|$)/i);
  if (p2m) {
    const cleaned = cleanMerchant(p2m[1]);
    if (cleaned) return cleaned;
  }

  // 2. BOB style: "and Cr. to paytm.s2fqhc4@pty."
  const crTo = text.match(/(?:and\s+)?cr\.?\s+to\s+([A-Za-z0-9._\-+@]+)/i);
  if (crTo) {
    const cleaned = cleanMerchant(crTo[1]);
    if (cleaned) return cleaned;
  }

  // 3. UPI VPA as merchant fallback
  if (upiId) {
    const cleaned = cleanMerchant(upiId);
    if (cleaned) return cleaned;
  }

  const MERCHANT_CHARS = '[A-Za-z0-9 &.\'"\\-]{2,35}';

  if (type === 'debit') {
    const debitPatterns: RegExp[] = [
      new RegExp(`(?:paid\\s+to|payment\\s+to|sent\\s+to|transfer(?:red)?\\s+to|to)\\s+(${MERCHANT_CHARS})(?:\\s+(?:via|on|ref|using|with|for|vpa)|[.,]|$)`, 'i'),
      new RegExp(`(?:used\\s+at|swiped\\s+at|purchase\\s+at|spent\\s+at|charged\\s+at|payment\\s+at|at)\\s+(${MERCHANT_CHARS})(?:\\s+(?:on|ref|via|for)|[.,]|$)`, 'i'),
      new RegExp(`famcard.{0,40}at\\s+(${MERCHANT_CHARS})(?:\\.|,|$)`, 'i'),
      new RegExp(`(?:info|merchant)\\s*[:\\-]\\s*(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),
      new RegExp(`(?:towards|for\\s+payment\\s+of|payment\\s+towards)\\s+(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),
    ];
    for (const re of debitPatterns) {
      const m = text.match(re);
      if (m) {
        const c = cleanMerchant(m[1]);
        if (c) return c;
      }
    }
  }

  if (type === 'credit') {
    const creditPatterns: RegExp[] = [
      new RegExp(`(?:received\\s+from|from|by|sender)\\s+(${MERCHANT_CHARS})(?:\\s+(?:via|on|ref|using|has)|[.,]|$)`, 'i'),
      new RegExp(`(${MERCHANT_CHARS})\\s+has\\s+(?:sent|transferred|paid)`, 'i'),
      new RegExp(`credited\\s+(?:by|from)\\s+(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),
      new RegExp(`(?:neft|imps|rtgs)\\s+(?:cr|credit)[:\\s]+(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),
    ];
    for (const re of creditPatterns) {
      const m = text.match(re);
      if (m) {
        const c = cleanMerchant(m[1]);
        if (c) return c;
      }
    }
  }

  return null;
}

// ─── CATEGORY INFERENCE ───────────────────────────────────────────────────────
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/swiggy|zomato|domino|mcdonald|kfc|pizza|burger|cafe|restaurant|food|dineout|eazydiner|starbucks|chai/i, 'Food & Dining'],
  [/blinkit|zepto|instamart|bigbasket|dunzo|dmart|grocery|supermarket/i, 'Groceries & Essentials'],
  [/amazon|flipkart|myntra|meesho|ajio|nykaa|snapdeal|jiomart|tata\s*cliq|croma|vijay\s*sales|retail|store|trends/i, 'Shopping'],
  [/bpcl|hpcl|shell|iocl|petrol|fuel|indian\s*oil/i, 'Fuel'],
  [/apollo|medplus|pharmeasy|netmeds|1mg|hospital|clinic|doctor|pharmacy|healthkart/i, 'Healthcare'],
  [/netflix|spotify|hotstar|prime\s*video|youtube|pvr|inox|bookmyshow|disney/i, 'Entertainment'],
  [/uber|ola|rapido|metro|irctc|railway|flight|indigo|spicejet|airindia|makemytrip|redbus/i, 'Transport & Travel'],
  [/electricity|water\s*bill|airtel|jio\b|vodafone|vi\b|broadband|tataplay|dth|recharge|bescom/i, 'Bills & Utilities'],
  [/rent|housing|society|maintenance|flat|apartment|pg\b/i, 'Rent & Housing'],
  [/school|tuition|college|university|course|udemy|coursera/i, 'Education'],
  [/insurance|lic|term\s*plan|health\s*policy|premium|star\s*health/i, 'Insurance'],
  [/salary|payroll|stipend/i, 'Salary'],
  [/sip|mutual\s*fund|zerodha|groww|angel|upstox|stock/i, 'Investments'],
  [/paytm\s*merchant|pty|merchant/i, 'Shopping & Merchant'],
];

function extractCategory(
  merchant: string | null,
  rawText: string,
  method: ParsedTransaction['method'],
  type: 'debit' | 'credit',
  instrument: string
): string {
  const target = `${merchant ?? ''} ${rawText}`.toLowerCase();

  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(target)) return cat;
  }

  if (method === 'atm') return 'Cash Withdrawal';
  if (method === 'emi') return 'EMI / Loan';
  if (method === 'nach' || method === 'si') return 'Auto Debit';
  if (method === 'cheque') return type === 'credit' ? 'Cheque Received' : 'Cheque Issued';
  if (type === 'credit') return 'Income / Transfer';
  if (instrument.includes('Credit Card')) return 'Credit Card Payment';
  if (method === 'upi') return 'UPI Transfer';
  if (method === 'neft' || method === 'imps' || method === 'rtgs') return 'Bank Transfer';
  return 'General';
}

// ─── FINGERPRINT GENERATION ──────────────────────────────────────────────────
export function generateFingerprint(parsed: ParsedTransaction): string {
  const date = parsed.transaction_date?.split('T')[0] ?? new Date().toISOString().split('T')[0];
  const ref = parsed.transaction_ref ?? parsed.merchant ?? parsed.upi_id ?? 'no-ref';
  const raw = `${parsed.amount}-${parsed.bank}-${parsed.type}-${date}-${ref}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// ─── MAIN PARSER ─────────────────────────────────────────────────────────────
export function parseTransaction(text: string, source?: string, rawSender?: string): ParsedTransaction {
  const debug: string[] = [];
  const log = (msg: string) => { if (DEBUG_PARSER) debug.push(msg); };

  // 1. Normalise Whitespace & Entities
  const normalised = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  log(`Input: ${normalised}`);

  // 2. Hard-ignore Non-Transaction Notifications
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(normalised)) {
      log(`IGNORED by: ${pattern}`);
      return { is_transaction: false, _debug: debug };
    }
  }

  // 3. Extract Amount
  const amount = extractAmount(normalised);
  if (!amount) {
    log('No amount — skip');
    return { is_transaction: false, _debug: debug };
  }
  log(`Amount: ${amount}`);

  // 4. Classify Type (Debit / Credit)
  const type = classifyType(normalised);
  if (!type) {
    log('Cannot classify debit/credit — skip');
    return { is_transaction: false, _debug: debug };
  }
  log(`Type: ${type}`);

  // 5. Extract Supporting Metadata
  const account_last4    = extractAccount(normalised);
  const upiId            = extractUpiId(normalised);
  const bank             = extractBank(normalised + ' ' + (rawSender ?? ''));
  const ref              = extractRef(normalised);
  const balance_after    = extractBalance(normalised);
  const merchant         = extractMerchant(normalised, upiId, type);
  const transaction_date = extractDate(normalised);

  // 6. Instrument & Card Network Classification
  const { instrument, card_network, method } = extractInstrumentAndCard(normalised, upiId);
  const category = extractCategory(merchant, normalised, method, type, instrument);

  log(`Bank:${bank} Instrument:${instrument} Network:${card_network} Merchant:${merchant} Ref:${ref}`);

  return {
    is_transaction: true,
    amount,
    type,
    method,
    instrument,
    card_network,
    merchant,
    bank,
    account_last4,
    upi_id: upiId,
    balance_after,
    transaction_ref: ref,
    transaction_date,
    category,
    raw_source: source,
    raw_sender: rawSender,
    ...(DEBUG_PARSER ? { _debug: debug } : {}),
  };
}
