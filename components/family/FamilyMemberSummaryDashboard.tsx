"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Landmark, Building2, Shield, TrendingDown, Activity, Wallet, Gem, ArrowRightLeft, LogIn, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MotionCard } from "@/components/ui/MotionCard";

interface SummaryData {
    banking: { count: number; total: number };
    assets: { count: number; total: number };
    belongings: { count: number; total: number };
    receivables: { count: number; total: number };
    liabilities: { count: number; total: number };
    lastLoginAt: string | null;
}

interface FamilyMemberSummaryDashboardProps {
    memberUserId: string;
}

export default function FamilyMemberSummaryDashboard({ memberUserId }: FamilyMemberSummaryDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<SummaryData | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/family/${memberUserId}/summary`);
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data.summary);
                }
            } catch (error) {
                console.error("Failed to fetch member summary:", error);
            } finally {
                setLoading(false);
            }
        };

        if (memberUserId) {
            fetchSummary();
        }
    }, [memberUserId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(amount);
    };

    const formatLastLogin = (dateStr: string | null): string => {
        if (!dateStr) return "—";

        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const timeStr = date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const dateFormatted = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });

        if (diffDays === 0) return `Today, ${timeStr}`;
        if (diffDays === 1) return `Yesterday, ${timeStr}`;

        return `${dateFormatted}, ${timeStr}`;
    };

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center text-slate-500 border border-border">
                <Activity className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                <p>No financial data found for this member.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Cash & Bank */}
            <FamilyStatCard
                icon={Wallet}
                label="Cash & Bank"
                value={formatCurrency(summary.banking.total)}
                count={`${summary.banking.count} ${summary.banking.count === 1 ? 'Account' : 'Accounts'}`}
                description="Total Balance"
                color="text-blue-600"
                delay={0.1}
            />

            {/* Real Assets */}
            <FamilyStatCard
                icon={Landmark}
                label="Real Assets"
                value={formatCurrency(summary.assets.total)}
                count={`${summary.assets.count} ${summary.assets.count === 1 ? 'Asset' : 'Assets'}`}
                description="Total Assets Value"
                color="text-indigo-600"
                delay={0.15}
            />

            {/* Belongings */}
            <FamilyStatCard
                icon={Gem}
                label="Belongings"
                value={formatCurrency(summary.belongings.total)}
                count={`${summary.belongings.count} ${summary.belongings.count === 1 ? 'Item' : 'Items'}`}
                description="Total Belongings Value"
                color="text-violet-600"
                delay={0.2}
            />

            {/* Receivables */}
            <FamilyStatCard
                icon={ArrowRightLeft}
                label="Receivables"
                value={formatCurrency(summary.receivables.total)}
                count={`${summary.receivables.count} ${summary.receivables.count === 1 ? 'Person' : 'People'}`}
                description="Total Receivable Amount"
                color="text-cyan-600"
                delay={0.25}
            />

            {/* Liabilities */}
            <FamilyStatCard
                icon={Briefcase}
                label="Liabilities"
                value={formatCurrency(summary.liabilities.total)}
                count={`${summary.liabilities.count} ${summary.liabilities.count === 1 ? 'Loan' : 'Loans'}`}
                description="Total Outstanding"
                color="text-red-600"
                delay={0.3}
            />

            {/* Last Login */}
            <FamilyStatCard
                icon={LogIn}
                label="Last Login"
                value={formatLastLogin(summary.lastLoginAt)}
                count="Security Log"
                description="Account Access Time"
                color="text-primary"
                delay={0.35}
            />
        </div>
    );
}

function FamilyStatCard({
    icon: Icon,
    label,
    value,
    count,
    description,
    color = "text-slate-900",
    delay = 0,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    count?: string;
    description?: string;
    color?: string;
    delay?: number;
}) {
    return (
        <MotionCard
            className="vault-card relative overflow-hidden flex flex-col justify-center"
            delay={delay}
        >
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                    {count && (
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">{count}</p>
                    )}
                    {description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">{description}</p>
                    )}
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className={`h-5 w-5 ${color} opacity-80`} />
                </div>
            </div>
        </MotionCard>
    );
}
