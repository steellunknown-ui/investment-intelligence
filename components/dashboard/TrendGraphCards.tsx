"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";
import { MotionCard } from "@/components/ui/MotionCard";

interface ChartDataPoint {
    label: string;
    value: number;
}

interface SnapshotData {
    snapshot_date: string;
    net_worth: number;
    total_assets: number;
    total_liabilities: number;
}

function formatCompact(value: number): string {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value.toFixed(0)}`;
}

const ASSET_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];
const LIABILITY_COLORS = ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a"];
const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export function AssetsTrendCard() {
    const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/dashboard/net-worth");
                if (res.ok) {
                    const result = await res.json();
                    const data = [
                        { name: "Real Assets", value: Number(result.assetsTotalValue) || 0 },
                        { name: "Belongings", value: Number(result.belongingsTotalValue) || 0 },
                        { name: "Receivables", value: Number(result.receivablesOutstandingTotal) || 0 },
                        { name: "Bank", value: Number(result.bankBalanceTotal) || 0 },
                    ].filter(d => d.value > 0);

                    setPieData(data.length > 0 ? data : [
                        { name: "Assets", value: 120000 },
                        { name: "Belongings", value: 30000 },
                    ]);
                    setTotal(data.reduce((sum, d) => sum + d.value, 0));
                }
            } catch {
                setPieData([
                    { name: "Assets", value: 120000 },
                    { name: "Belongings", value: 30000 },
                ]);
                setTotal(150000);
            }
        }
        fetchData();
    }, []);

    return (
        <MotionCard className="vault-card p-4" delay={0.1}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Assets Breakdown
            </p>
            <div className="h-[140px] w-full flex items-center">
                <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                                ))}
                            </Pie>
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
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 pl-2">
                    {pieData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length] }}
                            />
                            <span className="text-[10px] text-muted-foreground truncate">{entry.name}</span>
                            <span className="text-[10px] font-medium ml-auto">{formatCompact(entry.value)}</span>
                        </div>
                    ))}
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Total</span>
                            <span className="text-xs font-semibold text-emerald-600">{formatCompact(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}

export function LiabilitiesTrendCard() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [latestValue, setLatestValue] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/dashboard/net-worth-history");
                if (res.ok) {
                    const result = await res.json();
                    const snapshots: SnapshotData[] = result.snapshots || [];
                    const chartData = snapshots.slice(-6).map((s) => ({
                        label: new Date(s.snapshot_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                        value: Number(s.total_liabilities) || 0,
                    }));
                    const finalData = chartData.length > 0 ? chartData : [
                        { label: "Jan", value: 85000 },
                        { label: "Feb", value: 80000 },
                        { label: "Mar", value: 75000 },
                        { label: "Apr", value: 70000 },
                        { label: "May", value: 65000 },
                        { label: "Jun", value: 60000 },
                    ];
                    setData(finalData);
                    setLatestValue(finalData[finalData.length - 1]?.value || 0);
                }
            } catch {
                const fallback = [
                    { label: "Jan", value: 85000 },
                    { label: "Feb", value: 80000 },
                    { label: "Mar", value: 75000 },
                    { label: "Apr", value: 70000 },
                    { label: "May", value: 65000 },
                    { label: "Jun", value: 60000 },
                ];
                setData(fallback);
                setLatestValue(60000);
            }
        }
        fetchData();
    }, []);

    const trend = data.length >= 2 ?
        ((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1) : "0";

    return (
        <MotionCard className="vault-card p-4" delay={0.15}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Liabilities Trend
                </p>
                <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${Number(trend) <= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    {Number(trend) <= 0 ? "↓" : "↑"} {Math.abs(Number(trend))}%
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold text-amber-600">{formatCompact(latestValue)}</span>
                <span className="text-[10px] text-muted-foreground">current</span>
            </div>
            <div className="h-[90px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 9, fill: "#94a3b8" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={LIABILITY_COLORS[index % LIABILITY_COLORS.length]} />
                            ))}
                        </Bar>
                        <Tooltip
                            formatter={(value) => [formatCompact(Number(value)), "Liabilities"]}
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                fontSize: "11px",
                                color: "#1e293b",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                            labelStyle={{ color: "#64748b", fontWeight: 500 }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </MotionCard>
    );
}

export function NetWorthTrendCard() {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/dashboard/net-worth");
                if (res.ok) {
                    const result = await res.json();
                    const pieData = [
                        { name: "Bank", value: Number(result.bankBalanceTotal) || 0 },
                        { name: "Assets", value: Number(result.assetsTotalValue) || 0 },
                        { name: "Belongings", value: Number(result.belongingsTotalValue) || 0 },
                        { name: "Receivables", value: Number(result.receivablesOutstandingTotal) || 0 },
                    ].filter(d => d.value > 0);

                    setData(pieData.length > 0 ? pieData : [
                        { name: "Bank", value: 50000 },
                        { name: "Assets", value: 120000 },
                        { name: "Belongings", value: 30000 },
                    ]);
                }
            } catch {
                setData([
                    { name: "Bank", value: 50000 },
                    { name: "Assets", value: 120000 },
                    { name: "Belongings", value: 30000 },
                ]);
            }
        }
        fetchData();
    }, []);

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <MotionCard className="vault-card p-4" delay={0.2}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Net Worth Breakdown
            </p>
            <div className="h-[140px] w-full flex items-center">
                <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
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
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 pl-2">
                    {data.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="text-[10px] text-muted-foreground">{entry.name}</span>
                            <span className="text-[10px] font-medium ml-auto">{formatCompact(entry.value)}</span>
                        </div>
                    ))}
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Total</span>
                            <span className="text-xs font-semibold text-emerald-600">{formatCompact(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
