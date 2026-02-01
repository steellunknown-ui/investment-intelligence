"use client";

import { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
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

const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export function AssetsTrendCard() {
    const [data, setData] = useState<ChartDataPoint[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/dashboard/net-worth-history");
                if (res.ok) {
                    const result = await res.json();
                    const snapshots: SnapshotData[] = result.snapshots || [];
                    const chartData = snapshots.slice(-6).map((s) => ({
                        label: new Date(s.snapshot_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                        value: Number(s.total_assets) || 0,
                    }));
                    setData(chartData.length > 0 ? chartData : [
                        { label: "Jan", value: 120000 },
                        { label: "Feb", value: 135000 },
                        { label: "Mar", value: 145000 },
                        { label: "Apr", value: 160000 },
                        { label: "May", value: 175000 },
                        { label: "Jun", value: 190000 },
                    ]);
                }
            } catch {
                setData([
                    { label: "Jan", value: 120000 },
                    { label: "Feb", value: 135000 },
                    { label: "Mar", value: 145000 },
                    { label: "Apr", value: 160000 },
                    { label: "May", value: 175000 },
                    { label: "Jun", value: 190000 },
                ]);
            }
        }
        fetchData();
    }, []);

    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        return (
            <g>
                <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#fff" strokeWidth={2} />
                <text x={cx} y={cy - 10} textAnchor="middle" fill="#10b981" fontSize={9} fontWeight={600}>
                    {formatCompact(payload.value)}
                </text>
            </g>
        );
    };

    return (
        <MotionCard className="vault-card p-4" delay={0.1}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Assets Trend
            </p>
            <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
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
                            dot={<CustomDot />}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </MotionCard>
    );
}

export function LiabilitiesTrendCard() {
    const [data, setData] = useState<ChartDataPoint[]>([]);

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
                    setData(chartData.length > 0 ? chartData : [
                        { label: "Jan", value: 85000 },
                        { label: "Feb", value: 80000 },
                        { label: "Mar", value: 75000 },
                        { label: "Apr", value: 70000 },
                        { label: "May", value: 65000 },
                        { label: "Jun", value: 60000 },
                    ]);
                }
            } catch {
                setData([
                    { label: "Jan", value: 85000 },
                    { label: "Feb", value: 80000 },
                    { label: "Mar", value: 75000 },
                    { label: "Apr", value: 70000 },
                    { label: "May", value: 65000 },
                    { label: "Jun", value: 60000 },
                ]);
            }
        }
        fetchData();
    }, []);

    return (
        <MotionCard className="vault-card p-4" delay={0.15}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Liabilities Trend
            </p>
            <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#f59e0b" />
                            ))}
                        </Bar>
                        <Tooltip
                            formatter={(value) => [formatCompact(Number(value)), "Liabilities"]}
                            contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "11px",
                                color: "#fff"
                            }}
                            labelStyle={{ color: "#94a3b8" }}
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
                                    backgroundColor: "#1e293b",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    color: "#fff"
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
