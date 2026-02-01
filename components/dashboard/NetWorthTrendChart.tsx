"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
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
}

function formatCurrencyCompact(value: number): string {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
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
            <Card className="vault-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="icon-container bg-emerald-100 dark:bg-emerald-900/30">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-sm">Net Worth Trend</h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    if (data.length < 2) {
        return (
            <Card className="vault-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="icon-container bg-emerald-100 dark:bg-emerald-900/30">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-sm">Net Worth Trend</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>Chart will appear after more data points</p>
                            <p className="text-xs text-slate-400 mt-1">Keep tracking your finances daily</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="vault-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="icon-container bg-emerald-100 dark:bg-emerald-900/30">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-sm">Net Worth Trend</h3>
                        </div>

                        {/* Trend Badge */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend === "up"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : trend === "down"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                            {trend === "up" && <TrendingUp className="h-3 w-3" />}
                            {trend === "down" && <TrendingDown className="h-3 w-3" />}
                            {trend === "neutral" && <Minus className="h-3 w-3" />}
                            {percentage.toFixed(1)}%
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Time Range Selector */}
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 text-xs font-medium transition-colors ${timeRange === range
                                            ? "bg-emerald-600 text-white"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Refresh Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-7 w-7 p-0"
                        >
                            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="liabilitiesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                tickLine={false}
                                axisLine={{ stroke: "#e2e8f0" }}
                            />
                            <YAxis
                                tickFormatter={formatCurrencyCompact}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                tickLine={false}
                                axisLine={false}
                                width={60}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
                                )}
                            />
                            <Area
                                type="monotone"
                                dataKey="netWorth"
                                name="Net Worth"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#netWorthGradient)"
                                dot={false}
                                activeDot={{ r: 4, fill: "#10b981" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="assets"
                                name="Assets"
                                stroke="#3b82f6"
                                strokeWidth={1.5}
                                fill="url(#assetsGradient)"
                                dot={false}
                                activeDot={{ r: 3, fill: "#3b82f6" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="liabilities"
                                name="Liabilities"
                                stroke="#ef4444"
                                strokeWidth={1.5}
                                fill="url(#liabilitiesGradient)"
                                dot={false}
                                activeDot={{ r: 3, fill: "#ef4444" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
