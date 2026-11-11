"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Bot,
  Send,
  Wallet,
  AlertCircle,
  TrendingUp,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { AIResponse, UserContext } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = "investment_assistant_chat_v1";
const STORAGE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const DEFAULT_WELCOME: Message = {
  role: "assistant",
  content:
    "Welcome to your Private Wealth Intelligence Console. I have direct encrypted access to your consolidated balance sheet, accounts, and insurance policies. What would you like to analyze today?",
  timestamp: new Date(),
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<UserContext | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isRestoredFromMemory, setIsRestoredFromMemory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. RESTORE CHAT FROM LOCAL STORAGE (8-HOUR WINDOW)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const age = Date.now() - (parsed.savedAt || 0);

        if (age < STORAGE_TTL_MS && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          const restored: Message[] = parsed.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(restored);
          setIsRestoredFromMemory(true);
        } else {
          // Expired past 8 hours — clean up
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  // 2. PERSIST CHAT TO LOCAL STORAGE ON UPDATES
  const persistMessages = (newMessages: Message[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
          })),
        })
      );
    } catch (e) {
      console.error("Failed to persist chat:", e);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch live context for summary card
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await fetch("/api/dashboard/net-worth");
        if (res.ok) {
          const data = await res.json();
          setContext({
            profile: { full_name: "Investor", email: "" },
            netWorth: {
              assets: data.assetsTotalValue || 0,
              liabilities: data.liabilitiesOutstandingTotal || 0,
              total: data.netWorth || 0,
            },
            accounts: {
              total: data.bank_accounts || 0,
              balance: data.bankBalanceTotal || 0,
            },
            insurance: {
              total: 0,
              overdue: 0,
            },
            receivables: data.receivablesOutstandingTotal || 0,
            alerts: 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch context:", error);
      }
    };
    fetchContext();
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        role: "assistant",
        content: "Session memory cleared. I am ready for your next inquiry.",
        timestamp: new Date(),
      },
    ]);
    setIsRestoredFromMemory(false);
    toast.success("Chat history reset");
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    persistMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Pass previous turns for 8h conversational context
      const historyPayload = nextMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
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

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } catch (error: any) {
      console.error("AI chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: error instanceof Error ? error.message : "Service busy. Please try again shortly.",
        timestamp: new Date(),
      };
      const finalMessages = [...nextMessages, errorMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages);
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
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardShell
      title="Financial Intelligence AI"
      description="Groq-powered private portfolio advisor with 8h active memory"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearHistory}
          className="text-xs gap-1.5 border-border bg-card hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          Reset Chat Memory
        </Button>
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Chat Section */}
        <div className="space-y-4">
          <Card className="flex flex-col rounded-3xl border border-border shadow-sm overflow-hidden" style={{ height: "calc(100vh - 210px)" }}>
            {/* Chat Status Bar */}
            <div className="px-5 py-3 border-b border-border/70 bg-muted/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-emerald-600 dark:text-[#BBF078]" />
                  Groq Model (120B) Active
                </span>
                <span className="text-muted-foreground hidden sm:inline">|</span>
                <span className="text-muted-foreground text-[11px] hidden sm:inline font-mono">
                  8-Hour Context Retention
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-background">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={index}
                    className={`flex gap-3 group ${isAssistant ? "flex-row" : "flex-row-reverse"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 h-9 w-9 rounded-2xl flex items-center justify-center border shadow-sm ${
                        isAssistant
                          ? "bg-slate-900 border-slate-800 text-lime-400 dark:text-[#BBF078]"
                          : "bg-primary/10 border-primary/20 text-primary"
                      }`}
                    >
                      {isAssistant ? (
                        <Bot className="h-5 w-5" />
                      ) : (
                        <span className="text-xs font-bold font-mono">ME</span>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div className={`flex-1 max-w-[85%] sm:max-w-[78%] ${isAssistant ? "text-left" : "text-right"}`}>
                      <div
                        className={`inline-block px-4 sm:px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm transition-all ${
                          isAssistant
                            ? "bg-card border border-border text-foreground rounded-tl-sm"
                            : "bg-slate-900 dark:bg-slate-800 text-white border border-slate-700/60 rounded-tr-sm"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Footer: Timestamp & Copy Action */}
                      <div className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-muted-foreground ${isAssistant ? "justify-start" : "justify-end"}`}>
                        <span>
                          {msg.timestamp.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        {isAssistant && (
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
                            title="Copy response"
                          >
                            {copiedIdx === index ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lime-400 dark:text-[#BBF078] shrink-0">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border text-muted-foreground text-xs font-mono">
                    Analyzing portfolio &amp; generating insights...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips (Above Input) */}
            <div className="px-4 py-2 bg-muted/20 border-t border-border/50 flex overflow-x-auto gap-2 scrollbar-hide">
              {[
                "Analyze my asset allocation & risk",
                "Summarize my consolidated net worth",
                "Check emergency fund liquidity",
                "Any overdue payments or debts?",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  className="whitespace-nowrap px-3 py-1 rounded-full bg-card hover:bg-muted border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Section */}
            <div className="border-t border-border p-3 sm:p-4 bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your net worth, expenses, or assets..."
                  disabled={loading}
                  className="flex-1 rounded-xl h-11 text-sm bg-muted/30 border-border"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-lime-400 hover:bg-lime-500 text-slate-950 dark:bg-[#BBF078] dark:hover:bg-[#aee663] dark:text-slate-950 font-bold h-11 px-4 rounded-xl gap-1.5 shadow-sm transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  ) : (
                    <Send className="h-4 w-4 text-slate-950" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Context Panel (Desktop) */}
        <div className="space-y-4 hidden lg:block">
          {/* Net Worth Card */}
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-lime-400/20 text-lime-800 dark:text-[#BBF078] flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Portfolio Snapshot</h3>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Estimated Net Worth</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {context ? formatCurrency(context.netWorth.total) : "₹0"}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground text-[10px] uppercase">Assets</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {context ? formatCurrency(context.netWorth.assets) : "₹0"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase">Liabilities</p>
                <p className="font-semibold text-red-600 dark:text-red-400 font-mono">
                  {context ? formatCurrency(context.netWorth.liabilities) : "₹0"}
                </p>
              </div>
            </div>
          </Card>

          {/* Privacy Specs Card */}
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-[#BBF078]" />
              <span className="text-xs font-bold text-foreground">Encrypted Pipeline</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your conversations are processed through an isolated context window and cached locally
              for 8 hours on your device.
            </p>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>Session Expiration:</span>
              <span className="font-semibold text-foreground">8 Hours</span>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
