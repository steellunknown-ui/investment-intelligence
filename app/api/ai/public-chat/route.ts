import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/ai';

// Simple in-memory rate limiter (for demo purposes)
// In production, use Redis or Upstash
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

const PUBLIC_SYSTEM_PROMPT = `
You are a public educational finance chatbot for an Indian personal finance app ("Investment Intelligence").

RULES:
1. EDUCATIONAL ONLY: Explain concepts like SIP, Mutual Funds, IPOs, PPF, Gold, etc.
2. NO PERSONAL ADVICE: Do NOT analyze portfolios or recommend specific stocks to buy/sell.
3. REFUSAL PROTOCOL: If user asks for personal advice ("analyze my portfolio", "what stock to buy"), respond: 
   "I can't provide personalized advice here. Please [Sign Up](/signup) to get tailored insights."
4. CONTEXT: Always use Indian Rupees (₹) and Indian market examples.
5. FORMAT: Keep answers short (max 3 sentences), structured, and beginner-friendly.

RESPONSE FORMAT (Strict JSON):
{
  "summary": "1-sentence concept summary",
  "insights": [], 
  "chat_reply": "Your helpful explanation here."
}
IMPORTANT: "insights" MUST be an empty array []. Do not put anything inside it.
`;

export async function POST(req: NextRequest) {
    try {
        // 1. Rate Limiting
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

        if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
            userLimit.count = 0;
            userLimit.lastReset = now;
        }

        if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        userLimit.count++;
        rateLimitMap.set(ip, userLimit);

        // 2. Input Validation
        const body = await req.json();
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (message.length > 500) {
            return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });
        }

        // 3. Call AI with SPECIAL SYSTEM PROMPT
        // Pass empty context as this is public
        const aiResponse = await callOpenRouter(message, {}, PUBLIC_SYSTEM_PROMPT);

        return NextResponse.json(aiResponse);
    } catch (error) {
        console.error('Public AI chat error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process request',
                details: 'Service busy',
            },
            { status: 500 }
        );
    }
}
