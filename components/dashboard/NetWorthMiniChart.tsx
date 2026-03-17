"use client";

import { useEffect, useState } from "react";

interface Snapshot {
    snapshot_date: string;
    net_worth: number;
}

interface NetWorthChartProps {
    className?: string;
}

export function NetWorthMiniChart({ className }: NetWorthChartProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            try {
                // First, record today's snapshot
                await fetch("/api/dashboard/net-worth-history", { method: "POST" });

                // Then fetch history
                const res = await fetch("/api/dashboard/net-worth-history");
                if (res.ok) {
                    const data = await res.json();
                    setSnapshots(data.snapshots || []);
                }
            } catch (err) {
                console.error("Error fetching net worth history:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className={`h-12 w-full bg-primary/20 rounded animate-pulse ${className}`} />
        );
    }

    if (snapshots.length < 2) {
        return (
            <div className={`h-12 w-full flex items-center justify-center text-emerald-200/60 text-xs ${className}`}>
                Chart will appear after more data
            </div>
        );
    }

    // Calculate chart dimensions
    const values = snapshots.map(s => Number(s.net_worth));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Generate SVG path for sparkline
    const width = 200;
    const height = 40;
    const padding = 2;

    const points = snapshots.map((snapshot, index) => {
        const x = padding + (index / (snapshots.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((Number(snapshot.net_worth) - minValue) / range) * (height - 2 * padding);
        return { x, y };
    });

    const pathD = points.map((point, i) =>
        `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    // Gradient fill path
    const areaPath = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const trend = lastValue >= firstValue ? "up" : "down";
    const percentChange = firstValue > 0
        ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
        : "0";

    return (
        <div className={`relative ${className}`}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-12"
                preserveAspectRatio="none"
            >
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill="url(#netWorthGradient)"
                />

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* End dot */}
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="3"
                    fill="currentColor"
                />
            </svg>

            {/* Trend indicator */}
            <div className="absolute bottom-0 right-0 text-xs opacity-80">
                <span className={trend === "up" ? "text-green-500 dark:text-green-400 font-semibold" : "text-red-500 dark:text-red-400 font-semibold"}>
                    {trend === "up" ? "↑" : "↓"} {percentChange}%
                </span>
                <span className="ml-1 opacity-60">30d</span>
            </div>
        </div>
    );
}
