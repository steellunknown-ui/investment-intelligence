"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Sparkles,
    AlertTriangle,
    Info,
    CheckCircle,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AIInsight } from "@/lib/types";

export function AIInsightsCard() {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/ai/insights");

            if (!res.ok) {
                throw new Error("Failed to fetch insights");
            }

            const data = await res.json();
            setInsights(data.insights.slice(0, 3)); // Top 3 only
        } catch (err) {
            console.error("AI insights error:", err);
            setError("Unable to load insights");
        } finally {
            setLoading(false);
        }
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
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
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
                    <p className="text-sm text-slate-500 text-center py-8">{error}</p>
                </CardContent>
            </Card>
        );
    }

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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/assistant")}
                        className="text-xs h-7"
                    >
                        View All
                    </Button>
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
