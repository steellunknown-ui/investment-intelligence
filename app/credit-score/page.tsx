"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
    CreditCard,
    Home,
    Wallet,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Building2,
    Briefcase
} from "lucide-react";
import { toast } from "sonner";

interface CreditProfile {
    estimated_monthly_income: number;
    income_source: string;
    employment_type: string;
    employer_name: string;
    years_employed: number;
    existing_credit_cards: number;
    total_credit_limit: number;
    credit_utilization_percent: number;
    has_missed_payments: boolean;
    missed_payments_count: number;
    oldest_account_years: number;
}

interface ScoreResult {
    score: number;
    rating: string;
    ratingColor: string;
    breakdown: {
        debtToIncomeScore: number;
        paymentHistoryScore: number;
        creditUtilizationScore: number;
        accountAgeScore: number;
        diversificationScore: number;
    };
}

interface Eligibility {
    type: string;
    eligible: boolean;
    maxAmount: number;
    reasons: string[];
    interestRateRange: string;
}

interface ScoreData {
    score: ScoreResult;
    eligibility: Eligibility[];
    factors: {
        totalLiabilities: number;
        totalAssets: number;
        bankBalance: number;
        monthlyIncome: number;
        dtiRatio: number;
    };
    hasProfile: boolean;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function CreditScorePage() {
    const [profile, setProfile] = useState<CreditProfile | null>(null);
    const [scoreData, setScoreData] = useState<ScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreditProfile>({
        estimated_monthly_income: 0,
        income_source: 'salary',
        employment_type: 'salaried',
        employer_name: '',
        years_employed: 0,
        existing_credit_cards: 0,
        total_credit_limit: 0,
        credit_utilization_percent: 0,
        has_missed_payments: false,
        missed_payments_count: 0,
        oldest_account_years: 0
    });

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/credit-score");
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setFormData(data.profile);
                if (!data.exists) {
                    setShowForm(true);
                }
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }, []);

    const calculateScore = useCallback(async () => {
        try {
            setCalculating(true);
            const res = await fetch("/api/credit-score/calculate");
            if (res.ok) {
                const data = await res.json();
                setScoreData(data);
            }
        } catch (err) {
            console.error("Error calculating score:", err);
        } finally {
            setCalculating(false);
        }
    }, []);

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/credit-score", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Profile saved successfully!");
                setShowForm(false);
                await fetchProfile();
                await calculateScore();
            } else {
                toast.error("Failed to save profile");
            }
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        async function init() {
            setLoading(true);
            await fetchProfile();
            await calculateScore();
            setLoading(false);
        }
        init();
    }, [fetchProfile, calculateScore]);

    const getScoreColor = (score: number) => {
        if (score >= 750) return "text-green-500";
        if (score >= 700) return "text-lime-500";
        if (score >= 650) return "text-yellow-500";
        if (score >= 550) return "text-orange-500";
        return "text-red-500";
    };

    const getEligibilityIcon = (type: string) => {
        switch (type) {
            case 'home_loan': return Home;
            case 'personal_loan': return Wallet;
            case 'credit_card': return CreditCard;
            default: return Wallet;
        }
    };

    const getEligibilityTitle = (type: string) => {
        switch (type) {
            case 'home_loan': return 'Home Loan';
            case 'personal_loan': return 'Personal Loan';
            case 'credit_card': return 'Credit Card';
            default: return type;
        }
    };

    return (
        <DashboardShell
            title="Credit Score"
            description="Check your estimated credit score and loan eligibility"
            action={
                <Button
                    variant="outline"
                    onClick={() => setShowForm(!showForm)}
                    className="gap-2"
                >
                    <Briefcase className="h-4 w-4" />
                    {showForm ? 'Hide Form' : 'Update Income Info'}
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Income Form */}
                {showForm && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Income & Credit Information</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            This information helps calculate your credit score more accurately.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <Label htmlFor="income">Monthly Income (₹)</Label>
                                <Input
                                    id="income"
                                    type="number"
                                    value={formData.estimated_monthly_income}
                                    onChange={(e) => setFormData({ ...formData, estimated_monthly_income: Number(e.target.value) })}
                                    placeholder="e.g., 50000"
                                />
                            </div>

                            <div>
                                <Label htmlFor="employment">Employment Type</Label>
                                <select
                                    id="employment"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                                    value={formData.employment_type}
                                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                                >
                                    <option value="salaried">Salaried</option>
                                    <option value="self_employed">Self Employed</option>
                                    <option value="business_owner">Business Owner</option>
                                    <option value="retired">Retired</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="employer">Employer Name</Label>
                                <Input
                                    id="employer"
                                    value={formData.employer_name}
                                    onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                                    placeholder="e.g., TCS, Infosys"
                                />
                            </div>

                            <div>
                                <Label htmlFor="years">Years Employed</Label>
                                <Input
                                    id="years"
                                    type="number"
                                    value={formData.years_employed}
                                    onChange={(e) => setFormData({ ...formData, years_employed: Number(e.target.value) })}
                                    placeholder="e.g., 5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="cards">Existing Credit Cards</Label>
                                <Input
                                    id="cards"
                                    type="number"
                                    value={formData.existing_credit_cards}
                                    onChange={(e) => setFormData({ ...formData, existing_credit_cards: Number(e.target.value) })}
                                    placeholder="e.g., 2"
                                />
                            </div>

                            <div>
                                <Label htmlFor="limit">Total Credit Limit (₹)</Label>
                                <Input
                                    id="limit"
                                    type="number"
                                    value={formData.total_credit_limit}
                                    onChange={(e) => setFormData({ ...formData, total_credit_limit: Number(e.target.value) })}
                                    placeholder="e.g., 200000"
                                />
                            </div>

                            <div>
                                <Label htmlFor="utilization">Credit Utilization (%)</Label>
                                <Input
                                    id="utilization"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.credit_utilization_percent}
                                    onChange={(e) => setFormData({ ...formData, credit_utilization_percent: Number(e.target.value) })}
                                    placeholder="e.g., 30"
                                />
                            </div>

                            <div>
                                <Label htmlFor="oldest">Oldest Account (Years)</Label>
                                <Input
                                    id="oldest"
                                    type="number"
                                    value={formData.oldest_account_years}
                                    onChange={(e) => setFormData({ ...formData, oldest_account_years: Number(e.target.value) })}
                                    placeholder="e.g., 8"
                                />
                            </div>

                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.has_missed_payments}
                                        onChange={(e) => setFormData({ ...formData, has_missed_payments: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <span className="text-sm">Has missed payments?</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button onClick={handleSaveProfile} disabled={saving}>
                                {saving ? 'Saving...' : 'Save & Calculate'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Credit Score Display */}
                {loading ? (
                    <Card className="p-8">
                        <div className="flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                            <span className="ml-3 text-slate-600">Loading credit score...</span>
                        </div>
                    </Card>
                ) : scoreData ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Score Gauge */}
                        <Card className="p-6 lg:col-span-1">
                            <div className="text-center">
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                                    Estimated Credit Score
                                </h3>

                                {/* Circular Score Display */}
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-40 h-40 transform -rotate-90">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="#e5e7eb"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke={scoreData.score.ratingColor}
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${((scoreData.score.score - 300) / 550) * 440} 440`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-bold ${getScoreColor(scoreData.score.score)}`}>
                                            {scoreData.score.score}
                                        </span>
                                        <span className="text-sm text-slate-500">out of 850</span>
                                    </div>
                                </div>

                                <div
                                    className="mt-4 inline-block px-4 py-2 rounded-full text-sm font-medium"
                                    style={{ backgroundColor: `${scoreData.score.ratingColor}20`, color: scoreData.score.ratingColor }}
                                >
                                    {scoreData.score.rating}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 gap-2"
                                    onClick={calculateScore}
                                    disabled={calculating}
                                >
                                    <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                                    Recalculate
                                </Button>
                            </div>
                        </Card>

                        {/* Score Breakdown */}
                        <Card className="p-6 lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>

                            <div className="space-y-4">
                                {[
                                    { label: 'Debt-to-Income Ratio', score: scoreData.score.breakdown.debtToIncomeScore, weight: '35%' },
                                    { label: 'Payment History', score: scoreData.score.breakdown.paymentHistoryScore, weight: '25%' },
                                    { label: 'Credit Utilization', score: scoreData.score.breakdown.creditUtilizationScore, weight: '20%' },
                                    { label: 'Account Age', score: scoreData.score.breakdown.accountAgeScore, weight: '10%' },
                                    { label: 'Credit Mix', score: scoreData.score.breakdown.diversificationScore, weight: '10%' }
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-600">{item.label}</span>
                                            <span className="text-slate-500">{item.score}/100 ({item.weight})</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${item.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Your Financial Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Total Assets:</span>
                                        <span className="ml-2 font-medium">{formatCurrency(scoreData.factors.totalAssets)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Total Liabilities:</span>
                                        <span className="ml-2 font-medium">{formatCurrency(scoreData.factors.totalLiabilities)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Bank Balance:</span>
                                        <span className="ml-2 font-medium">{formatCurrency(scoreData.factors.bankBalance)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">DTI Ratio:</span>
                                        <span className="ml-2 font-medium">{scoreData.factors.dtiRatio}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <Card className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Unable to calculate score</h3>
                        <p className="text-sm text-slate-500 mt-1">Please add your income information above.</p>
                    </Card>
                )}

                {/* Eligibility Cards */}
                {scoreData && scoreData.eligibility.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Loan & Credit Eligibility</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            {scoreData.eligibility.map((item) => {
                                const Icon = getEligibilityIcon(item.type);
                                return (
                                    <Card key={item.type} className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.eligible ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                    <Icon className={`h-5 w-5 ${item.eligible ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                </div>
                                                <h4 className="font-medium">{getEligibilityTitle(item.type)}</h4>
                                            </div>
                                            {item.eligible ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-400" />
                                            )}
                                        </div>

                                        {item.eligible ? (
                                            <div>
                                                <div className="text-2xl font-bold text-emerald-600">
                                                    {formatCurrency(item.maxAmount)}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Estimated maximum amount
                                                </p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    Interest Rate: {item.interestRateRange}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-slate-500">Not eligible</p>
                                                <ul className="mt-2 space-y-1">
                                                    {item.reasons.map((reason, i) => (
                                                        <li key={i} className="text-xs text-red-500 flex items-start gap-1">
                                                            <span>•</span>
                                                            <span>{reason}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <strong>Disclaimer:</strong> This is an estimated credit score based on the financial data you&apos;ve entered.
                            For an official credit score, please check with CIBIL, Experian, or other credit bureaus.
                            Loan eligibility amounts are estimates and actual offers may vary by lender.
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
