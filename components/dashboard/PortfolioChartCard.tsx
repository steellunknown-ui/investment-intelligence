"use client";

import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioChartCardProps {
    totalValue: number;
}

// Generate mock historical data for demo
function generateMockData(currentValue: number) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const baseValue = currentValue * 0.7; // Start at 70% of current value

    return months.map((month, index) => {
        const progress = (index + 1) / months.length;
        const noise = (Math.random() - 0.5) * 0.1 * baseValue;
        const value = baseValue + (currentValue - baseValue) * progress + noise;

        return {
            month,
            value: Math.round(value),
        };
    });
}

// Format currency for tooltip
function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export function PortfolioChartCard({ totalValue }: PortfolioChartCardProps) {
    const data = useMemo(() => generateMockData(totalValue), [totalValue]);

    const firstValue = data[0]?.value ?? 0;
    const lastValue = data[data.length - 1]?.value ?? 0;
    const growth = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    const isPositive = growth >= 0;

    return (
        <Card className="overflow-hidden">
            <CardHeader
                title="Portfolio Performance"
                description="6-month growth trend"
                action={
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${isPositive
                            ? "bg-primary/10 text-primary"
                            : "bg-red-50 text-red-600"
                        }`}>
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        {isPositive ? "+" : ""}{growth.toFixed(1)}%
                    </div>
                }
            />
            <CardContent className="p-0 pb-4">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 5, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f1f5f9"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                                dx={-10}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-3">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {formatCurrency(payload[0].value as number)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {payload[0].payload.month} 2026
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="url(#portfolioGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
