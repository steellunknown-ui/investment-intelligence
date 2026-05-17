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
import { AssetsSpiderChart } from "@/components/dashboard/AssetsSpiderChart";
import { LiabilitiesTrendCard, NetWorthTrendCard } from "@/components/dashboard/TrendGraphCards";


import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
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
  LogIn
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

// Format date to readable timestamp with time
function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
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

  if (diffMins < 2) return `Just now`;
  if (diffMins < 60) return `${diffMins}m ago, ${timeStr}`;
  if (diffHours < 24) return `${diffHours}h ago, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;

  return `${dateFormatted}, ${timeStr}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);

  const fetchNetWorth = useCallback(async () => {
    try {
      setLoading(true);

      const fetchHeaders: Record<string, string> = {};
      const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

      if (isNative) {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetchHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const res = await fetch("/api/dashboard/net-worth", { headers: fetchHeaders });
      if (res.ok) {
        const data = await res.json();
        setNetWorth(data);
      }
      // Fetch last login timestamp
      try {
        const loginRes = await fetch("/api/dashboard/last-login", { headers: fetchHeaders });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setLastLoginAt(loginData.lastLoginAt || null);
        }
      } catch (loginErr) {
        console.error("Fetch last login error:", loginErr);
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
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Overview Dashboard</h2>
          <div className="border-b border-border mb-6" />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Big Net Worth Card with Chart */}
            <div className="md:col-span-2 lg:col-span-1 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[220px]" style={{ background: 'var(--summary-card-bg)', color: 'hsl(var(--summary-card-text))' }}>
              <div>
                <h2 className="opacity-80 font-medium text-sm uppercase tracking-wider mb-2">Total Net Worth</h2>
                {loading ? (
                  <div className="h-10 w-32 bg-primary/30 rounded animate-pulse" />
                ) : (
                  <h1 className="text-4xl font-bold tracking-tight">{formatCurrency(netWorth?.netWorth || 0)}</h1>
                )}
              </div>

              {/* Net Worth History Chart */}
              <NetWorthMiniChart className="my-3" />

              <div className="pt-3 border-t border-[hsl(var(--summary-card-text))]/30 flex justify-between items-end">
                <div className="text-sm opacity-80">
                  Updated {formatLastActivity(netWorth?.updatedAt || null)}
                </div>
                <div className="bg-[hsl(var(--summary-card-text))]/10 px-3 py-1 rounded-full text-xs font-medium border border-[hsl(var(--summary-card-text))]/20">
                  Live Aggregation
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
              <QuickStatCard
                icon={Wallet}
                label="Cash & Bank"
                value={formatCurrency(netWorth?.bankBalanceTotal || 0)}
                count={`${netWorth?.bank_accounts || 0} Accounts`}
                description="Total Balance"
                color="text-blue-600"
                loading={loading}
                onClick={() => router.push('/banking')}
                delay={0.1}
              />
              <QuickStatCard
                icon={Landmark}
                label="Real Assets"
                value={formatCurrency(netWorth?.assetsTotalValue || 0)}
                count={`${netWorth?.assets_count || 0} ${netWorth?.assets_count === 1 ? 'Asset' : 'Assets'}`}
                description="Total Assets Value"
                color="text-indigo-600"
                loading={loading}
                onClick={() => router.push('/assets')}
                delay={0.15}
              />
              <QuickStatCard
                icon={Gem}
                label="Belongings"
                value={formatCurrency(netWorth?.belongingsTotalValue || 0)}
                count={`${netWorth?.belongings_count || 0} ${netWorth?.belongings_count === 1 ? 'Item' : 'Items'}`}
                description="Total Belongings Value"
                color="text-violet-600"
                loading={loading}
                onClick={() => router.push('/belongings')}
                delay={0.2}
              />
              <QuickStatCard
                icon={ArrowRightLeft}
                label="Receivables"
                value={formatCurrency(netWorth?.receivablesOutstandingTotal || 0)}
                count={`${netWorth?.receivables_count || 0} ${netWorth?.receivables_count === 1 ? 'Person' : 'People'}`}
                description="Total Receivable Amount"
                color="text-cyan-600"
                loading={loading}
                onClick={() => router.push('/receivables')}
                delay={0.25}
              />
              <QuickStatCard
                icon={Briefcase}
                label="Liabilities"
                value={formatCurrency(netWorth?.liabilitiesOutstandingTotal || 0)}
                count={`${netWorth?.liabilities_count || 0} ${netWorth?.liabilities_count === 1 ? 'Loan' : 'Loans'}`}
                description="Total Outstanding"
                color="text-red-600"
                loading={loading}
                onClick={() => router.push('/liabilities')}
                delay={0.3}
              />
              <QuickStatCard
                icon={LogIn}
                label="Last Login"
                value={formatLastActivity(lastLoginAt)}
                count="Security Log"
                description="Account Access Time"
                color="text-primary"
                loading={loading}
                delay={0.35}
              />
            </div>
          </div>
        </div>

        {/* SECTION 1.5: TREND GRAPH CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AssetsSpiderChart />
          <LiabilitiesTrendCard />
          <NetWorthTrendCard />
        </div>

        {/* SECTION 2: WELCOME / ONBOARDING */}
        {!loading && !hasData && (
          <Card className="relative overflow-hidden border-emerald-200 bg-primary/10">
            <div className="relative p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="icon-container bg-emerald-100 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Welcome to Financial Intelligence!</h3>
                  <p className="mt-2 text-slate-600 max-w-xl">
                    Your dashboard aggregates data from all modules. Start by adding your bank accounts and assets to see your net worth grow.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push("/banking")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
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
        <div className="border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Analytics</h3>
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
  count,
  description,
  color = "text-slate-900",
  onClick,
  loading = false,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  count?: string;
  description?: string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
  delay?: number;
}) {
  return (
    <MotionCard
      className={`vault-card card-hover relative overflow-hidden flex flex-col justify-center h-full ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      delay={delay}
      padding="none"
    >
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
          {loading ? (
            <div className="space-y-2 mt-2">
              <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-lg font-bold mt-0.5 leading-tight truncate ${color}`}>{value}</p>
              {count && (
                <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{count}</p>
              )}
              {description && (
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter line-clamp-1">{description}</p>
              )}
            </>
          )}
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 ml-2">
          <Icon className={`h-4 w-4 ${color} opacity-80`} />
        </div>
      </div>
    </MotionCard>
  );
}
