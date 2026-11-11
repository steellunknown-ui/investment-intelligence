"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bot, X, Send, Loader2, RotateCcw, Copy, Check, MessageSquareCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "investment_public_chat_v1";
const STORAGE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const DEFAULT_WELCOME: Message = {
  role: "assistant",
  content:
    "Hello! I am your Financial Intelligence guide. Ask me about SIPs, RuPay UPI Credit Cards, Sovereign Gold Bonds, or how our nominee protection works.",
};

const SUGGESTIONS = [
  "How does RuPay CC on UPI work?",
  "What is the Nominee Inactivity Sentinel?",
  "Benefits of Sovereign Gold Bonds",
  "How does automated deduplication work?",
];

export function PublicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. RESTORE CHAT FROM LOCAL STORAGE (8-HOUR WINDOW)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const age = Date.now() - (parsed.savedAt || 0);

        if (age < STORAGE_TTL_MS && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to restore public chat:", e);
    }
  }, []);

  // 2. PERSIST CHAT TO LOCAL STORAGE
  const persistChat = (updated: Message[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          messages: updated,
        })
      );
    } catch (e) {
      console.error("Failed to persist public chat:", e);
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, loading]);

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([DEFAULT_WELCOME]);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSend = async (overrideText?: string) => {
    const userMessage = (overrideText || input).trim();
    if (!userMessage || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(nextMessages);
    persistChat(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Pass previous 6 messages for 8h conversational memory
      const historyPayload = nextMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/public-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: historyPayload,
        }),
      });

      if (res.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment.");
      }

      if (!res.ok) {
        throw new Error("Unable to retrieve response right now.");
      }

      const data = await res.json();
      const finalMessages: Message[] = [
        ...nextMessages,
        {
          role: "assistant",
          content: data.chat_reply || "I couldn't process that. Try asking simply.",
        },
      ];
      setMessages(finalMessages);
      persistChat(finalMessages);
    } catch (error: any) {
      const errorMessages: Message[] = [
        ...nextMessages,
        {
          role: "assistant",
          content: error.message || "Something went wrong. Please try again.",
        },
      ];
      setMessages(errorMessages);
      persistChat(errorMessages);
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

  // Parse markdown links like [Sign Up](/signup)
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            className="text-emerald-600 dark:text-[#BBF078] underline hover:opacity-80 font-semibold"
          >
            {match[1]}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[380px] max-w-[calc(100vw-32px)] bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
            style={{ maxHeight: "540px", height: "540px" }}
          >
            {/* Header (Bespoke Obsidian & Electric Lime) */}
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lime-400 dark:text-[#BBF078]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs tracking-tight text-white">
                      Financial Intelligence Guide
                    </h3>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    8h Memory Active · Groq 120B
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  title="Reset Chat Memory"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm relative ${
                        isUser
                          ? "bg-slate-900 dark:bg-slate-800 text-white rounded-br-sm border border-slate-700/50"
                          : "bg-card text-foreground border border-border rounded-tl-sm"
                      }`}
                    >
                      {renderMessageContent(msg.content)}

                      {!isUser && (
                        <div className="flex justify-end mt-1 pt-1 border-t border-border/40">
                          <button
                            onClick={() => handleCopy(msg.content, idx)}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            {copiedIdx === idx ? (
                              <>
                                <Check className="h-2.5 w-2.5 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-2.5 w-2.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-[#BBF078]" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-3 py-1.5 bg-muted/30 border-t border-border/50 flex overflow-x-auto gap-1.5 scrollbar-hide">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-card hover:bg-muted border border-border text-[10px] text-muted-foreground hover:text-foreground transition-all shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about SIPs, UPI CC, Nominees..."
                  className="flex-1 text-xs sm:text-sm bg-muted/40 border-border rounded-xl h-10"
                  disabled={loading}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="bg-lime-400 hover:bg-lime-500 text-slate-950 dark:bg-[#BBF078] dark:hover:bg-[#aee663] h-10 w-10 p-0 rounded-xl shrink-0 font-bold"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[9px] text-center text-muted-foreground mt-2 font-mono">
                Encrypted Session • Memory Persisted 8 Hours
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button (Sleek Obsidian & Lime) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Financial Guide"
        className={`h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${
          isOpen
            ? "bg-slate-900 text-white border border-slate-700"
            : "bg-slate-950 text-lime-400 dark:text-[#BBF078] border border-slate-800 hover:border-lime-400/50"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
