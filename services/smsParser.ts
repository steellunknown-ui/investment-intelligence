/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UNIVERSAL INDIAN TRANSACTION PARSER  v4.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles ALL Indian banking formats:
 *   Bank SMS (HDFC, SBI, ICICI, Axis, Kotak, PNB, BOB, Yes, IDFC, IndusInd,
 *             Canara, Union, Central, BOI, Indian, Federal, RBL, AU, …)
 *   UPI (GPay, PhonePe, Paytm, Amazon Pay, BHIM, …)
 *   Credit / Debit Cards (Visa, MC, RuPay, AmEx, FamPay, CRED, OneCard, Slice)
 *   Wallets (Paytm, MobiKwik, FreeCharge, …)
 *   Fintechs (NAVI, Jupiter, Niyo, Freo, KreditBee, ZestMoney, …)
 *   Transfer modes: NEFT, IMPS, RTGS, NACH, SI, Cheque, ATM, Net Banking, EMI
 *   Event types: debit, credit, deposit, withdrawal, refund, reversal, salary,
 *                cashback (actual credit), auto-debit, bounce/return
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ParsedTransaction {
  is_transaction: boolean;
  amount?: number;
  type?: 'credit' | 'debit';
  method?: 'upi' | 'card' | 'neft' | 'imps' | 'rtgs' | 'atm' | 'emi' |
           'netbanking' | 'wallet' | 'nach' | 'si' | 'cheque' | 'unknown';
  merchant?: string | null;
  bank?: string | null;
  account_last4?: string | null;
  upi_id?: string | null;
  balance_after?: number | null;
  transaction_ref?: string | null;
  transaction_date?: string;
  category?: string;
  raw_source?: string;   // 'sms' | 'notification'
  _debug?: string[];     // only populated when DEBUG_PARSER = true
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DEBUG_PARSER = false; // flip to true to get _debug[] reasoning in responses

// ─── HARD-IGNORE PATTERNS ─────────────────────────────────────────────────────
// These messages must NEVER be treated as real transactions.
// Keep this list TIGHT — do NOT add patterns that could match real transactions.
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
  /verify the transaction/i,
  /verify in your/i,
  /banking or upi app/i,
  /transferred to the recipient/i,       // NPCI UPI verification message
  /dear customer.{0,30}click/i,
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
  /linked.{0,20}(successfully|done|completed).{0,20}(bank|account|upi)/i,
  /account\s+(?:open|creat|register)/i,
];

// ─── AMOUNT EXTRACTION ────────────────────────────────────────────────────────
/**
 * Multi-strategy amount extractor — tries patterns from most-to-least specific.
 * Handles: ₹1,234.56 | Rs.1234 | INR 1,234 | "Amount: 2500" | "debited by 299"
 * Also handles Indian lakh notation: 1,23,456.78
 */
