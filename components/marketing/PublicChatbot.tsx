"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, X, MessageCircle, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function PublicChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm your financial guide. Ask me about Stocks, IPOs, SIPs, or Investment basics!",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/public-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            if (res.status === 429) {
                throw new Error("You're asking too fast! Please wait a moment.");
            }

            if (!res.ok) {
                throw new Error("Failed to get response");
            }

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.chat_reply || "I couldn't process that. Try asking simply." },
            ]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: error.message || "Something went wrong. Please try again." },
            ]);
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

    // Helper to parse links like [Sign Up](/signup) in response
    const renderMessageContent = (text: string) => {
        // Simple regex to replace markdown links with real links
        const parts = text.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, i) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return (
                    <a
                        key={i}
                        href={match[2]}
                        className="text-primary underline hover:text-primary font-medium"
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-[350px] max-w-[calc(100vw-48px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
                        style={{ maxHeight: "500px", height: "500px" }}
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Financial Guide</h3>
                                    <p className="text-xs text-emerald-100">Ask about investing basics</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                                ? "bg-primary text-white rounded-br-none"
                                                : "bg-card text-slate-800 dark:text-slate-200 border border-border rounded-bl-none"
                                            }`}
                                    >
                                        {renderMessageContent(msg.content)}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-card rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-border">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-border">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about IPOs, SIPs..."
                                    className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-emerald-500"
                                    disabled={loading}
                                    autoFocus
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="bg-primary hover:bg-primary/90 text-white h-10 w-10 p-0 rounded-lg shrink-0"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-2">
                                AI can make mistakes. Not financial advice.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${isOpen
                        ? "bg-slate-800 text-white hover:bg-slate-900"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-7 w-7" />
                )}
            </motion.button>
        </div>
    );
}
