"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    TrendingUp,
    Shield,
    AlertTriangle,
    Wallet,
    PieChart,
    Users,
    Clock,
    XCircle
} from "lucide-react";

interface NomineeAccessData {
    valid: boolean;
    nomineeName: string;
    expiresAt: string;
    profile: {
        fullName: string;
    };
    summary: {
        totalInvested: number;
        totalValue: number;
        holdingsCount: number;
        nomineesCount: number;
    };
    holdings: Array<{
        id: string;
        symbol: string;
        name: string | null;
        asset_type: string;
        quantity: number;
        avg_buy_price: number | null;
    }>;
    nominees: Array<{
        id: string;
        name: string;
        relationship: string | null;
    }>;
}

export default function NomineeAccessPage() {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<NomineeAccessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/nominee-access/${token}`);
                if (!res.ok) {
                    const err = await res.json();
                    setError(err.error || "Invalid or expired access link");
                    return;
                }
                const json = await res.json();
                setData(json);
            } catch {
                setError("Failed to load portfolio data");
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchData();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-white/70">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mx-auto">
                        <XCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h1 className="mt-6 text-2xl font-bold text-white">Access Denied</h1>
                    <p className="mt-3 text-white/70">
                        {error || "This access link is invalid or has expired."}
                    </p>
                    <p className="mt-4 text-sm text-white/50">
                        Contact the account holder if you believe this is an error.
                    </p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const expiresDate = new Date(data.expiresAt);
    const daysRemaining = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Investment Intelligence</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Shield className="h-4 w-4" />
                        <span>Read-Only Access</span>
                    </div>
                </div>
            </header>

            {/* Warning Banner */}
            <div className="bg-amber-500/20 border-b border-amber-500/30">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-200 text-sm">
                        <strong>Read-only nominee access</strong> — You are viewing as{" "}
                        <span className="font-semibold">{data.nomineeName}</span>.
                        This link expires in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Portfolio Owner */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">
                        {data.profile.fullName}&apos;s Portfolio
                    </h1>
                    <p className="mt-2 text-white/60">
                        Nominee access granted due to account inactivity
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard
                        icon={Wallet}
                        title="Total Invested"
                        value={formatCurrency(data.summary.totalInvested)}
                        gradient="from-emerald-500 to-emerald-600"
                    />
                    <SummaryCard
                        icon={PieChart}
                        title="Holdings"
                        value={data.summary.holdingsCount.toString()}
                        gradient="from-emerald-500 to-emerald-600"
                    />
                    <SummaryCard
                        icon={Users}
                        title="Nominees"
                        value={data.summary.nomineesCount.toString()}
                        gradient="from-emerald-500 to-teal-500"
                    />
                </div>

                {/* Holdings Table */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-purple-400" />
                            Holdings
                        </h2>
                    </div>
                    {data.holdings.length === 0 ? (
                        <div className="px-6 py-12 text-center text-white/50">
                            No holdings recorded
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-white/60 text-sm border-b border-white/10">
                                        <th className="px-6 py-3 font-medium">Symbol</th>
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Type</th>
                                        <th className="px-6 py-3 font-medium text-right">Quantity</th>
                                        <th className="px-6 py-3 font-medium text-right">Avg. Price</th>
                                        <th className="px-6 py-3 font-medium text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.holdings.map((holding) => (
                                        <tr
                                            key={holding.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-semibold text-white">
                                                {holding.symbol}
                                            </td>
                                            <td className="px-6 py-4 text-white/70">
                                                {holding.name || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 capitalize">
                                                    {holding.asset_type.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-white">
                                                {holding.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right text-white/70">
                                                {holding.avg_buy_price
                                                    ? formatCurrency(holding.avg_buy_price)
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-white">
                                                {holding.avg_buy_price
                                                    ? formatCurrency(holding.quantity * holding.avg_buy_price)
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Nominees List */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-400" />
                            Registered Nominees
                        </h2>
                    </div>
                    {data.nominees.length === 0 ? (
                        <div className="px-6 py-12 text-center text-white/50">
                            No nominees registered
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {data.nominees.map((nominee) => (
                                <div
                                    key={nominee.id}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                            <span className="text-emerald-400 font-semibold">
                                                {nominee.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{nominee.name}</p>
                                            <p className="text-sm text-white/50">
                                                {nominee.relationship || "Relationship not specified"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center py-8 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                            Access expires on{" "}
                            {expiresDate.toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                    <p className="mt-2 text-white/30 text-xs">
                        This is read-only access. No modifications can be made.
                    </p>
                </div>
            </main>
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    title,
    value,
    gradient,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    gradient: string;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <p className="mt-4 text-sm text-white/60">{title}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
    );
}
