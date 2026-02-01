"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PortfolioSummaryCard } from "@/components/dashboard/PortfolioSummaryCard";
import { PortfolioChartCard } from "@/components/dashboard/PortfolioChartCard";
import { AssetAllocationCard } from "@/components/dashboard/AssetAllocationCard";
import { RiskOverviewCard } from "@/components/dashboard/RiskOverviewCard";
import { SetupChecklistCard } from "@/components/dashboard/SetupChecklistCard";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { Card } from "@/components/ui/Card";
import { MotionCard } from "@/components/ui/MotionCard";
import { NetWorthMiniChart } from "@/components/dashboard/NetWorthMiniChart";
import { AssetsTrendCard, LiabilitiesTrendCard, NetWorthTrendCard } from "@/components/dashboard/TrendGraphCards";
import {
  Activity,
  TrendingUp,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  Landmark,
  Gem,
  ArrowRightLeft,
  Briefcase,
  Download,
  Gauge
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import type { NetWorthSummary } from "@/lib/types";

// Format currency with ₹ symbol and commas
function formatCurrency(value: number): string {
  // Use absolute value for formatting, handle negative sign manually if needed
  // Net worth can be negative
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

// Format date to relative or absolute
function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [creditScore, setCreditScore] = useState<number | null>(null);

  const fetchNetWorth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/net-worth");
      if (res.ok) {
        const data = await res.json();
        setNetWorth(data);
      }
      // Also fetch credit score
      const scoreRes = await fetch("/api/credit-score/calculate");
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setCreditScore(scoreData.score?.score || null);
      }
    } catch (err) {
      console.error("Fetch net worth error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();
        setOnboardingStatus(data);
        // Show modal only if not completed
        if (!data.onboardingCompleted) {
          setShowOnboardingModal(true);
        }
      }
    } catch (err) {
      console.error("Fetch onboarding status error:", err);
    }
  }, []);

  const handleCompleteOnboarding = async () => {
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "PATCH",
      });
      if (res.ok) {
        setShowOnboardingModal(false);
        fetchOnboardingStatus(); // Refresh status
      }
    } catch (err) {
      console.error("Complete onboarding error:", err);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await fetch("/api/export/excel");

      if (!res.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await res.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Excel file downloaded successfully!');
    } catch (err) {
      console.error("Export error:", err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchNetWorth();
    fetchOnboardingStatus();
  }, [fetchNetWorth, fetchOnboardingStatus]);

  const hasData = netWorth && (
    netWorth.bankBalanceTotal > 0 ||
    netWorth.assetsTotalValue > 0 ||
    netWorth.belongingsTotalValue > 0
  );

  return (
    <DashboardShell
      title="Dashboard"
      description="Holistic view of your financial health"
      action={
        <Button
          variant="outline"
          onClick={handleExportExcel}
          disabled={exporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Download Excel'}
        </Button>
      }
    >
      <div className="space-y-8">

        {/* SECTION 1: NET WORTH OVERVIEW */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Big Net Worth Card with Chart */}
          <div className="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[220px]">
            <div>
              <h2 className="text-emerald-100 font-medium text-sm uppercase tracking-wider mb-2">Total Net Worth</h2>
              {loading ? (
                <div className="h-10 w-32 bg-emerald-500/30 rounded animate-pulse" />
              ) : (
                <h1 className="text-4xl font-bold tracking-tight">{formatCurrency(netWorth?.netWorth || 0)}</h1>
              )}
            </div>

            {/* Net Worth History Chart */}
            <NetWorthMiniChart className="my-3" />

            <div className="pt-3 border-t border-emerald-500/30 flex justify-between items-end">
              <div className="text-sm text-emerald-100">
                Updated {formatLastActivity(netWorth?.updatedAt || null)}
              </div>
              <div className="bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium">
                Live Aggregation
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickStatCard
              icon={Wallet}
              label="Cash & Bank"
              value={formatCurrency(netWorth?.bankBalanceTotal || 0)}
              color="text-blue-600"
              loading={loading}
              onClick={() => router.push('/banking')}
              delay={0.1}
            />
            <QuickStatCard
              icon={Landmark}
              label="Real Assets"
              value={formatCurrency(netWorth?.assetsTotalValue || 0)}
              color="text-indigo-600"
              loading={loading}
              onClick={() => router.push('/assets')}
              delay={0.15}
            />
            <QuickStatCard
              icon={Gem}
              label="Belongings"
              value={formatCurrency(netWorth?.belongingsTotalValue || 0)}
              color="text-violet-600"
              loading={loading}
              onClick={() => router.push('/belongings')}
              delay={0.2}
            />
            <QuickStatCard
              icon={ArrowRightLeft}
              label="Receivables"
              value={formatCurrency(netWorth?.receivablesOutstandingTotal || 0)}
              color="text-cyan-600"
              loading={loading}
              onClick={() => router.push('/receivables')}
              delay={0.25}
            />
            <QuickStatCard
              icon={Briefcase}
              label="Liabilities"
              value={formatCurrency(netWorth?.liabilitiesOutstandingTotal || 0)}
              color="text-red-600"
              loading={loading}
              onClick={() => router.push('/liabilities')}
              delay={0.3}
            />
            <QuickStatCard
              icon={Gauge}
              label="Credit Score"
              value={creditScore ? String(creditScore) : '—'}
              color="text-emerald-600"
              loading={loading}
              onClick={() => router.push('/credit-score')}
              delay={0.35}
            />
          </div>
        </div>



        {/* SECTION 2: WELCOME / ONBOARDING */}
        {!loading && !hasData && (
          <Card className="relative overflow-hidden border-emerald-200 bg-emerald-50">
            <div className="relative p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="icon-container bg-emerald-100 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Welcome to Financial Intelligence!</h3>
                  <p className="mt-2 text-slate-600 max-w-xl">
                    Your dashboard aggregates data from all modules. Start by adding your bank accounts and assets to see your net worth grow.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push("/banking")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Add Bank Account
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push("/assets")}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Add Assets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* SECTION 3: CHARTS & ANALYSIS (Existing Placeholders) */}
        {/* 
          Note: In a real scenario we would pass netWorth data to these charts.
          For now we keep them if they rely on separate 'summary' logic or hide them if not needed.
          Keeping structure clean.
        */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Portfolio Analytics</h3>
          <div className="grid gap-6 lg:grid-cols-3">
            <PortfolioSummaryCard
              hasData={!!hasData} // Using net worth presence as proxy
              totalInvested={0} // Placeholder until we link Investments module deeply
              totalValue={netWorth?.assetsTotalValue || 0}
              totalPnL={0}
            />
            <AssetAllocationCard hasData={!!hasData} netWorth={netWorth} />
            <AIInsightsCard />
          </div>
        </div>

        {/* Setup Checklist - Show if not completed */}
        {onboardingStatus && !onboardingStatus.onboardingCompleted && (
          <div className="mt-8">
            <SetupChecklistCard
              checklist={onboardingStatus.checklist}
              progress={onboardingStatus.progress}
            />
          </div>
        )}

      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboardingModal}
        onComplete={handleCompleteOnboarding}
      />
    </DashboardShell>
  );
}

function QuickStatCard({
  icon: Icon,
  label,
  value,
  color = "text-slate-900",
  onClick,
  loading = false,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
  delay?: number;
}) {
  return (
    <MotionCard
      className={`vault-card card-hover relative overflow-hidden flex flex-col justify-center ${onClick ? "cursor-pointer" : ""
        }`}
      onClick={onClick}
      delay={delay}
    >
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded mt-1 animate-pulse" />
          ) : (
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          <Icon className={`h-5 w-5 ${color} opacity-80`} />
        </div>
      </div>
    </MotionCard>
  );
}
