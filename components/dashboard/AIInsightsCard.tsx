"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Sparkles,
    AlertTriangle,
    Info,
    CheckCircle,
    ArrowRight,
    Loader2,
    RefreshCw,
    Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AIInsight } from "@/lib/types";

export function AIInsightsCard() {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [hasGenerated, setHasGenerated] = useState(false);
    const router = useRouter();

    const fetchInsights = async () => {
        // Don't fetch if rate limited
        if (isRateLimited) return;

        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/ai/insights");

            // Handle rate limit (429)
            if (res.status === 429) {
                setIsRateLimited(true);
                setError("AI insights temporarily unavailable. Too many requests.");
                startCooldown(60); // 60 second cooldown
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch insights");
            }

            const data = await res.json();
            setInsights(data.insights.slice(0, 3)); // Top 3 only
            setHasGenerated(true);
        } catch (err) {
            console.error("AI insights error:", err);
            const errorMessage = err instanceof Error ? err.message : "Unable to load insights";

            // Check if error message indicates rate limiting
            if (errorMessage.toLowerCase().includes("rate") || errorMessage.includes("429")) {
                setIsRateLimited(true);
                setError("AI insights temporarily unavailable. Try again in a few minutes.");
                startCooldown(60);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const startCooldown = (seconds: number) => {
        setCooldownSeconds(seconds);
        const interval = setInterval(() => {
            setCooldownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsRateLimited(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const getIcon = (type: AIInsight["type"]) => {
        switch (type) {
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-amber-600" />;
            case "info":
                return <Info className="h-4 w-4 text-blue-600" />;
            case "success":
                return <CheckCircle className="h-4 w-4 text-emerald-600" />;
        }
    };

    const getColor = (type: AIInsight["type"]) => {
        switch (type) {
            case "warning":
                return "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20";
            case "info":
                return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20";
            case "success":
                return "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20";
        }
    };

    // Loading state
    if (loading) {
        return (
            <Card className="vault-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="icon-container bg-purple-100 dark:bg-purple-900/30">
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Insights</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                        <p className="text-xs text-slate-500">Generating insights...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Rate limited state
    if (isRateLimited) {
        return (
            <Card className="vault-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="icon-container bg-purple-100 dark:bg-purple-900/30">
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Insights</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 px-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            AI insights temporarily unavailable.
                        </p>
                        <p className="text-xs text-slate-500 mb-4">
                            Try again {cooldownSeconds > 0 ? `in ${cooldownSeconds}s` : "now"}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={fetchInsights}
                            disabled={cooldownSeconds > 0}
                            className="gap-2"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state (non-rate-limit)
    if (error && !isRateLimited) {
        return (
            <Card className="vault-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="icon-container bg-purple-100 dark:bg-purple-900/30">
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Insights</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <p className="text-sm text-red-500 mb-3">{error}</p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={fetchInsights}
                            className="gap-2"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Initial state - not yet generated
    if (!hasGenerated && insights.length === 0) {
        return (
            <Card className="vault-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="icon-container bg-purple-100 dark:bg-purple-900/30">
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Insights</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Get personalized insights about your portfolio
                        </p>
                        <Button
                            size="sm"
                            onClick={fetchInsights}
                            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                        >
                            <Sparkles className="h-3 w-3" />
                            Generate Insights
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Has insights
    return (
        <Card className="vault-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="icon-container bg-purple-100 dark:bg-purple-900/30">
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm">AI Insights</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchInsights}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                            title="Refresh insights"
                        >
                            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/assistant")}
                            className="text-xs h-7"
                        >
                            View All
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {insights.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500 mb-3">
                            No insights available yet
                        </p>
                        <Button
                            size="sm"
                            onClick={() => router.push("/assistant")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Chat with AI
                        </Button>
                    </div>
                ) : (
                    <>
                        {insights.map((insight, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${getColor(insight.type)}`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                                            {insight.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                            {insight.detail}
                                        </p>
                                        {insight.action && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(insight.action!.href)}
                                                className="mt-2 h-6 text-xs gap-1 p-0 hover:underline"
                                            >
                                                {insight.action.label}
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/assistant")}
                            className="w-full mt-2"
                        >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Ask AI Assistant
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

