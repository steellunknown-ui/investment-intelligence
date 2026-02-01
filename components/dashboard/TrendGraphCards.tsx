"use client";

import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from "recharts";
import { MotionCard } from "@/components/ui/MotionCard";

const assetsTrendData = [
    { label: "Jan", value: 120000 },
    { label: "Feb", value: 135000 },
    { label: "Mar", value: 128000 },
    { label: "Apr", value: 145000 },
    { label: "May", value: 160000 },
    { label: "Jun", value: 175000 },
];

const liabilitiesTrendData = [
    { label: "Jan", value: 85000 },
    { label: "Feb", value: 82000 },
    { label: "Mar", value: 78000 },
    { label: "Apr", value: 75000 },
    { label: "May", value: 70000 },
    { label: "Jun", value: 65000 },
];

const netWorthTrendData = [
    { label: "Jan", value: 35000 },
    { label: "Feb", value: 53000 },
    { label: "Mar", value: 50000 },
    { label: "Apr", value: 70000 },
    { label: "May", value: 90000 },
    { label: "Jun", value: 110000 },
];

export function AssetsTrendCard() {
    return (
        <MotionCard className="vault-card p-4" delay={0.1}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Assets Trend
            </p>
            <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={assetsTrendData}>
                        <defs>
                            <linearGradient id="assetsFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#assetsFill)"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </MotionCard>
    );
}

export function LiabilitiesTrendCard() {
    return (
        <MotionCard className="vault-card p-4" delay={0.15}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Liabilities Trend
            </p>
            <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liabilitiesTrendData}>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </MotionCard>
    );
}

export function NetWorthTrendCard() {
    return (
        <MotionCard className="vault-card p-4" delay={0.2}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Net Worth Trend
            </p>
            <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={netWorthTrendData}>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </MotionCard>
    );
}
