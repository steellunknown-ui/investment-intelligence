"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
    ArrowLeft,
    Landmark,
    Building2,
    Wallet,
    Briefcase,
    Coins,
    Gem,
    Shield as ShieldIcon,
    Eye
} from "lucide-react";

export default function MonitorDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.memberId as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/family/monitor?memberId=${memberId}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else if (res.status === 403) {
                    alert("Unauthorized access");
                    router.push("/family");
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [memberId, router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardShell title="Loading..." description="Fetching member data">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </DashboardShell>
        );
    }

    if (!data) {
        return (
            <DashboardShell title="Error" description="Failed to load data">
                <div className="text-center py-12">
                    <p className="text-slate-500">Unable to load member data</p>
                    <Button onClick={() => router.push("/family")} className="mt-4">
                        Back to Family Hub
                    </Button>
                </div>
            </DashboardShell>
        );
    }

    const totalBalance = data.data.accounts.reduce((sum: number, acc: any) => sum + Number(acc.current_balance), 0);
    const totalAssets = data.data.assets.reduce((sum: number, asset: any) => sum + Number(asset.current_market_value || 0), 0);
    const totalLiabilities = data.data.liabilities.reduce((sum: number, lib: any) => sum + Number(lib.outstanding_amount), 0);
    const netWorth = totalBalance + totalAssets - totalLiabilities;

    return (
        <DashboardShell
            title={`Monitoring: ${data.member.member_profile?.full_name || "Member"}`}
            description={`${data.member.relation} • Read-Only Mode`}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.push("/family")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Family Hub
                    </Button>
                    <Badge variant="outline" className="gap-2">
                        <Eye className="h-3 w-3" />
                        Read-Only Monitoring Mode
                    </Badge>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                    <p className="text-blue-100 text-sm font-medium mb-1">Net Worth</p>
                    <h2 className="text-3xl font-bold">{formatCurrency(netWorth)}</h2>
                    <p className="text-blue-100 text-xs mt-2 opacity-80">
                        Viewing {data.member.member_profile?.full_name}'s Portfolio
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-emerald-50 dark:bg-emerald-900/20">
                                    <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Bank Accounts</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.accounts.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Balance: {formatCurrency(totalBalance)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-blue-50 dark:bg-blue-900/20">
                                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Assets</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.assets.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Value: {formatCurrency(totalAssets)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-red-50 dark:bg-red-900/20">
                                    <Wallet className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Liabilities</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.liabilities.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Outstanding: {formatCurrency(totalLiabilities)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-purple-50 dark:bg-purple-900/20">
                                    <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Holdings</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.holdings.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-amber-50 dark:bg-amber-900/20">
                                    <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Receivables</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.receivables.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-pink-50 dark:bg-pink-900/20">
                                    <Gem className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Belongings</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.belongings.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="icon-container bg-indigo-50 dark:bg-indigo-900/20">
                                    <ShieldIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Insurance</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {data.data.insurance.length}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    );
}