function extractAmount(text: string): number | null {
  const strategies: RegExp[] = [
    // S1 — ₹ symbol immediately before number (₹1,234.56 or ₹ 299)
    /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/,

    // S2 — Rs. / INR / Re. before number
    /(?:rs\.?\s*|inr\s*|re\.?\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S3 — "of Rs." / "of ₹" (older HDFC / SBI style)
    /(?:of\s*)(?:rs\.?\s*|inr\s*|₹\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S4 — "Amount: 2500" or "Amt: 1,200"
    /\bam(?:oun)?t[:\s]+([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S5 — "debited/credited/paid/charged by/for 299"
    /(?:debited|credited|paid|charged|spent|withdrawn|deposited)\s+(?:by\s+|for\s+|of\s+|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S6 — "for ₹/Rs/INR 500" or "for Rs.500"
    /for\s+(?:inr\s*|rs\.?\s*|₹\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S7 — "transfer of 5000" / "payment of 2300"
    /(?:transfer|payment|transaction)\s+of\s+(?:inr\s*|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S8 — NACH/SI style: "Auto-debit of 3,500"
    /(?:auto.?debit|standing\s+instruction|nach\s+debit)\s+(?:of\s+)?(?:inr\s*|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S9 — Cheque "Chq/Cheque for 10000"
    /ch(?:e?que|q)(?:\s+no\.?\s*\d+)?\s+(?:of\s+|for\s+)?(?:inr\s*|rs\.?\s*|₹\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,

    // S10 — Fallback: any standalone number ≥ 3 digits after currency keyword in sentence
    /(?:inr|rs|₹)\s*([0-9]{3,}(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
  ];

  for (const re of strategies) {
    const m = text.match(re);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0 && val < 100_000_000) return val; // sanity cap 10 Cr
    }
  }
  return null;
}

// ─── DEBIT / CREDIT CLASSIFICATION ───────────────────────────────────────────
/**
 * Returns 'debit', 'credit', or null (= not a transaction).
 * Rules are ordered most-specific → least-specific to avoid false positives.
 */
function classifyType(text: string): 'debit' | 'credit' | null {
  const t = text.toLowerCase();

  // ── HIGH-CONFIDENCE DEBIT SIGNALS ────────────────────────────────────────
  // Direct debit keywords
  if (/\b(debited|deducted|withdrawn|charged|spent)\b/.test(t)) return 'debit';

  // Paid / sent / transferred by the user
  if (/\b(paid to|sent to|payment\s+(?:of|to|made|done|successful)|transferred\s+(?:via|to|from\s+your))\b/.test(t)) return 'debit';

  // Generic "transferred" + net banking context = debit
  if (/\btransferred\b.{0,30}\b(net\s*banking|netbanking|online\s*banking|neft|imps|rtgs|upi)\b/.test(t)) return 'debit';
  if (/\b(neft|imps|rtgs|upi)\b.{0,30}\btransferred\b/.test(t)) return 'debit';

  // UPI sent
  if (/\b(you\s+(?:have\s+)?(?:sent|paid|transferred))\b/.test(t)) return 'debit';

  // Card / wallet used
  if (/\b(used\s+(?:at|for)|purchase(?:d)?\s+at|swiped\s+at)\b/.test(t)) return 'debit';

  // FamPay / fintech card used
  if (/famcard.{0,30}(used|charged|spent)/.test(t)) return 'debit';

  // Credit card payment = debit from user POV
  if (/credit\s+card.{0,40}(payment|paid|charged|debited|purchase|transaction|used)/.test(t)) return 'debit';
  if (/(purchase|transaction).{0,30}credit\s+card/.test(t)) return 'debit';
  if (/\bcard\s+(?:no\.?\s*)?(?:xx+|\*+)?\d{4}.{0,20}(?:used|charged|debited|swiped)/.test(t)) return 'debit';

  // ATM withdrawal
  if (/\b(atm\s+(?:withdrawal|cash)|cash\s+(?:withdrawal|withdrwl|withdrawn)|withdrew)\b/.test(t)) return 'debit';

  // EMI / NACH / Standing Instruction auto-debit
  if (/\b(emi|nach|auto.?debit|standing\s+instruction)\b.{0,30}\b(debited|deducted|processed|executed)\b/.test(t)) return 'debit';
  if (/\b(emi|nach|auto.?debit|standing\s+instruction)\b.{0,10}of.{0,10}(?:rs|inr|₹)/.test(t)) return 'debit';

  // "debit of Rs." / "debit instruction"
  if (/\bdebit\s+(?:of\s+)?(?:rs\.?|inr|₹)/i.test(text)) return 'debit';
  if (/debit\s+(?:alert|notification|advice)/i.test(text)) return 'debit';

  // Cheque cleared / honoured (debit from account)
  if (/\bch(?:e?que|q)\b.{0,30}\b(cleared|honoured|paid|debited)\b/.test(t)) return 'debit';

  // "has been debited"
  if (/has\s+been\s+(debited|deducted|charged|withdrawn)/.test(t)) return 'debit';

  // Transfer out
  if (/\b(neft|imps|rtgs|upi)\b.{0,30}\b(sent|transfer(?:red)?|paid|debited)\b/.test(t)) return 'debit';

  // ── HIGH-CONFIDENCE CREDIT SIGNALS ───────────────────────────────────────
  if (/\b(credited|received|refund(?:ed)?|deposited|reversed|cashback\s+(?:credited|received)|money\s+(?:added|loaded))\b/.test(t)) return 'credit';

  // Salary / payroll
  if (/\b(salary|payroll)\b.{0,30}\b(credited|received|transferred)\b/.test(t)) return 'credit';
  if (/\b(salary|payroll)\s+(?:of|for|credited)/i.test(t)) return 'credit';

  // NEFT/IMPS/RTGS/UPI received
  if (/\b(neft|imps|rtgs|upi)\b.{0,30}\b(credit(?:ed)?|received|transferred\s+to\s+your)\b/.test(t)) return 'credit';

  // "credit of Rs."
  if (/\bcredit\s+(?:of\s+)?(?:rs\.?|inr|₹)/i.test(text)) return 'credit';
  if (/credit\s+(?:alert|notification|advice)/i.test(text)) return 'credit';

  // Wallet top-up — Rs.X added to YOUR wallet = credit
  if (/\b(money\s+(?:added|received|loaded)|wallet\s+(?:loaded|topped?\s*up|credited)|added\s+to\s+your\s+(?:paytm|wallet|mobikwik|freecharge))\b/.test(t)) return 'credit';
  // "Rs.X added to wallet" — amount added = incoming credit
  if (/\badded\s+to\s+(?:your\s+)?(?:paytm|wallet|mobikwik|freecharge|amazon\s*pay)\b/.test(t)) return 'credit';

  // "has been credited"
  if (/has\s+been\s+(credited|received|deposited|refunded)/.test(t)) return 'credit';

  // Cheque deposited / cleared (credit to account)
  if (/\bch(?:e?que|q)\b.{0,30}\b(deposited|credited|cleared\s+and\s+credited)\b/.test(t)) return 'credit';

  // Bounce / return (treat as failed debit — skip)
  if (/\b(bounce(?:d)?|returned|dishonour(?:ed)?|insufficient\s+funds)\b/.test(t)) return null;

  return null;
}

// ─── METHOD EXTRACTION ────────────────────────────────────────────────────────
function extractMethod(text: string): ParsedTransaction['method'] {
  const t = text.toLowerCase();
  // Most specific first
  if (/\bnach\b|auto.?debit|standing\s+instruction/.test(t)) return 'nach';
  if (/\bsi\b.*(?:executed|processed)/.test(t)) return 'si';
  if (/ch(?:e?que|q)\s*(?:no\.?|number)?/.test(t)) return 'cheque';
  if (/\bupi\b/.test(t)) return 'upi';
  if (/\bneft\b/.test(t)) return 'neft';
  if (/\bimps\b/.test(t)) return 'imps';
  if (/\brtgs\b/.test(t)) return 'rtgs';
  if (/atm|cash\s+(?:withdrawal|withdrwl)/.test(t)) return 'atm';
  if (/\bemi\b/.test(t)) return 'emi';
  if (/net.?banking|netbanking|internet\s+banking|online\s+banking/.test(t)) return 'netbanking';
  if (/credit\s+card|debit\s+card|famcard|visa|mastercard|rupay|amex|american\s+express/.test(t)) return 'card';
  if (/\bcard\b/.test(t)) return 'card';
  if (/\bwallet\b|paytm|fampay|mobikwik|amazon\s+pay|freecharge/.test(t)) return 'wallet';
  return 'unknown';
}

// ─── BANK EXTRACTION ─────────────────────────────────────────────────────────
const BANK_MAP: Array<[RegExp, string]> = [
  // Private Banks
  [/hdfc/i,                              'HDFC Bank'],
  [/icici/i,                             'ICICI Bank'],
  [/axis\b|axisbk|axisbnk/i,            'Axis Bank'],
  [/kotak/i,                             'Kotak Bank'],
  [/yes\s*bank|yesb\b|yesbnk/i,         'Yes Bank'],
  [/idfc\s*first|idfc/i,                'IDFC First Bank'],
  [/indusind|indbnk/i,                  'IndusInd Bank'],
  [/federal\s*bank/i,                   'Federal Bank'],
  [/rbl\s*bank/i,                       'RBL Bank'],
  [/au\s*small|au\s*bank/i,             'AU Small Finance Bank'],
  [/karnataka\s*bank|ktkbnk/i,          'Karnataka Bank'],
  [/karur\s*vysya|kvb\b/i,              'Karur Vysya Bank'],
  [/south\s*indian\s*bank|sibnk/i,      'South Indian Bank'],
  [/dcb\s*bank/i,                       'DCB Bank'],
  [/equitas/i,                          'Equitas Small Finance Bank'],
  [/ujjivan/i,                          'Ujjivan Small Finance Bank'],
  [/jana\s*bank/i,                      'Jana Small Finance Bank'],
  // PSU Banks
  [/state\s*bank|sbi\b|sbicrd|sbiinb|sbiupi|sbipsg|sbimsg/i, 'SBI'],
  [/pnb\b|punjab\s*national/i,          'PNB'],
  [/bank\s*of\s*baroda|bob\b/i,         'Bank of Baroda'],
  [/canara\b|canbnk/i,                  'Canara Bank'],
  [/union\s*bank|unionb/i,              'Union Bank'],
  [/central\s*bank/i,                   'Central Bank of India'],
  [/bank\s*of\s*india\b/i,              'Bank of India'],
  [/indian\s*bank/i,                    'Indian Bank'],
  [/bank\s*of\s*maharashtra|mahabnk/i,  'Bank of Maharashtra'],
  [/uco\s*bank/i,                       'UCO Bank'],
  [/punjab\s*&?\s*sind/i,               'Punjab & Sind Bank'],
  // Fintech / UPI apps
  [/fampay|famcard/i,                   'FamPay'],
  [/google\s*pay|gpay|googlepay/i,      'GPay'],
  [/phonepe/i,                          'PhonePe'],
  [/paytm/i,                            'Paytm'],
  [/amazon\s*pay|amzpay/i,              'Amazon Pay'],
  [/mobikwik/i,                         'MobiKwik'],
  [/freecharge/i,                       'FreeCharge'],
  [/navi\b/i,                           'Navi'],
  [/slice\b/i,                          'Slice'],
  [/one\s*card|onecard/i,               'OneCard'],
  [/cred\b/i,                           'CRED'],
  [/jupiter/i,                          'Jupiter'],
  [/niyo\b/i,                           'Niyo'],
  [/freo\b/i,                           'Freo'],
  [/kreditbee/i,                        'KreditBee'],
  [/zestmoney/i,                        'ZestMoney'],
  [/bhim\b/i,                           'BHIM'],
  [/airtel\s*(?:payments?\s*bank|money)/i, 'Airtel Payments Bank'],
  [/jio\s*(?:payments?\s*bank|money)/i, 'Jio Payments Bank'],
  [/fino\s*(?:payments?\s*bank)/i,      'Fino Payments Bank'],
  [/india\s*post\s*payments/i,          'India Post Payments Bank'],
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
    /(?:xx+|x+|\*+)\s*(\d{4})\b/i,
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

// ─── UPI ID ───────────────────────────────────────────────────────────────────
function extractUpiId(text: string): string | null {
  // Standard VPA: chars@handle — exclude email-like patterns with dots before @
  const m = text.match(/\b([a-zA-Z0-9._\-+]{3,}@[a-zA-Z]{3,})\b/);
  return m ? m[1] : null;
}

// ─── REFERENCE / UTR ─────────────────────────────────────────────────────────
function extractRef(text: string): string | null {
  const patterns: RegExp[] = [
    /(?:utr|upi\s*ref(?:erence)?|upi\s*id)[.:\s#]*([A-Z0-9]{6,30})/i,
    /(?:ref(?:erence)?(?:\s*no\.?)?|txn(?:id)?|transaction\s+(?:id|no\.?|ref))[.:\s#]*([A-Z0-9]{6,30})/i,
    /(?:imps|neft|rtgs)\s*(?:ref|no\.?|id)[.:\s#]*([A-Z0-9]{6,30})/i,
    /(?:ch(?:e?que|q)\s*(?:no\.?|number)?)[.:\s#]*([0-9]{4,12})/i,
    /\b([0-9]{12})\b/,  // 12-digit UTR fallback
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
    /(?:avl\.?|avail\.?|available)\s*(?:bal(?:ance)?\.?)?\s*[:\-]?\s*(?:rs\.?\s*|₹\s*|inr\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:bal(?:ance)?)\.?\s*[:\-]?\s*(?:rs\.?\s*|₹\s*|inr\s*)?([0-9,]+(?:\.[0-9]{1,2})?)/i,
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
/**
 * Try to extract the transaction date from the SMS text itself.
 * Falls back to current time if nothing found.
 */
function extractDate(text: string): string {
  const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  // DD-Mon-YY or DD-Mon-YYYY (e.g. 29-Jul-26, 29-Jul-2026)
  const m1 = text.match(/(\d{1,2})[-\/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s](\d{2,4})/i);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const mon = MONTHS[m1[2].toLowerCase().slice(0, 3)];
    const yr = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
    return `${yr}-${mon}-${day}T00:00:00.000Z`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const m2 = text.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
  if (m2) {
    return `${m2[3]}-${m2[2]}-${m2[1]}T00:00:00.000Z`;
  }

  // YYYY-MM-DD (ISO)
  const m3 = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m3) {
    return `${m3[1]}-${m3[2]}-${m3[3]}T00:00:00.000Z`;
  }

  // DD/MM/YY
  const m4 = text.match(/(\d{2})[-\/](\d{2})[-\/](\d{2})\b/);
  if (m4) {
    return `20${m4[3]}-${m4[2]}-${m4[1]}T00:00:00.000Z`;
  }

  return new Date().toISOString();
}

// ─── MERCHANT EXTRACTION ─────────────────────────────────────────────────────
const JUNK_WORDS = /^(your|the|a|an|this|our|his|her|my|at|to|on|for|via|by|with|bank|account|acct|card|wallet|upi|payment|transaction|transfer|amount|balance|avl|avail|bal|debit|credit|neft|imps|rtgs|nach|si|atm)$/i;

function cleanMerchant(raw: string): string | null {
  // Strip trailing dates like "on 29-07-2026" or " on 29-Jul-26"
  const candidate = raw
    .trim()
    .replace(/\s+on\s+\d{1,2}[-/][A-Za-z0-9]{2,4}[-/]\d{2,4}$/i, '')
    .replace(/[.,;:!?]+$/, '')
    .trim();
  if (candidate.length < 2 || candidate.length > 40) return null;
  if (JUNK_WORDS.test(candidate)) return null;
  if (/^\d+$/.test(candidate)) return null;  // pure number
  return candidate;
}

function extractMerchant(
  text: string,
  upiId: string | null,
  type: 'debit' | 'credit',
): string | null {
  // 1. UPI VPA username as merchant (most reliable)
  if (upiId) {
    const name = upiId.split('@')[0];
    const cleaned = cleanMerchant(name);
    if (cleaned && cleaned.length > 2) return cleaned;
  }

  const MERCHANT_CHARS = '[A-Za-z0-9 &.\'"\\-]{2,35}';

  if (type === 'debit') {
    const debitPatterns: RegExp[] = [
      // "to MERCHANT" / "paid to MERCHANT"
      new RegExp(`(?:paid\\s+to|payment\\s+to|sent\\s+to|transfer(?:red)?\\s+to|to)\\s+(${MERCHANT_CHARS})(?:\\s+(?:via|on|ref|using|with|for|vpa)|[.,]|$)`, 'i'),

      // "at MERCHANT" (card swipe / POS)
      new RegExp(`(?:used\\s+at|swiped\\s+at|purchase\\s+at|spent\\s+at|charged\\s+at|payment\\s+at|at)\\s+(${MERCHANT_CHARS})(?:\\s+(?:on|ref|via|for)|[.,]|$)`, 'i'),

      // FamPay: "Your FamCard has been used for ₹X at MERCHANT"
      new RegExp(`famcard.{0,40}at\\s+(${MERCHANT_CHARS})(?:\\.|,|$)`, 'i'),

      // ICICI debit card: "Info: MERCHANT" (short format)
      new RegExp(`(?:info|merchant)\\s*[:\\-]\\s*(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),

      // "purchase at XYZ" / "txn at XYZ"
      new RegExp(`(?:purchase|txn|transaction)\\s+at\\s+(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),

      // "towards MERCHANT" (bill payments)
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
      // "from SENDER"
      new RegExp(`(?:received\\s+from|from|by|sender)\\s+(${MERCHANT_CHARS})(?:\\s+(?:via|on|ref|using|has)|[.,]|$)`, 'i'),

      // "SENDER has sent you"
      new RegExp(`(${MERCHANT_CHARS})\\s+has\\s+(?:sent|transferred|paid)`, 'i'),

      // Salary: "credited by COMPANY"
      new RegExp(`credited\\s+(?:by|from)\\s+(${MERCHANT_CHARS})(?:\\s|[.,]|$)`, 'i'),

      // NEFT credit: "NEFT CR:SENDER"
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
// Checks merchant + raw text for best category match.
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/swiggy|zomato|domino|mcdonald|kfc|pizza|burger|dunkin|cafe|restaurant|food|blinkit|zepto|instamart|bigbasket|dineout|eazydiner/i, 'Food & Dining'],
  [/amazon|flipkart|myntra|meesho|ajio|nykaa|snapdeal|jiomart|shopsy|tata\s*cliq|reliance\s*digital|croma|vijay\s*sales/i, 'Shopping'],
  [/bpcl|hpcl|shell|iocl|petrol|fuel|essar\s*oil|bp\b|indian\s*oil/i, 'Fuel'],
  [/apollo|medplus|pharmeasy|netmeds|1mg|hospital|clinic|doctor|pharmacy|healthkart|thyrocare|lal\s*path/i, 'Healthcare'],
  [/netflix|spotify|hotstar|prime\s*video|youtube\s*premium|zee5|jiocinema|sonyliv|mxplayer|crunchyroll|disney/i, 'Entertainment'],
  [/uber|ola|rapido|metro|irctc|railway|flight|indigo|spicejet|airindia|akasa|makemytrip|goibibo|redbus|yatra|bus|train|auto\s*rickshaw/i, 'Transport'],
  [/electricity|water\s*bill|airtel|jio\b|vodafone|vi\b|bsnl|broadband|act\s*fibernet|tataplay|dth|recharge|beam\s*cable/i, 'Utilities'],
  [/rent|housing|society|maintenance|hoa|flat|apartment|pg\b/i, 'Rent & Housing'],
  [/school|tuition|college|university|course|udemy|coursera|byju|unacademy|whitehat/i, 'Education'],
  [/insurance|lic|term\s*plan|health\s*policy|premium|bajaj\s*allianz|icici\s*lombard|star\s*health/i, 'Insurance'],
  [/salary|payroll/i, 'Salary'],
  [/sip|mutual\s*fund|zerodha|groww|angel|upstox|stock|mf\b|smallcase|kuvera|paytm\s*money/i, 'Investments'],
  [/swiggy\s*instamart|blinkit|zepto|dunzo|bigbasket/i, 'Groceries'],
  [/zomato|swiggy|eazydiner|dineout/i, 'Food & Dining'],
];

function extractCategory(
  merchant: string | null,
  rawText: string,
  method: ParsedTransaction['method'],
  type: 'debit' | 'credit',
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
  if (method === 'card') return 'Card Payment';
  if (method === 'upi') return 'UPI Transfer';
  if (method === 'neft' || method === 'imps' || method === 'rtgs') return 'Bank Transfer';
  return 'Others';
}

// ─── FINGERPRINT ─────────────────────────────────────────────────────────────
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
export function parseTransaction(text: string, source?: string): ParsedTransaction {
  const debug: string[] = [];
  const log = (msg: string) => { if (DEBUG_PARSER) debug.push(msg); };

  // ── Normalise ──────────────────────────────────────────────────────────────
  const normalised = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  log(`Input: ${normalised}`);

  // ── Step 1: Hard-ignore ────────────────────────────────────────────────────
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(normalised)) {
      log(`IGNORED by: ${pattern}`);
      return { is_transaction: false, _debug: debug };
    }
  }

  // ── Step 2: Amount ─────────────────────────────────────────────────────────
  const amount = extractAmount(normalised);
  if (!amount) {
    log('No amount — skip');
    return { is_transaction: false, _debug: debug };
  }
  log(`Amount: ${amount}`);

  // ── Step 3: Type ───────────────────────────────────────────────────────────
  const type = classifyType(normalised);
  if (!type) {
    log('Cannot classify debit/credit — skip');
    return { is_transaction: false, _debug: debug };
  }
  log(`Type: ${type}`);

  // ── Step 4: Supporting fields ──────────────────────────────────────────────
  const account_last4     = extractAccount(normalised);
  const upiId             = extractUpiId(normalised);
  const bank              = extractBank(normalised);
  const method            = extractMethod(normalised);
  const ref               = extractRef(normalised);
  const balance_after     = extractBalance(normalised);
  const merchant          = extractMerchant(normalised, upiId, type);
  const transaction_date  = extractDate(normalised);
  const category          = extractCategory(merchant, normalised, method, type);

  log(`Bank:${bank} Method:${method} Merchant:${merchant} Ref:${ref} Date:${transaction_date}`);

  return {
    is_transaction: true,
    amount,
    type,
    method,
    merchant,
    bank,
    account_last4,
    upi_id: upiId,
    balance_after,
    transaction_ref: ref,
    transaction_date,
    category,
    raw_source: source,
    ...(DEBUG_PARSER ? { _debug: debug } : {}),
  };
}

// ─── TEST HARNESS ─────────────────────────────────────────────────────────────
/**
 * Quick manual test — run from Node REPL or ts-node:
 *   import { testParser } from '@/services/smsParser';
 *   testParser("Rs.500 debited from SBI A/c XX1234 to SWIGGY on 29-Jul-26. Bal:Rs.8,450.00");
 */
export function testParser(text: string): void {
  const result = parseTransaction(text, 'test');
  console.log('─── PARSER v4.0 RESULT ──────────────────────────');
  console.log(JSON.stringify(result, null, 2));
  console.log('─────────────────────────────────────────────────');
}
