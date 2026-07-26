import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function parseTransaction(rawText: string, sourceApp: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing!");
    throw new Error("GEMINI_API_KEY is not defined. Please check Vercel environment variables.");
  }

  // Log API Key presence (safe way)
  console.log(`Gemini Parser: Using key starting with ${apiKey.substring(0, 4)}...`);

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use the canonical model name 'gemini-1.5-flash-latest' to ensure it's found
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
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
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini returned an empty response. Possible safety block.");
    }

    // Clean up potential markdown if the model ignored config
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("Gemini Detailed Error:", error);
    throw new Error(`Gemini API Failure: ${error.message || 'Unknown error'}`);
  }
}
