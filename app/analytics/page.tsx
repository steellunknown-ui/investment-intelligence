"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { BarChart3, PieChart, TrendingUp, AlertTriangle, Target, Shield } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

interface AnalyticsData {
    diversification: { name: string; value: number }[];
    riskScore: number;
    totalReturn: number;
    returnsData: { month: string; portfolio: number; nifty: number; fd: number }[];
    sectorAllocation: { name: string; value: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", description: "", insights: "" });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/analytics/summary");
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error("Analytics fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const diversificationPercent = useMemo(() => {
        if (!data?.diversification.length) return 0;
        const total = data.diversification.reduce((sum, d) => sum + d.value, 0);
        return total > 0 ? Math.round((1 - Math.max(...data.diversification.map(d => d.value / total))) * 100) : 0;
    }, [data]);

    const riskLevel = useMemo(() => {
        if (!data) return "Low";
        if (data.riskScore >= 7) return "High";
        if (data.riskScore >= 4) return "Medium";
        return "Low";
    }, [data]);

    const openInsight = (type: string) => {
        const insights = {
            diversification: {
                title: "Portfolio Diversification",
                description: "Understanding your asset allocation",
                insights: "A well-diversified portfolio reduces risk by spreading investments across different asset classes. Aim for balanced exposure across equity, property, gold, and cash to minimize volatility."
            },
            risk: {
                title: "Risk Analysis",
                description: "Your portfolio risk profile",
                insights: `Your portfolio has ${riskLevel} risk exposure. ${riskLevel === "High" ? "High equity exposure increases volatility but offers higher returns." : riskLevel === "Medium" ? "Balanced risk with moderate growth potential." : "Conservative approach with stable returns."} Consider rebalancing if this doesn't match your risk appetite.`
            },
            returns: {
                title: "Performance Comparison",
                description: "How your portfolio performs",
                insights: "Compare your portfolio returns against market benchmarks like Nifty 50 and fixed deposits. Consistent outperformance indicates good investment decisions, while underperformance may require strategy adjustment."
            }
        };
        const content = insights[type as keyof typeof insights];
        setModalContent(content);
        setModalOpen(true);
    };

    if (loading) {
        return (
            <DashboardShell title="Investment Analytics" description="Portfolio insights and performance metrics">
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-slate-100 rounded-xl animate-pulse" />)}
                    </div>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell title="Investment Analytics" description="Portfolio insights and performance metrics">
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => openInsight("diversification")}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Diversification</p>
                                    <p className="text-3xl font-bold text-emerald-600">{diversificationPercent}%</p>
                                </div>
                                <div className="icon-container bg-emerald-50">
                                    <PieChart className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => openInsight("risk")}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Risk Score</p>
                                    <p className="text-3xl font-bold text-orange-600">{data?.riskScore || 0}/10</p>
                                </div>
                                <div className="icon-container bg-orange-50">
                                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => openInsight("returns")}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Total Return</p>
                                    <p className="text-3xl font-bold text-blue-600">{data?.totalReturn || 0}%</p>
                                </div>
                                <div className="icon-container bg-blue-50">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Asset Allocation Pie */}
                    <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => openInsight("diversification")}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-emerald-600" />
                                <h3 className="font-semibold">Portfolio Diversification</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPie>
                                    <Pie data={data?.diversification || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                                        {(data?.diversification || []).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `₹${(value || 0).toLocaleString()}`} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Risk Distribution Bar */}
                    <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => openInsight("risk")}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-orange-600" />
                                <h3 className="font-semibold">Risk Distribution</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    { name: 'Low', value: riskLevel === 'Low' ? 100 : 0 },
                                    { name: 'Medium', value: riskLevel === 'Medium' ? 100 : 0 },
                                    { name: 'High', value: riskLevel === 'High' ? 100 : 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Returns Comparison Line */}
                    <Card className="hover:shadow-md transition-all cursor-pointer md:col-span-2" onClick={() => openInsight("returns")}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">Performance Comparison</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={data?.returnsData || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2} name="Portfolio" />
                                    <Line type="monotone" dataKey="nifty" stroke="#3b82f6" strokeWidth={2} name="Nifty 50" />
                                    <Line type="monotone" dataKey="fd" stroke="#8b5cf6" strokeWidth={2} name="FD Benchmark" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Sector Allocation */}
                {data?.sectorAllocation && data.sectorAllocation.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600" />
                                <h3 className="font-semibold">Sector-wise Allocation</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.sectorAllocation.map((sector) => {
                                const total = data.sectorAllocation.reduce((sum, s) => sum + s.value, 0);
                                const percent = total > 0 ? (sector.value / total) * 100 : 0;
                                return (
                                    <div key={sector.name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-700">{sector.name}</span>
                                            <span className="font-medium">{percent.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Insight Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{modalContent.title}</DialogTitle>
                        <DialogDescription>{modalContent.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-slate-700">{modalContent.insights}</p>
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                            <Target className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-emerald-900">Suggested Action</p>
                                <p className="text-sm text-emerald-700 mt-1">Review your portfolio allocation quarterly and rebalance to maintain your target risk profile.</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}
