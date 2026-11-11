/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GROQ AI TRANSACTION PARSER
 * ─────────────────────────────────────────────────────────────────────────────
 * Ultra-fast AI fallback using Groq (Llama 3.3 70B / Llama 3.1 8B).
 * Used when regex is uncertain, or for complex/unusual bank SMS formats.
 * Delivers structured JSON in < 250ms with zero regex brittleness.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ParsedTransaction } from './smsParser';

export async function parseTransactionWithGroq(
  rawText: string,
  source?: string,
  sender?: string
): Promise<ParsedTransaction | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const systemPrompt = `You are an expert Indian banking and UPI financial alert parser.
Your task is to extract structured financial transaction data from SMS or notification text into strict JSON.

Rules:
1. is_transaction: true ONLY if this message represents a real completed financial transaction (debit, credit, purchase, transfer, withdrawal).
   false if it is an OTP, login alert, KYC reminder, marketing offer, loan pre-approval, balance enquiry without transaction, or personal friend chat.
2. type: "debit" or "credit".
   - "Dr. from A/C" or "debited from" -> "debit"
   - "Cr. to A/C" or "credited to" -> "credit"
   - Compound messages like "Dr. from A/C ... and Cr. to merchant@vpa" are DEBITS from the user's account.
3. amount: numeric value (e.g. 150.00). Do not include ₹ or currency words.
4. bank: Standard bank name (e.g. "Bank of Baroda", "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "FamPay", "Slice", "Paytm Payments Bank").
5. account_last4: last 4 digits of the bank account or card (e.g. "9683").
6. merchant: clean recipient or business name (e.g. "Swiggy", "Zomato", "Starbucks", "Amazon", "Paytm Merchant"). Clean technical VPAs like "paytm.s2fqhc4@pty" to "Paytm Merchant (s2fqhc4)".
7. upi_id: UPI VPA if present (e.g. "paytm.s2fqhc4@pty").
8. method: one of "upi", "card", "neft", "imps", "rtgs", "atm", "emi", "netbanking", "wallet", "nach", "unknown".
9. instrument: one of:
   - "UPI (Bank Account)"
   - "RuPay Credit Card on UPI"
   - "Credit Card (Swipe/POS)"
   - "Credit Card (Online)"
   - "Debit Card"
   - "Wallet"
   - "Net Banking"
10. card_network: "RuPay", "Visa", "Mastercard", "Amex", or null.
11. transaction_ref: UTR or reference number (string).
12. balance_after: available balance if mentioned in message (numeric).
13. transaction_date: ISO 8601 string (e.g. "2026-11-09T09:35:26.000Z") if date/time is mentioned.
14. category: one of "Food & Dining", "Groceries & Essentials", "Shopping", "Fuel", "Healthcare", "Entertainment", "Transport & Travel", "Bills & Utilities", "Rent & Housing", "Salary", "Investments", "Shopping & Merchant", "General".

Output JSON format only:
{
  "is_transaction": boolean,
  "amount": number,
  "type": "debit" | "credit",
  "method": string,
  "instrument": string,
  "card_network": string | null,
  "bank": string | null,
  "account_last4": string | null,
  "merchant": string | null,
  "upi_id": string | null,
  "balance_after": number | null,
  "transaction_ref": string | null,
  "transaction_date": string | null,
  "category": string
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Sender/Source: ${sender || 'Unknown'}\nAlert Message: ${rawText}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API returned HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.is_transaction) {
      return { is_transaction: false, raw_source: source, raw_sender: sender };
    }

    return {
      is_transaction: true,
      amount: Number(parsed.amount),
      type: parsed.type,
      method: parsed.method || 'unknown',
      instrument: parsed.instrument || 'UPI (Bank Account)',
      card_network: parsed.card_network || null,
      merchant: parsed.merchant || null,
      bank: parsed.bank || null,
      account_last4: parsed.account_last4 ? String(parsed.account_last4) : null,
      upi_id: parsed.upi_id || null,
      balance_after: parsed.balance_after != null ? Number(parsed.balance_after) : null,
      transaction_ref: parsed.transaction_ref ? String(parsed.transaction_ref) : null,
      transaction_date: parsed.transaction_date || new Date().toISOString(),
      category: parsed.category || 'General',
      raw_source: source,
      raw_sender: sender,
    };
  } catch (err) {
    console.warn('Groq parsing exception (falling back):', err);
    return null;
  }
}

