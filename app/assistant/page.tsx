"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Sparkles,
    Send,
    Wallet,
    AlertCircle,
    TrendingUp,
    Loader2,
} from "lucide-react";
import type { AIResponse, UserContext } from "@/lib/types";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hello! I'm your AI financial advisor. I can analyze your portfolio, provide insights, and answer questions about your finances. How can I help you today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<UserContext | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch context on mount
    useEffect(() => {
        fetchContext();
    }, []);

    const fetchContext = async () => {
        try {
            const res = await fetch("/api/ai/insights");
            if (res.ok) {
                const data = await res.json();
                // Context is embedded in the insights call
                // For now, we'll fetch it separately if needed
            }
        } catch (error) {
            console.error("Failed to fetch context:", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || errData.error || "Failed to get AI response");
            }

            const data: AIResponse = await res.json();

            const assistantMessage: Message = {
                role: "assistant",
                content: data.chat_reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("AI chat error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: error instanceof Error ? `Error: ${error.message}` : "I apologize, but I encountered an error. Please try again later.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <DashboardShell title="AI Assistant" description="Get personalized financial insights and advice">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                {/* Chat Section */}
                <div className="space-y-4">
                    <Card className="flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
                        {/* Message History */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                        }`}
                                >
                                    <div
                                        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === "assistant"
                                            ? "bg-emerald-100 dark:bg-primary/20"
                                            : "bg-slate-100 dark:bg-slate-800"
                                            }`}
                                    >
                                        {msg.role === "assistant" ? (
                                            <Sparkles className="h-4 w-4 text-primary dark:text-accent" />
                                        ) : (
                                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                                        )}
                                    </div>
                                    <div
                                        className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : "text-left"
                                            }`}
                                    >
                                        <div
                                            className={`inline-block px-4 py-3 rounded-2xl ${msg.role === "assistant"
                                                ? "bg-slate-100 dark:bg-slate-800 text-foreground"
                                                : "bg-primary text-white"
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 px-1">
                                            {msg.timestamp.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 dark:bg-primary/20 flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 text-primary dark:text-accent animate-spin" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="inline-block px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                                            <p className="text-sm text-muted-foreground">
                                                Analyzing your portfolio...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Section */}
                        <div className="border-t border-border p-4">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about your portfolio..."
                                    disabled={loading}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Context Panel */}
                <div className="space-y-4">
                    {/* Net Worth Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="icon-container bg-primary">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="font-semibold text-sm">Portfolio Summary</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Net Worth</p>
                                <p className="text-xl font-bold text-foreground">
                                    {context ? formatCurrency(context.netWorth.total) : "---"}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-slate-500">Assets</p>
                                    <p className="font-medium text-primary">
                                        {context ? formatCurrency(context.netWorth.assets) : "---"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Liabilities</p>
                                    <p className="font-medium text-slate-600">
                                        {context ? formatCurrency(context.netWorth.liabilities) : "---"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alerts Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="icon-container bg-amber-100 dark:bg-amber-900/30">
                                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-semibold text-sm">Alerts</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Unread Alerts
                                </span>
                                <span className="font-semibold text-foreground">
                                    {context?.alerts || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Overdue Insurance
                                </span>
                                <span className="font-semibold text-amber-600">
                                    {context?.insurance.overdue || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-slate-600" />
                                <h3 className="font-semibold text-sm">Quick Insights</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Ask me about:
                            </p>
                            <div className="space-y-1">
                                {[
                                    "How is my portfolio performing?",
                                    "What should I prioritize?",
                                    "Any overdue payments?",
                                ].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(suggestion)}
                                        className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    );
}
