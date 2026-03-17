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

                    const maxValue = Math.max(...rawData.map(d => d.value)) || 100000;

                    const chartData = rawData.map(d => ({
                        ...d,
                        fullMark: maxValue
                    }));

                    setData(chartData);
                }
            } catch {
                setData([
                    { subject: "Real Assets", value: 120000, fullMark: 150000 },
                    { subject: "Belongings", value: 30000, fullMark: 150000 },
                    { subject: "Receivables", value: 0, fullMark: 150000 },
                    { subject: "Bank", value: 0, fullMark: 150000 },
                ]);
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

    return (
        <>
            <MotionCard
                className="vault-card p-4 cursor-help select-none"
                delay={0.1}
                onClick={(e) => {
                    if (e.detail === 2) setIsModalOpen(true);
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
