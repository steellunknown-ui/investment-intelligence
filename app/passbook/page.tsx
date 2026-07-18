"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Filter,
  Download,
  CreditCard,
  Landmark,
  History,
  ArrowUpRight,
  ArrowDownRight,
  SearchX,
  Smartphone,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { toast } from "sonner";

// --- START: Plugin Definition for Typescript ---
interface PassbookPlugin {
  addListener(
    eventName: 'onTransactionDetected',
    listenerFunc: (data: { source: string; merchant: string; amount: number; type: string; raw: string }) => void
  ): Promise<any>;
}

// @ts-ignore
const getPassbookPlugin = () => {
  if (typeof window !== 'undefined') {
    return (window as any).Capacitor?.Plugins?.PassbookPlugin;
  }
  return null;
};
// --- END: Plugin Definition ---

export default function PassbookPage() {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase
  const fetchTransactions = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (data) setTransactions(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const PassbookPlugin = getPassbookPlugin();
    // Setup Listener for live detection
    if (PassbookPlugin) {
      PassbookPlugin.addListener('onTransactionDetected', (data: any) => {
        toast.info("New transaction detected!", {
          description: `₹${data.amount} at ${data.merchant}. Tap to save.`,
          action: {
            label: "Save",
            onClick: () => handleSaveLive(data)
          },
          duration: 10000
        });
      });
    }
  }, []);

  const handleSaveLive = async (data: any) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        source_name: data.source,
        merchant_name: data.merchant,
        amount: data.amount,
        payment_mode: data.type,
        raw_message: data.raw,
        category: "Pending"
      });

      if (!error) {
        toast.success("Transaction saved to Passbook!");
        fetchTransactions();
      }
    } catch (err) {
      toast.error("Failed to save transaction");
    }
  };

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    const matchesTab = filter === "ALL" || t.payment_mode === filter;
    const matchesSearch = (t.merchant_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          (t.source_name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalSpend = filteredTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <DashboardShell
      title="Smart Passbook"
      description="Automatically tracked card and UPI expenses"
      action={
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            toast.info("Export started...");
          }}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Monthly Summary Card */}
        <div className="rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div>
            <h2 className="opacity-80 font-medium text-sm uppercase tracking-wider mb-2">Total Detected Spend</h2>
            {loading ? (
              <div className="h-10 w-32 bg-white/10 animate-pulse rounded" />
            ) : (
              <h1 className="text-4xl font-bold tracking-tight">₹{totalSpend.toLocaleString('en-IN')}</h1>
            )}
          </div>
          <div className="pt-3 border-t border-white/10 flex justify-between items-end">
            <div className="text-sm opacity-80">
              {filteredTransactions.length} Transactions tracked
            </div>
            <div className="bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Tracking Active
            </div>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchant or card..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-muted p-1 rounded-xl">
              {["ALL", "CREDIT", "DEBIT", "UPI"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    filter === tab
                      ? "bg-background shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <Card className="overflow-hidden border-border">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      t.payment_mode === "CREDIT" ? "bg-purple-100 text-purple-600" :
                      t.payment_mode === "DEBIT" ? "bg-blue-100 text-blue-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {t.payment_mode === "CREDIT" ? <CreditCard className="h-5 w-5" /> :
                       t.payment_mode === "DEBIT" ? <Landmark className="h-5 w-5" /> :
                       <Smartphone className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{t.merchant_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                          {t.source_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(t.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">-₹{Number(t.amount).toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <p className="text-[10px] text-muted-foreground uppercase">{t.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <SearchX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No transactions found</h3>
              <p className="text-xs text-muted-foreground mt-1">Wait for a bank SMS or adjust your filters.</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
