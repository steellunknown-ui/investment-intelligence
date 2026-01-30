/**
 * AI Assistant - Google Gemini Integration
 * Uses official @google/generative-ai SDK
 */

import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Zod schema for AI response validation
const AIInsightSchema = z.object({
    type: z.enum(['warning', 'info', 'success']),
    title: z.string(),
    detail: z.string(),
    action: z.object({
        label: z.string(),
        href: z.string(),
    }).optional(),
});

const AIResponseSchema = z.object({
    summary: z.string(),
    insights: z.array(AIInsightSchema).max(3),
    chat_reply: z.string(),
});

export type AIInsight = z.infer<typeof AIInsightSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

/**
 * Initialize Google AI Client
 */
function getGoogleAI() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY not configured');
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Call Google Gemini with JSON mode
 */
export async function callOpenRouter(
    userMessage: string,
    context: Record<string, any>,
    systemPromptOverride?: string
): Promise<AIResponse> {
    try {
        const genAI = getGoogleAI();
        // Use gemini-pro for reliability (stable model)
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPrompt = systemPromptOverride || buildSystemPrompt(context);
        const prompt = `${systemPrompt}\n\nUSER MESSAGE: ${userMessage}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return parseGeminiResponse(text);

    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error(`AI Service Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Parse and validate Gemini JSON response
 */
function parseGeminiResponse(content: string): AIResponse {
    try {
        let cleanContent = content.trim();
        // Remove markdown code blocks if present
        cleanContent = cleanContent.replace(/^```json\n|\n```$/g, "").replace(/^```\n|\n```$/g, "");

        const parsed = JSON.parse(cleanContent);
        return AIResponseSchema.parse(parsed);
    } catch (error) {
        console.error('Failed to parse AI response:', content);

        return {
            summary: 'Unable to generate specific insights right now.',
            insights: [],
            chat_reply: 'I understood your request but had trouble formatting the response. Please try again.',
        };
    }
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(context: Record<string, any>): string {
    return `You are a personal finance advisor for Investment Intelligence, analyzing a user's complete financial portfolio.

USER CONTEXT:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Start with a warm, professional greeting.
2. Provide actionable, specific insights based on the user's actual data.
3. Be concise and direct.
4. Focus on the most important 1-3 insights.
5. ALWAYS use Indian Rupees (₹) for all monetary values (e.g., ₹1,50,000).

RESPONSE FORMAT (Strict JSON):
{
  "summary": "One paragraph overview (2-3 sentences)",
  "insights": [
    {
      "type": "warning|info|success",
      "title": "Short title",
      "detail": "Specific detail",
      "action": { "label": "Action Text", "href": "/link" }
    }
  ],
  "chat_reply": "Natural conversational response"
}`;
}

/**
 * Generate insights without user message
 */
export async function generateInsights(context: Record<string, any>): Promise<AIInsight[]> {
    const response = await callOpenRouter(
        'Analyze my portfolio and provide the top 3 most important insights.',
        context
    );
    return response.insights;
}
