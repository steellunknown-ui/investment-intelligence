/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI ASSISTANT ENGINE (Groq Primary + OpenRouter Fallback)
 * ─────────────────────────────────────────────────────────────────────────────
 * - Primary: Groq API (openai/gpt-oss-120b / openai/gpt-oss-20b)
 *   Sub-second (<400ms) structured JSON inference.
 * - Fallback: OpenRouter API
 * ─────────────────────────────────────────────────────────────────────────────
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
 * Call Groq AI with JSON Mode
 */
async function callGroqDirect(
    userMessage: string,
    context: Record<string, any>,
    systemPromptOverride?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AIResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const systemPrompt = systemPromptOverride || buildSystemPrompt(context);

    // Keep up to 6 recent conversation turns for 8h conversational memory
    const formattedHistory = (history || [])
        .slice(-6)
        .map(h => ({
            role: h.role,
            content: h.content.length > 500 ? h.content.substring(0, 500) + '...' : h.content,
        }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...formattedHistory,
                { role: 'user', content: userMessage },
            ],
            temperature: 0.2,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API failed with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    return parseAIResponse(content);
}

/**
 * Call OpenRouter AI (Fallback)
 */
async function callOpenRouterDirect(
    userMessage: string,
    context: Record<string, any>,
    systemPromptOverride?: string
): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    const model = process.env.AI_MODEL || 'openai/gpt-oss-120b';
    const systemPrompt = systemPromptOverride || buildSystemPrompt(context);
    const combinedMessage = `${systemPrompt}\n\n---\n\nUSER MESSAGE: ${userMessage}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://investment-intelligence.vercel.app',
            'X-Title': 'Investment Intelligence',
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: combinedMessage }],
            temperature: 0.7,
            max_tokens: 1000,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in OpenRouter response');

    return parseAIResponse(content);
}

/**
 * Universal AI Caller (Groq Primary -> OpenRouter Fallback)
 */
export async function callAI(
    userMessage: string,
    context: Record<string, any> = {},
    systemPromptOverride?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AIResponse> {
    // 1. Try Groq first if key exists
    if (process.env.GROQ_API_KEY) {
        try {
            return await callGroqDirect(userMessage, context, systemPromptOverride, history);
        } catch (groqErr) {
            console.warn('Groq failed, attempting OpenRouter fallback:', groqErr);
        }
    }

    // 2. Fallback to OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        try {
            return await callOpenRouterDirect(userMessage, context, systemPromptOverride);
        } catch (openRouterErr) {
            console.error('OpenRouter fallback also failed:', openRouterErr);
        }
    }

    throw new Error('No AI service available. Please configure GROQ_API_KEY or OPENROUTER_API_KEY.');
}

// Backward-compatible alias
export const callOpenRouter = callAI;

/**
 * Parse and validate AI JSON response safely
 */
function parseAIResponse(content: string): AIResponse {
    try {
        let cleanContent = content.trim();
        cleanContent = cleanContent.replace(/^```json\n|\n```$/g, "").replace(/^```\n|\n```$/g, "");

        const raw = JSON.parse(cleanContent);

        // Safely normalize insights array regardless of whether model returned objects or strings
        let normalizedInsights: AIInsight[] = [];
        if (Array.isArray(raw.insights)) {
            normalizedInsights = raw.insights.slice(0, 3).map((item: any) => {
                if (typeof item === 'string') {
                    return {
                        type: 'info' as const,
                        title: 'Portfolio Insight',
                        detail: item,
                    };
                }
                return {
                    type: (['warning', 'info', 'success'].includes(item.type) ? item.type : 'info') as 'warning' | 'info' | 'success',
                    title: String(item.title || 'Insight'),
                    detail: String(item.detail || item.description || item.text || ''),
                    action: item.action && typeof item.action === 'object' ? {
                        label: String(item.action.label || 'View Details'),
                        href: String(item.action.href || '/dashboard'),
                    } : undefined,
                };
            });
        }

        return {
            summary: String(raw.summary || ''),
            insights: normalizedInsights,
            chat_reply: String(raw.chat_reply || raw.reply || raw.response || raw.message || raw.summary || 'I have analyzed your request.'),
        };
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
 * Generate portfolio insights
 */
export async function generateInsights(context: Record<string, any>): Promise<AIInsight[]> {
    try {
        const response = await callAI(
            'Analyze my portfolio and provide the top 3 most important insights.',
            context
        );
        return response.insights;
    } catch (error) {
        console.warn("AI Insights failed:", error);
        return [
            {
                type: 'info',
                title: 'AI Insights Temporarily Unavailable',
                detail: 'The AI analysis service is experiencing high traffic. Please check back later.',
                action: { label: 'Refresh Dashboard', href: '/dashboard' }
            }
        ];
    }
}
