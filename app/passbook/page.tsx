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
  History,
  Edit2,
  Trash2,
  AlertCircle
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

  // ── FETCH DATA ─────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err: any) {
      console.error("Fetch failed:", err);
      toast.error("Fetch failed: " + err.message);
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

  // ── SYNC & PARSE ───────────────────────────────────────────────────────────
  const handleParseRaw = useCallback(async (rawText: string, source: string, packageName?: string) => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/passbook/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawText, source, package_name: packageName })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        fetchTransactions();
      } else if (result.reason === 'duplicate') {
        console.log("Duplicate skipped");
      } else if (result.reason === 'not_a_transaction') {
        console.log("Not a transaction — skipped");
      }
    } catch (err: any) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchTransactions]);

  const deleteTransaction = async (id: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Transaction deleted");
      fetchTransactions();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  // ── LIFECYCLE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTransactions();
    fetchLinkedCards();

    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform()) {
      PassbookPlugin.addListener("onTransactionDetected", (data: any) => {
        console.log("🔔 Raw signal received:", data.source, data.raw?.substring(0, 60));

        // NotificationService sends "packageName|rawText" — split here
        let rawText: string = data.raw ?? "";
        let packageName: string | undefined;

        if (rawText.includes("|") && data.source === "notification") {
          const pipeIdx = rawText.indexOf("|");
          packageName = rawText.substring(0, pipeIdx);
          rawText = rawText.substring(pipeIdx + 1);
        }

        handleParseRaw(rawText, data.source, packageName);
      });

      const interval = setInterval(() => {
        PassbookPlugin.sync().catch(console.error);
      }, 5000);

      return () => {
        clearInterval(interval);
        PassbookPlugin.removeAllListeners().catch(console.error);
      };
    }
  }, [fetchTransactions, fetchLinkedCards, handleParseRaw]);

  // ── FILTERING ─────────────────────────────────────────────────────────────
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.merchant?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.bank?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.raw_text?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (filter === "ALL") return true;
    if (filter === "CREDIT") return t.type === "credit";
    if (filter === "DEBIT") return t.type === "debit";
    if (filter === "UPI") return t.method === "upi";
    if (filter === "CARD") return t.method === "card";
    return true;
  });

  const totalDebit = transactions
    .filter((t) => t.type === "debit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <DashboardShell title="Smart Passbook" description="Universal Transaction Tracker">
      <div className="space-y-6">

        {/* 1. Status Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full relative">
            <History className="h-5 w-5 text-primary" />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Automatic Tracking Active</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              Monitoring Bank SMS & Payment Notifications
            </p>
          </div>
          {isSyncing && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
        </div>

        {/* 2. Summary Card */}
        <div className="rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] bg-white dark:bg-slate-900 border border-border text-slate-900 dark:text-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider mb-1">Total Spent</h2>
              <h1 className="text-2xl font-bold tracking-tight text-red-600">₹{totalDebit.toLocaleString("en-IN")}</h1>
            </div>
            <div className="text-right border-l border-border pl-4">
              <h2 className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider mb-1">Total Received</h2>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-600">₹{totalCredit.toLocaleString("en-IN")}</h1>
            </div>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-end mt-4">
            <div className="text-xs text-muted-foreground">{transactions.length} Transactions</div>
            <div className="text-[10px] font-bold text-primary uppercase">Real-time sync</div>
          </div>
        </div>

        {/* 3. Linked Cards Section */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Linked Cards & Banks</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {linkedCards.map(card => (
              <div key={card.id} className="min-w-[150px] border border-border bg-card p-3 rounded-xl shadow-sm flex-shrink-0">
                <div className="text-[10px] font-bold text-muted-foreground mb-2 uppercase">{card.bank}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold">•••• {card.last4}</span>
                  <div className="h-5 w-5 bg-primary/10 rounded flex items-center justify-center">
                    {card.card_type === 'upi_only' ? <Smartphone className="h-3 w-3 text-primary" /> : <CreditCard className="h-3 w-3 text-primary" />}
                  </div>
                </div>
              </div>
            ))}
            <button className="min-w-[140px] border border-dashed border-border bg-muted/30 p-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors flex-shrink-0">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Link Card</span>
            </button>
          </div>
        </div>

        {/* 4. Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search merchant, bank, or text..." className="pl-10 h-10 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex overflow-x-auto bg-muted/50 p-1 rounded-xl scrollbar-hide gap-1">
            {["ALL", "CREDIT", "DEBIT", "UPI", "CARD"].map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} className={cn("px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap uppercase", filter === tab ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-muted-foreground")}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Transaction List */}
        <Card className="overflow-hidden border-border bg-transparent shadow-none border-none">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading transactions...</div>
          ) : filteredTransactions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredTransactions.map((t) => {
                const isCredit = t.type === "credit";

                return (
                  <div key={t.id} className="bg-card border border-border rounded-2xl p-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", isCredit ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary")}>
                          {isCredit ? <ArrowDownRight className="h-5 w-5" /> : t.method === "upi" ? <Smartphone className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground leading-none">{t.merchant || "Unknown Merchant"}</h4>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                              {t.bank || 'Bank'} {t.account_last4 ? `••${t.account_last4}` : ""}
                            </span>
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                              {t.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", isCredit ? "text-emerald-600" : "text-red-600")}>
                          {isCredit ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-1 uppercase font-medium">
                          {new Date(t.transaction_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <SearchX className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-foreground">No transactions found</h3>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-medium">Monitoring your bank alerts...</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
