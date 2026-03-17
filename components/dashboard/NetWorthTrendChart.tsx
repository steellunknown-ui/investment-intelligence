"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Snapshot {
    snapshot_date: string;
    net_worth: number;
    total_assets: number;
    total_liabilities: number;
}

interface NetWorthChartData {
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
    displayDate: string;
    month: string;
}

function formatCurrencyCompact(value: number): string {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
        return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value.toFixed(0)}`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export function NetWorthTrendChart() {
    const [data, setData] = useState<NetWorthChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

    const fetchData = async () => {
        try {
            const res = await fetch("/api/dashboard/net-worth-history");
            if (res.ok) {
                const result = await res.json();
                const snapshots: Snapshot[] = result.snapshots || [];

                // Transform data for chart
                const chartData: NetWorthChartData[] = snapshots.map((s) => ({
                    date: s.snapshot_date,
                    netWorth: Number(s.net_worth) || 0,
                    assets: Number(s.total_assets) || 0,
                    liabilities: Number(s.total_liabilities) || 0,
                    displayDate: new Date(s.snapshot_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                    }),
                    month: new Date(s.snapshot_date).toLocaleDateString("en-IN", {
                        month: "short",
                    }).toUpperCase(),
                }));

                // Sort by date ascending
                chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // Filter based on time range
                const now = new Date();
                const filterDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
                const cutoff = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);

                const filteredData = chartData.filter((d) => new Date(d.date) >= cutoff);

                setData(filteredData.length > 0 ? filteredData : chartData.slice(-10));
            }
        } catch (err) {
            console.error("Error fetching net worth history:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Calculate trend
    const calculateTrend = () => {
        if (data.length < 2) return { trend: "neutral", change: 0, percentage: 0 };
        const first = data[0].netWorth;
        const last = data[data.length - 1].netWorth;
        const change = last - first;
        const percentage = first > 0 ? ((change / first) * 100) : 0;
        return {
            trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
            change,
            percentage,
        };
    };

    const { trend, change, percentage } = calculateTrend();

    if (loading) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Net Worth Trend</h3>
                        <p className="text-white/40 text-xs mt-1">Loading...</p>
                    </div>
                </div>
                <div className="h-[280px] w-full bg-slate-700/30 rounded-lg animate-pulse" />
            </div>
        );
    }

    if (data.length < 2) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Net Worth Trend</h3>
                        <p className="text-white/40 text-xs mt-1">Financial Growth Over Time</p>
                    </div>
                </div>
                <div className="h-[280px] flex items-center justify-center">
                    <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        <p className="text-white/50 text-sm">Chart will appear after more data points</p>
                        <p className="text-white/30 text-xs mt-1">Keep tracking your finances daily</p>
                    </div>
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-white/10">
                    <p className="text-white/60 text-xs mb-3 font-medium">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm mb-1 last:mb-0">
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-white/70">{entry.name}:</span>
                            <span className="font-semibold text-white">
                                {formatCurrency(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const CustomDot = (props: any) => {
        const { cx, cy, stroke } = props;
        return (
            <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="#fff"
                stroke={stroke}
                strokeWidth={2}
                style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.3))" }}
            />
        );
    };

    return (
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 shadow-xl overflow-hidden relative">
            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Net Worth Trend</h3>
                        <p className="text-white/40 text-xs mt-1">
                            {timeRange === "7d" ? "Last 7 Days" :
                                timeRange === "30d" ? "Last 30 Days" :
                                    timeRange === "90d" ? "Last 90 Days" : "Last Year"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Trend Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${trend === "up"
                                ? "bg-primary/20 text-accent"
                                : trend === "down"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-white/10 text-white/60"
                            }`}>
                            {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                            {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                            {trend === "neutral" && <Minus className="h-3.5 w-3.5" />}
                            {percentage >= 0 ? "+" : ""}{percentage.toFixed(1)}%
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex rounded-lg bg-white/5 p-0.5">
                            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${timeRange === range
                                            ? "bg-white/10 text-white"
                                            : "text-white/40 hover:text-white/70"
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 text-white/50 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                        >
                            <defs>
                                <linearGradient id="netWorthGradientPremium" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                                    <stop offset="50%" stopColor="#ec4899" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="assetsGradientPremium" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="liabilitiesGradientPremium" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                                horizontal={true}
                                vertical={false}
                            />

                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                                tickLine={false}
                                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                tickFormatter={formatCurrencyCompact}
                                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                                tickLine={false}
                                axisLine={false}
                                width={55}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span className="text-xs text-white/50">{value}</span>
                                )}
                            />

                            {/* Liabilities - Cyan/Teal */}
                            <Area
                                type="monotone"
                                dataKey="liabilities"
                                name="Liabilities"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                fill="url(#liabilitiesGradientPremium)"
                                dot={<CustomDot />}
                                activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
                            />

                            {/* Assets - Orange */}
                            <Area
                                type="monotone"
                                dataKey="assets"
                                name="Assets"
                                stroke="#f97316"
                                strokeWidth={2}
                                fill="url(#assetsGradientPremium)"
                                dot={<CustomDot />}
                                activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                            />

                            {/* Net Worth - Purple/Pink gradient line */}
                            <Area
                                type="monotone"
                                dataKey="netWorth"
                                name="Net Worth"
                                stroke="url(#netWorthLineGradient)"
                                strokeWidth={3}
                                fill="url(#netWorthGradientPremium)"
                                dot={<CustomDot />}
                                activeDot={{ r: 6, fill: "#a855f7", stroke: "#fff", strokeWidth: 2 }}
                            />

                            {/* Gradient for Net Worth line */}
                            <defs>
                                <linearGradient id="netWorthLineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
