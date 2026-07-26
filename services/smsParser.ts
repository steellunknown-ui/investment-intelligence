export async function parseTransaction(rawText: string, sourceApp: string) {
  const apiKey = process.env.OPENROUTER_PARSER_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: OPENROUTER_PARSER_API_KEY is missing!");
    throw new Error("OPENROUTER_PARSER_API_KEY is not defined. Please check Vercel environment variables.");
  }

  console.log(`OpenRouter Parser: Using key starting with ${apiKey.substring(0, 8)}...`);

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
{
  "is_transaction": boolean,
  "amount": number or null,
  "type": "credit" or "debit" or null,
  "method": "upi" or "card" or "neft" or "imps" or "atm" or "emi" or "unknown",
  "merchant": string or null,
  "bank": string or null,
  "account_last4": string or null,
  "upi_id": string or null,
  "balance_after": number or null,
  "transaction_ref": string or null,
  "transaction_date": string
}

Input Message:
Source App: ${sourceApp}
Message Text: ${rawText}
  `;

  // We will insert the model name you choose here!
  const OPENROUTER_MODEL = "google/gemma-4-31b:free";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://investment-intelligence.vercel.app", // Optional but recommended by OpenRouter
        "X-Title": "Investment Intelligence", // Optional
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    if (!text) {
      throw new Error("OpenRouter returned an empty response.");
    }

    // Clean up potential markdown if the model ignored instructions
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("OpenRouter Detailed Error:", error);
    throw new Error(`OpenRouter API Failure: ${error.message || 'Unknown error'}`);
  }
}
