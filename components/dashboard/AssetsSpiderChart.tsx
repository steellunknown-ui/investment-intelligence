"use client";

import { useEffect, useState } from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { MotionCard } from "@/components/ui/MotionCard";
import { ChartExplanationModal } from "./ChartExplanationModal";

interface ChartDataPoint {
    subject: string;
    value: number;
    fullMark: number;
}

function formatCompact(value: number): string {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value.toFixed(0)}`;
}

export function AssetsSpiderChart() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/dashboard/net-worth");
                if (res.ok) {
                    const result = await res.json();
                    const rawData = [
                        { subject: "Real Assets", value: Number(result.assetsTotalValue) || 0 },
                        { subject: "Belongings", value: Number(result.belongingsTotalValue) || 0 },
                        { subject: "Receivables", value: Number(result.receivablesOutstandingTotal) || 0 },
                        { subject: "Bank", value: Number(result.bankBalanceTotal) || 0 },
                    ];

                    const hasAnyValue = rawData.some(d => d.value > 0);
                    if (hasAnyValue) {
                        const maxValue = Math.max(...rawData.map(d => d.value)) || 100000;
                        const chartData = rawData.map(d => ({
                            ...d,
                            fullMark: maxValue
                        }));
                        setData(chartData);
                    } else {
                        setData([]);
                    }
                }
            } catch {
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const total = data.reduce((sum, d) => sum + d.value, 0);

    const generateInsights = () => {
        const insights = [];
        const highest = [...data].sort((a, b) => b.value - a.value)[0];
        if (highest && highest.value > 0) {
            insights.push(`${highest.subject} is your largest asset category at ${formatCompact(highest.value)}.`);
        }
        const bankData = data.find(d => d.subject === "Bank");
        if (bankData && bankData.value > 0) {
            insights.push(`Your liquid cash (Bank) accounts for ${((bankData.value / total) * 100).toFixed(1)}% of these assets.`);
        }
        if (total > 0) {
            insights.push(`The spider chart shows the balance between your physical assets, receivables, and liquid cash.`);
        }
        return insights.length > 0 ? insights : ["No significant asset data to analyze yet."];
    };

    const hasData = data.length > 0 && data.some(d => d.value > 0);

    return (
        <>
            <MotionCard
                className="vault-card p-4 cursor-help select-none"
                delay={0.1}
                onClick={(e) => {
                    if (e.detail === 2 && hasData) setIsModalOpen(true);
                }}
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Assets Breakdown
                    </p>
                    <span className="text-xs font-semibold text-primary">
                        {formatCompact(total)}
                    </span>
                </div>

                {loading ? (
                    <div className="h-[140px] w-full flex items-center justify-center">
                        <div className="h-20 w-20 rounded-full border-2 border-slate-200 dark:border-slate-700 animate-pulse" />
                    </div>
                ) : !hasData ? (
                    <div className="h-[140px] w-full flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                        </div>
                        <p className="text-xs text-muted-foreground">No asset data yet</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Add assets to see breakdown</p>
                    </div>
                ) : (
                <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fontSize: 10, fill: "#64748b" }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar
                                name="Assets"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="#10b981"
                                fillOpacity={0.4}
                            />
                            <Tooltip
                                formatter={(value) => formatCompact(Number(value))}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    color: "#1e293b",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                )}
            </MotionCard>

            <ChartExplanationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Assets Breakdown"
                summary="The Assets Breakdown chart (Radar Chart) provides a multi-dimensional view of your asset distribution across Real Assets, Belongings, Receivables, and Bank balance."
                insights={generateInsights()}
            />
        </>
    );
}
