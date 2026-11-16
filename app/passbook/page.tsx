"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Search,
  CreditCard,
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  SearchX,
  Smartphone,
  History,
  Trash2,
  Send,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Sparkles,
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

  // Native Android Auto-Capture Permissions State
  const [isNative, setIsNative] = useState(false);
  const [smsPermission, setSmsPermission] = useState<boolean | null>(null);
  const [notifAccess, setNotifAccess] = useState<boolean | null>(null);
  const [showRestrictedHelp, setShowRestrictedHelp] = useState(false);

  // Selected Transaction for Details Modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // SMS / Notification Test Simulator Drawer/Bar
  const [showSimulator, setShowSimulator] = useState(false);
  const [simText, setSimText] = useState("");
  const [simSender, setSimSender] = useState("VK-BOBSMS");
  const [isParsingSim, setIsParsingSim] = useState(false);

  const checkPerms = useCallback(async () => {
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform()) {
      setIsNative(true);
      try {
        const status = await PassbookPlugin.checkStatus();
        if (status) {
          setSmsPermission(status.smsPermission ?? false);
          setNotifAccess(status.notificationAccess ?? false);
        }
      } catch (e) {
        console.warn("Could not check native permissions:", e);
      }
    }
  }, []);

  const handleRequestSMS = async () => {
    try {
      const res = await PassbookPlugin.requestSMSPermission();
      if (res?.granted) {
        toast.success("SMS Permission Granted!");
        checkPerms();
      } else {
        setShowRestrictedHelp(true);
      }
    } catch (e) {
      setShowRestrictedHelp(true);
    }
  };

  const handleOpenAppSettings = async () => {
    try {
      await PassbookPlugin.openAppSettings();
    } catch (e) {
      toast.error("Could not open settings: " + (e as Error).message);
    }
  };

  const handleOpenNotifSettings = async () => {
    try {
      await PassbookPlugin.openNotificationSettings();
    } catch (e) {
      toast.error("Could not open notification settings: " + (e as Error).message);
    }
  };

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
  const handleParseRaw = useCallback(
    async (rawText: string, source: string, packageName?: string, sender?: string) => {
      try {
        setIsSyncing(true);
        const res = await fetch("/api/passbook/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_text: rawText,
            source,
            package_name: packageName,
            sender,
          }),
        });
        const result = await res.json();

        if (res.ok && result.success) {
          if (result.action === "merged") {
            toast.info("Enriched existing transaction with bank details");
          } else {
            toast.success("New transaction logged!");
          }
          fetchTransactions();
        } else if (result.reason === "duplicate") {
          console.log("Duplicate skipped");
        } else if (result.reason === "not_a_transaction") {
          console.log("Not a financial transaction — skipped");
        }
      } catch (err: any) {
        console.error("Sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [fetchTransactions]
  );

  const deleteTransaction = async (id: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Transaction deleted");
      setSelectedTx(null);
      fetchTransactions();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  // Simulator test submission
  const handleSimulateSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    setIsParsingSim(true);
    try {
      await handleParseRaw(simText.trim(), "sms", undefined, simSender.trim() || undefined);
      setSimText("");
      setShowSimulator(false);
    } finally {
      setIsParsingSim(false);
    }
  };

  // ── LIFECYCLE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTransactions();
    fetchLinkedCards();
    checkPerms();

    // Listen for live transactions logged globally by GlobalPassbookSync
    const handleTxLogged = () => {
      fetchTransactions();
      fetchLinkedCards();
    };

    window.addEventListener("ii:transaction-logged", handleTxLogged);

    // If native, trigger an initial sync and check permissions periodically
    let permInterval: any = null;
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform()) {
      PassbookPlugin.sync().catch(console.error);
      permInterval = setInterval(checkPerms, 6000);
    }

    return () => {
      window.removeEventListener("ii:transaction-logged", handleTxLogged);
      if (permInterval) clearInterval(permInterval);
    };
  }, [fetchTransactions, fetchLinkedCards, checkPerms]);

  // ── FILTERING ─────────────────────────────────────────────────────────────
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.merchant?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.bank?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.instrument?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.transaction_ref?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (t.raw_text?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "ALL") return true;
    if (filter === "UPI") return t.method === "upi" || t.instrument?.includes("UPI");
    if (filter === "RUPAY CC") return t.instrument?.toLowerCase().includes("rupay");
    if (filter === "CARDS") return t.method === "card" || t.instrument?.includes("Card");
    if (filter === "DEBIT") return t.type === "debit";
    if (filter === "CREDIT") return t.type === "credit";
    return true;
  });

  const totalDebit = transactions
    .filter((t) => t.type === "debit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Helper for instrument badges
  const renderInstrumentBadge = (instrument?: string, network?: string) => {
    const inst = instrument || "UPI (Bank Account)";

    if (inst.includes("RuPay") || network === "RuPay") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
          <Zap className="h-3 w-3" />
          RuPay CC · UPI
        </span>
      );
    }
    if (inst.includes("UPI")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
          <Smartphone className="h-3 w-3" />
          UPI
        </span>
      );
    }
    if (inst.includes("Credit Card")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
          <CreditCard className="h-3 w-3" />
          Credit Card {network ? `(${network})` : ""}
        </span>
      );
    }
    if (inst.includes("Debit Card")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
          <CreditCard className="h-3 w-3" />
          Debit Card {network ? `(${network})` : ""}
        </span>
      );
    }
    if (inst.includes("Wallet")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
          <Zap className="h-3 w-3" />
          Wallet
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
        <Landmark className="h-3 w-3" />
        {inst}
      </span>
    );
  };

  return (
    <DashboardShell title="Smart Passbook" description="Intelligent Universal Financial Tracker">
      <div className="space-y-6">

        {/* 1. Header Banner & Test SMS Simulator Toggle */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 p-2.5 rounded-xl relative shrink-0">
              <History className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Real-Time Passbook Active
                </h3>
                <span className="text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  v5.0 Engine
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed max-w-xl">
                Monitoring verified Bank SMS &amp; UPI payment signals with automated deduplication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto relative z-10">
            {isSyncing && (
              <div className="animate-spin h-4 w-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full" />
            )}
            <Button
              size="sm"
              onClick={() => setShowSimulator(!showSimulator)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm px-3.5 py-1.5 rounded-xl transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
              {showSimulator ? "Close Simulator" : "Test Real SMS"}
            </Button>
          </div>
        </div>

        {/* 1.5 Android Native Permission Diagnostic Banner */}
        {isNative && (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-5 w-5 text-emerald-600 dark:text-[#BBF078]" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Android Automated Ledger Sentinel
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Direct on-device capture from Bank SMS &amp; UPI notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    smsPermission
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      smsPermission ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  SMS: {smsPermission ? "Active" : "Disabled"}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    notifAccess
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      notifAccess ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  Notifications: {notifAccess ? "Active" : "Disabled"}
                </span>
              </div>
            </div>

            {(!smsPermission || !notifAccess) && (
              <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="text-muted-foreground">
                  {!smsPermission && notifAccess && (
                    <span>
                      SMS permission is disabled. On Android 13/14/15, unlock <strong>Restricted Settings</strong> to enable.
                    </span>
                  )}
                  {smsPermission && !notifAccess && (
                    <span>
                      Notification Access is off. Enable it to record transactions from GPay, PhonePe, Paytm, and banking apps.
                    </span>
                  )}
                  {!smsPermission && !notifAccess && (
                    <span>
                      Both permissions are off. Enable both for 100% automated debit/credit capture.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {!smsPermission && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRequestSMS}
                        className="h-8 text-xs font-medium"
                      >
                        Request SMS
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowRestrictedHelp(true)}
                        className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                      >
                        Unlock SMS (3 Dots ⋮)
                      </Button>
                    </>
                  )}
                  {!notifAccess && (
                    <Button
                      size="sm"
                      onClick={handleOpenNotifSettings}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Enable Notifications
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Test Simulator Bar (Expandable) */}
        {showSimulator && (
          <Card className="p-4 border-primary/30 bg-primary/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleSimulateSMS} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Test Universal Transaction Parser
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Paste real Bank of Baroda, SBI, HDFC, or UPI SMS
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  placeholder="Sender (e.g. VK-BOBSMS)"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="text-xs h-9 sm:col-span-1"
                />
                <Input
                  placeholder="Paste SMS here (e.g. Rs.150.00 Dr. from A/C XXXXXX9683 and Cr. to paytm.s2fqhc4@pty...)"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="text-xs h-9 sm:col-span-3"
                  required
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setSimText(
                      "Rs.150.00 Dr. from A/C XXXXXX9683 and Cr. to paytm.s2fqhc4@pty. Ref:631331741267. AvlBal:Rs2065.63(2026:11:09 09:35:26). Not you? Call 18005700/5000-BOB"
                    )
                  }
                  className="text-[11px] text-primary hover:underline"
                >
                  Load BOB Sample SMS
                </button>
                <Button type="submit" size="sm" disabled={isParsingSim} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  {isParsingSim ? "Parsing..." : "Parse & Log"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 3. Summary Cashflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 rounded-2xl bg-card border-border shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Spent (Debits)
            </span>
            <div className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400 mt-1">
              ₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.filter((t) => t.type === "debit").length} debit transactions
            </p>
          </Card>

          <Card className="p-5 rounded-2xl bg-card border-border shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Received (Credits)
            </span>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.filter((t) => t.type === "credit").length} credit transactions
            </p>
          </Card>

          <Card className="p-5 rounded-2xl bg-card border-border shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Net Balance Flow
            </span>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight mt-1",
                totalCredit >= totalDebit ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {totalCredit >= totalDebit ? "+" : "-"}₹
              {Math.abs(totalCredit - totalDebit).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {transactions.length} Total verified entries
            </p>
          </Card>
        </div>

        {/* 4. Search & Multi-Level Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search merchant, bank, UTR ref, instrument, category..."
              className="pl-10 h-10 text-sm rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex overflow-x-auto bg-muted/60 p-1 rounded-xl scrollbar-hide gap-1">
            {["ALL", "UPI", "RUPAY CC", "CARDS", "DEBIT", "CREDIT"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap uppercase",
                  filter === tab
                    ? "bg-white dark:bg-slate-800 shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Transaction List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Loading verified passbook transactions...
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => {
              const isCredit = t.type === "credit";

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTx(t)}
                  className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Icon + Merchant & Badges */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border",
                          isCredit
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            : "bg-primary/10 border-primary/20 text-primary"
                        )}
                      >
                        {isCredit ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : t.instrument?.includes("RuPay") ? (
                          <Zap className="h-5 w-5 text-purple-600" />
                        ) : t.method === "upi" ? (
                          <Smartphone className="h-5 w-5 text-sky-600" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-amber-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {t.merchant || "Unknown Merchant"}
                          </h4>
                          {t.is_verified && (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>

                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {renderInstrumentBadge(t.instrument, t.card_network)}

                          {t.bank && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">
                              {t.bank} {t.account_last4 ? `••${t.account_last4}` : ""}
                            </span>
                          )}

                          {t.category && (
                            <span className="text-[10px] font-semibold text-foreground/80 bg-foreground/5 px-2 py-0.5 rounded-full">
                              {t.category}
                            </span>
                          )}

                          {t.balance_after != null && (
                            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                              Bal: ₹{Number(t.balance_after).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Date */}
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          "text-base font-bold tracking-tight",
                          isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {isCredit ? "+" : "-"}₹
                        {Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(t.transaction_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Card className="p-12 text-center border-dashed rounded-2xl">
              <SearchX className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No transactions found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Passbook will automatically log when your bank sends a payment alert.
              </p>
            </Card>
          )}
        </div>

        {/* 6. Transaction Details Dialog */}
        {selectedTx && (
          <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-base font-bold">
                    Transaction Details
                  </DialogTitle>
                  <Badge variant={selectedTx.type === "credit" ? "success" : "destructive"}>
                    {selectedTx.type.toUpperCase()}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Full transaction breakdown and audit trail
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Amount Header */}
                <div className="p-4 bg-muted/40 rounded-xl text-center border">
                  <span className="text-xs text-muted-foreground font-medium uppercase">
                    Amount
                  </span>
                  <div
                    className={cn(
                      "text-3xl font-extrabold tracking-tight mt-1",
                      selectedTx.type === "credit" ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {selectedTx.type === "credit" ? "+" : "-"}₹
                    {Number(selectedTx.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="mt-2 flex justify-center">
                    {renderInstrumentBadge(selectedTx.instrument, selectedTx.card_network)}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-muted/20 border rounded-lg">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Merchant / Counterparty
                    </span>
                    <span className="font-semibold text-foreground truncate block mt-0.5">
                      {selectedTx.merchant || "N/A"}
                    </span>
                  </div>

                  <div className="p-2.5 bg-muted/20 border rounded-lg">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Bank & Account
                    </span>
                    <span className="font-semibold text-foreground truncate block mt-0.5">
                      {selectedTx.bank || "N/A"}{" "}
                      {selectedTx.account_last4 ? `(••${selectedTx.account_last4})` : ""}
                    </span>
                  </div>

                  <div className="p-2.5 bg-muted/20 border rounded-lg">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Category
                    </span>
                    <span className="font-semibold text-foreground block mt-0.5">
                      {selectedTx.category || "General"}
                    </span>
                  </div>

                  <div className="p-2.5 bg-muted/20 border rounded-lg">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Available Balance
                    </span>
                    <span className="font-semibold text-foreground block mt-0.5">
                      {selectedTx.balance_after != null
                        ? `₹${Number(selectedTx.balance_after).toLocaleString("en-IN")}`
                        : "N/A"}
                    </span>
                  </div>

                  {selectedTx.upi_id && (
                    <div className="p-2.5 bg-muted/20 border rounded-lg col-span-2">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        UPI ID / VPA
                      </span>
                      <span className="font-mono text-foreground block mt-0.5">
                        {selectedTx.upi_id}
                      </span>
                    </div>
                  )}

                  {selectedTx.transaction_ref && (
                    <div className="p-2.5 bg-muted/20 border rounded-lg col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                          UTR / Reference Number
                        </span>
                        <span className="font-mono font-semibold text-foreground block mt-0.5">
                          {selectedTx.transaction_ref}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTx.transaction_ref);
                          setCopiedRef(true);
                          setTimeout(() => setCopiedRef(false), 2000);
                        }}
                      >
                        {copiedRef ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Raw Message Log */}
                {selectedTx.raw_text && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Original Financial Alert
                    </span>
                    <div className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono rounded-xl max-h-24 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                      {selectedTx.raw_text}
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 flex justify-between items-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTransaction(selectedTx.id)}
                    className="gap-1.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Entry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTx(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 6. Android Restricted Settings Guide Dialog */}
        <Dialog open={showRestrictedHelp} onOpenChange={setShowRestrictedHelp}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-amber-500" />
                Unrestrict SMS Permission (Android 13/14/15)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                When you install an APK directly, Android automatically disables sensitive permissions for security. Here is how to unlock it in 15 seconds:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-foreground">Open App Info</p>
                  <p className="text-muted-foreground mt-0.5">
                    Tap the button below to jump directly to Investment Intelligence in Android Settings.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-foreground">Tap 3 Dots (⋮) at Top-Right</p>
                  <p className="text-muted-foreground mt-0.5">
                    Tap the <strong>three vertical dots (⋮)</strong> in the top-right corner of the screen.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-foreground">Select &quot;Allow restricted settings&quot;</p>
                  <p className="text-muted-foreground mt-0.5">
                    Authenticate with your fingerprint or PIN when prompted.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  4
                </span>
                <div>
                  <p className="font-semibold text-foreground">Enable SMS</p>
                  <p className="text-muted-foreground mt-0.5">
                    Tap <strong>Permissions</strong> → <strong>SMS</strong> → select <strong>Allow</strong>. The toggle is now active!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestrictedHelp(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleOpenAppSettings}
                className="bg-primary text-primary-foreground font-semibold text-xs gap-1.5"
              >
                Open App Info Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardShell>
  );
}
