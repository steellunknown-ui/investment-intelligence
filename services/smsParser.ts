import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = process.env.GEMINI_API_KEY;

export async function parseTransaction(rawText: string, sourceApp: string) {
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables!");
    throw new Error("GEMINI_API_KEY is not defined in environment variables. Please check Vercel settings.");
  }

  console.log("Gemini Parser: Initializing with model gemini-1.5-flash. Raw text length:", rawText.length);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `
You are a financial transaction parser for Indian banking SMS and app notifications.
Extract transaction details and return them as JSON according to the schema.
No explanation, no markdown, no extra text.

Rules:
- Amounts are always in INR unless specified.
- 'type' is 'credit' if money was received, 'debit' if money was sent/spent.
- Extract merchant name if present, else null.
- Extract UPI ID if present, else null.
- Extract last 4 digits of card/account if present, else null.
- Extract transaction reference / UTR if present, else null.
- 'transaction_date' in ISO 8601 format. If no date is mentioned in the message, output the current date/time which is ${new Date().toISOString()}.
- If the message is NOT a financial transaction (e.g., OTP, promotional offer, low balance alert), set 'is_transaction' to false and you can leave other fields null.

Respond strictly with valid JSON with the following keys:
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown if the model ignored config
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("Gemini Parsing Error Details:", error);
    // Provide a more descriptive error back to the route
    throw new Error(`Gemini API Error: ${error.message || 'Unknown parsing failure'}`);
  }
}
