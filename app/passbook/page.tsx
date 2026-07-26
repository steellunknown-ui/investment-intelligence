"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Download,
  CreditCard,
  Landmark,
  ArrowDownRight,
  SearchX,
  Smartphone,
  CheckCircle2,
  Clock,
  Plus,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { toast } from "sonner";
import { registerPlugin } from "@capacitor/core";

const PassbookPlugin = registerPlugin<any>("PassbookPlugin");

export default function PassbookPage() {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [linkedCards, setLinkedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        toast.error("DB Error: " + error.message, { duration: 8000 });
      }
      if (data) setTransactions(data);
    } catch (err: any) {
      console.error("Fetch exception:", err);
      toast.error("Fetch failed: " + err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLinkedCards = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("linked_cards")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) setLinkedCards(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSaveLive = useCallback(async (data: any) => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/passbook/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: data.raw,
          source: data.source
        })
      });
      const result = await res.json();
      
      if (res.ok) {
        if (result.message === 'Duplicate transaction skipped') {
          console.log("Duplicate skipped", result.fingerprint);
        } else if (result.transaction) {
          toast.success(`✅ Parsed: ₹${result.transaction.amount} at ${result.transaction.merchant}`);
          fetchTransactions();
        }
      } else {
        toast.error("Parse error: " + result.error);
      }
    } catch (err: any) {
      toast.error("Exception: " + err?.message);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchTransactions]);

  const confirmTransaction = async (id: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("transactions").update({ is_verified: true }).eq("id", id);
      if (error) throw error;
      toast.success("Transaction verified!");
      fetchTransactions();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  const ignoreTransaction = async (id: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Transaction ignored!");
      fetchTransactions();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchLinkedCards();

    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform()) {
      PassbookPlugin.addListener("onTransactionDetected", (data: any) => {
        console.log("🔔 onTransactionDetected fired:", JSON.stringify(data));
        handleSaveLive(data);
      });

      PassbookPlugin.sync().catch(console.error);

      const interval = setInterval(() => {
        PassbookPlugin.sync().catch(console.error);
      }, 5000);

      return () => {
        clearInterval(interval);
        PassbookPlugin.removeAllListeners().catch(console.error);
      };
    }
  }, [fetchTransactions, fetchLinkedCards, handleSaveLive]);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.merchant?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.source?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (filter === "ALL") return true;
    if (filter === "PENDING") return !t.is_verified && t.source !== 'auto';
    if (filter === "UPI") return t.method === "upi" || t.source?.toLowerCase().includes("upi");
    if (filter === "CARD") return t.method === "card";
    return t.type?.toUpperCase() === filter;
  });

  const totalDebit = filteredTransactions
    .filter((t) => t.type === "debit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalCredit = filteredTransactions
    .filter((t) => t.type === "credit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <DashboardShell
      title="Smart Passbook"
      description="Automatically tracked card and UPI expenses"
    >
      <div className="space-y-6">

        {/* AI Parser Status */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-full relative">
            <Bot className="h-5 w-5 text-emerald-600" />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">AI Parser Active</h3>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500">Monitoring GPay, PhonePe, Paytm, and SMS</p>
          </div>
          {isSyncing && (
            <div className="ml-auto flex items-center gap-2 text-xs font-medium text-emerald-600">
              <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              Parsing...
            </div>
          )}
        </div>

        {/* Monthly Summary Card */}
        <div className="rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[160px] bg-white dark:bg-slate-900 border border-border text-slate-900 dark:text-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider mb-1">Total Spent (Out)</h2>
              {loading ? (
                <div className="h-8 w-24 bg-slate-100 dark:bg-white/10 animate-pulse rounded" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-red-600">₹{totalDebit.toLocaleString("en-IN")}</h1>
              )}
            </div>
            <div className="text-right border-l border-border pl-4">
              <h2 className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider mb-1">Total Received (In)</h2>
              {loading ? (
                <div className="h-8 w-24 ml-auto bg-slate-100 dark:bg-white/10 animate-pulse rounded" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-emerald-600">₹{totalCredit.toLocaleString("en-IN")}</h1>
              )}
            </div>
          </div>
        </div>

        {/* Linked Cards Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Linked Cards & Banks</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {linkedCards.map(card => (
              <div key={card.id} className="min-w-[140px] border border-border bg-card p-3 rounded-xl shadow-sm flex-shrink-0">
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{card.bank}</div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                    {card.card_type === 'upi_only' ? <Smartphone className="h-3 w-3 text-emerald-500" /> : <CreditCard className="h-3 w-3 text-blue-500" />}
                  </div>
                  <span className="text-sm font-mono font-bold">••{card.last4}</span>
                </div>
              </div>
            ))}
            <button className="min-w-[140px] border border-dashed border-border bg-muted/50 p-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors flex-shrink-0">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Link Card</span>
            </button>
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
            <div className="flex overflow-x-auto bg-muted p-1 rounded-xl scrollbar-hide">
              {["ALL", "PENDING", "CREDIT", "DEBIT", "UPI", "CARD"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                    filter === tab ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
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
              {[1, 2, 3].map((i) => (
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
              {filteredTransactions.map((t) => {
                const isCredit = t.type === "credit";
                const isPending = !t.is_verified && t.source !== 'auto';
                
                return (
                  <div 
                    key={t.id} 
                    className={cn(
                      "p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-4",
                      isPending ? "border-l-yellow-400 bg-yellow-50/30 dark:bg-yellow-500/5" :
                      t.is_verified ? "border-l-emerald-500" : "border-l-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          isCredit ? "bg-emerald-100 text-emerald-600" :
                          t.method === "upi" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {isCredit ? <ArrowDownRight className="h-5 w-5" /> :
                           t.method === "upi" ? <Smartphone className="h-5 w-5" /> :
                           <CreditCard className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{t.merchant || "Unknown Merchant"}</h4>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                              {t.method} {t.account_last4 ? `••${t.account_last4}` : ""}
                            </span>
                            <span className="text-[10px] font-medium text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 px-1.5 py-0.5 rounded uppercase border border-purple-100 dark:border-purple-500/20">
                              {t.source === 'sms' || t.source === 'notification' ? 'AI PARSED' : 'AUTO'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(t.transaction_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", isCredit ? "text-emerald-600" : "text-red-600")}>
                          {isCredit ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <p className="text-[10px] text-muted-foreground uppercase">{t.category}</p>
                        </div>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 ml-14 mt-1 border-t border-border/50 pt-2">
                        <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> PENDING CONFIRMATION
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50 px-2" onClick={() => ignoreTransaction(t.id)}>
                            Ignore
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[11px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => confirmTransaction(t.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <SearchX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No transactions found</h3>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
