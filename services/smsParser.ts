import { GoogleGenAI } from "@google/genai";

export async function parseTransaction(rawText: string, sourceApp: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing!");
    throw new Error("GEMINI_API_KEY is not defined. Please check Vercel environment variables.");
  }

  console.log(`Gemini Parser: Using key starting with ${apiKey.substring(0, 4)}...`);

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a financial transaction parser for Indian banking SMS and app notifications.
Extract transaction details and return them as JSON.
No explanation, no markdown, no extra text — only raw JSON.

Rules:
- Amounts are always in INR unless specified.
- 'type' is 'credit' if money was received, 'debit' if money was sent/spent.
- Extract merchant name if present, else null.
- Extract UPI ID if present, else null.
- Extract last 4 digits of card/account if present, else null.
- Extract transaction reference / UTR if present, else null.
- 'transaction_date' in ISO 8601 format. If no date in message, use: ${new Date().toISOString()}.
- If the message is NOT a financial transaction (OTP, promo, alert), set 'is_transaction' to false and leave other fields null.

Respond strictly with valid JSON with these keys:
- is_transaction (boolean)
- amount (number or null)
- type ("credit" or "debit" or null)
- method ("upi", "card", "neft", "imps", "atm", "emi", "unknown")
- merchant (string or null)
- bank (string or null)
- account_last4 (string or null)
- upi_id (string or null)
- balance_after (number or null)
- transaction_ref (string or null)
- transaction_date (string)

Input Message:
Source App: ${sourceApp}
Message Text: ${rawText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty response. Possible safety block.");
    }

    // Clean up potential markdown if the model ignored instructions
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("Gemini Detailed Error:", error);
    throw new Error(`Gemini API Failure: ${error.message || 'Unknown error'}`);
  }
}
