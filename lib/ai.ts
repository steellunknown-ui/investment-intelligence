/**
 * AI Assistant - Moonshot AI Integration
 * Uses OpenRouter API with Moonshot AI models
 */

import { z } from 'zod';

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
 * Call Moonshot AI via OpenRouter
 */
export async function callOpenRouter(
    userMessage: string,
    context: Record<string, any>,
    systemPromptOverride?: string
): Promise<AIResponse> {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY not configured');
        }

        const model = process.env.AI_MODEL || 'google/gemma-3-12b-it:free';
        const systemPrompt = systemPromptOverride || buildSystemPrompt(context);

        // Combine system and user message for models that don't support system role
        const combinedMessage = `${systemPrompt}\n\n---\n\nUSER MESSAGE: ${userMessage}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://investment-intellegince.vercel.app',
                'X-Title': 'Investment Intelligence'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'user', content: combinedMessage }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content in API response');
        }

        return parseAIResponse(content);

    } catch (error) {
        console.error('Moonshot AI Error:', error);
        throw new Error(`AI Service Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Parse and validate AI JSON response
 */
function parseAIResponse(content: string): AIResponse {
    try {
        let cleanContent = content.trim();
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
6. Respond with valid JSON only.

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