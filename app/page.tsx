"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { OnboardingSlides } from "@/components/OnboardingSlides";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { PublicChatbot } from "@/components/marketing/PublicChatbot";
import { LiveMarketTicker } from "@/components/marketing/LiveMarketTicker";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  CreditCard,
  Landmark,
  Lock,
  PieChart,
  Users,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  EyeOff,
  Activity,
  Layers,
  Terminal,
  Calculator,
  AlertTriangle,
  Building2,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Shield,
  Bot,
} from "lucide-react";

// ── REALISTIC MOCK DATA FOR LIVE INTERACTIVE CONSOLE ─────────────────────────
const DEMO_TRANSACTIONS = [
  {
    id: "tx-1",
    merchant: "Swiggy UPI",
    bank: "Bank of Baroda",
    account: "••9683",
    type: "debit",
    amount: "₹342.00",
    instrument: "UPI (Bank Account)",
    category: "Dining & Food",
    time: "Today, 1:14 PM",
    ref: "BOB-631331741267",
    status: "Verified",
  },
  {
    id: "tx-2",
    merchant: "Amazon Retail India",
    bank: "HDFC Bank",
    account: "••4119",
    type: "debit",
    amount: "₹2,499.00",
    instrument: "RuPay CC · UPI",
    category: "Shopping",
    time: "Today, 11:22 AM",
    ref: "HDFC-8821940129",
    status: "Verified",
  },
  {
    id: "tx-3",
    merchant: "Infosys Ltd Salary",
    bank: "ICICI Bank",
    account: "••1048",
    type: "credit",
    amount: "₹1,85,000.00",
    instrument: "Net Banking (Salary)",
    category: "Income",
    time: "Yesterday, 6:00 AM",
    ref: "NEFT-IN0928114",
    status: "Verified",
  },
  {
    id: "tx-4",
    merchant: "Zerodha Broking Ltd",
    bank: "State Bank of India",
    account: "••7731",
    type: "debit",
    amount: "₹25,000.00",
    instrument: "UPI (Bank Account)",
    category: "Investments (SIP)",
    time: "2 days ago",
    ref: "SBI-99201481920",
    status: "Verified",
  },
];

const WEALTH_ALLOCATION = [
  { asset: "Direct Equities & ETFs", value: "₹42,50,000", pct: 44, color: "bg-lime-500 dark:bg-[#BBF078]" },
  { asset: "Mutual Funds (SIP)", value: "₹26,80,000", pct: 28, color: "bg-emerald-500" },
  { asset: "Sovereign Gold & Digital", value: "₹12,40,000", pct: 13, color: "bg-amber-400" },
  { asset: "EPF / PPF Retirement", value: "₹9,80,000", pct: 10, color: "bg-sky-500" },
  { asset: "Liquid Bank Cash", value: "₹4,90,000", pct: 5, color: "bg-slate-400" },
];

const COMPARISON_ROWS = [
  {
    feature: "Directional SMS & UPI Debit/Credit Parsing",
    us: "Smart Passbook Engine v5.0 (All Major Banks)",
    others: "Frequent misclassification of debits as credits",
    usCheck: true,
  },
  {
    feature: "RuPay Credit Card on UPI Tagging",
    us: "Native payment instrument isolation",
    others: "Merged blindly into generic bank debits",
    usCheck: true,
  },
  {
    feature: "Temporal SMS & Push Deduplication",
    us: "5-minute sliding window reconciliation",
    others: "Duplicate entries for every GPay + Bank alert",
    usCheck: true,
  },
  {
    feature: "Inactivity Nominee Protocol",
    us: "Automated 30/45-day emergency handover",
    others: "Zero succession planning (unclaimed funds)",
    usCheck: true,
  },
  {
    feature: "Data Privacy & Lead Monetization",
    us: "Zero ad tracking, on-device regex parsing",
    others: "Sells spending habits to loan & CC brokers",
    usCheck: true,
  },
  {
    feature: "Private Financial Intelligence Co-Pilot",
    us: "Context-aware wealth advisor with 8h encrypted memory",
    others: "Generic static chatbot with zero portfolio context",
    usCheck: true,
  },
];

const FAQS = [
  {
    question: "How does the Universal SMS & UPI Ledger work without human entry?",
    answer:
      "When your bank transmits an SMS notification (such as Bank of Baroda, SBI, or HDFC) or when a UPI application triggers a payment push notification, our on-device engine parses the direction (Debit vs Credit), account last 4 digits, merchant name, and payment instrument (RuPay CC on UPI, Debit, or Net Banking) locally. Raw messages are processed on your device and are never harvested or sold.",
  },
  {
    question: "What is the Inactivity Sentinel and Nominee Protection Protocol?",
    answer:
      "Modern wealth is fragmented across dozens of demat accounts, mutual fund folios, FDs, and bank apps. If an investor experiences extended inactivity (configurable to 15, 30, or 45 days), our system triggers a multi-stage check-in. If unacknowledged, your pre-designated trusted nominees receive read-only emergency access to your asset directory, policy numbers, and emergency instructions.",
  },
  {
    question: "How does the engine eliminate duplicate notifications?",
    answer:
      "In India, making a Google Pay or PhonePe payment frequently triggers an instant app push notification, followed 2 minutes later by a delayed bank SMS. Our temporal sliding-window reconciliation engine matches the amount, timestamp window, and counterparty to merge them into a single enriched ledger record without duplicate entries.",
  },
  {
    question: "Is my financial data encrypted and private?",
    answer:
      "Yes. We operate on a strict zero-ad business model. We do not sell leads to credit card companies, personal loan aggregators, or brokers. All credentials and sensitive records are encrypted using 256-bit AES vault encryption with Supabase Row Level Security (RLS).",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isNative, setIsNative] = useState(false);

  // Interactive Hero Demo State
  const [activeTab, setActiveTab] = useState<"passbook" | "wealth" | "nominee">("passbook");
  const [demoList, setDemoList] = useState(DEMO_TRANSACTIONS);
  const [simulatedCount, setSimulatedCount] = useState(0);

  // Interactive Wealth Calculator State
  const [monthlyIncome, setMonthlyIncome] = useState<number>(150000);
  const [monthlySavings, setMonthlySavings] = useState<number>(50000);
  const [currentNetWorth, setCurrentNetWorth] = useState<number>(2500000);
  const [inactivityDays, setInactivityDays] = useState<number>(30);

  useEffect(() => {
    const native = typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
    const done = localStorage.getItem("onboarding_done") === "true";
    setIsNative(native);

    const checkUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
          return;
        }
        setOnboardingDone(done);
        setChecked(true);
      } catch (err) {
        console.error("User check error:", err);
        setOnboardingDone(done);
        setChecked(true);
      }
    };

    checkUser();
  }, [router]);

  if (!checked) return null;

  if (isNative) {
    if (!onboardingDone) return <OnboardingSlides />;
    router.replace("/login");
    return null;
  }

  // Trigger simulated incoming transaction
  const handleSimulateAlert = () => {
    const newTx = {
      id: `sim-${Date.now()}`,
      merchant: simulatedCount % 2 === 0 ? "Blinkit Quick Commerce" : "Tata Power Utility",
      bank: "Bank of Baroda",
      account: "••9683",
      type: "debit",
      amount: simulatedCount % 2 === 0 ? "₹150.00" : "₹1,420.00",
      instrument: simulatedCount % 2 === 0 ? "RuPay CC · UPI" : "UPI (Bank Account)",
      category: simulatedCount % 2 === 0 ? "Groceries" : "Bills & Utilities",
      time: "Just now",
      ref: `BOB-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      status: "Deduplicated",
    };
    setDemoList([newTx, ...demoList.slice(0, 4)]);
    setSimulatedCount((prev) => prev + 1);
  };

  // Calculator projections (12% CAGR over 10 & 20 years)
  const calculateFutureWealth = (years: number) => {
    const r = 0.12 / 12; // monthly rate
    const n = years * 12; // total months
    const compoundCurrent = currentNetWorth * Math.pow(1 + 0.12, years);
    const sipFuture = monthlySavings * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    return Math.round(compoundCurrent + sipFuture);
  };

  const wealthIn10Years = calculateFutureWealth(10);
  const wealthIn20Years = calculateFutureWealth(20);
  const emergencyFund = monthlyIncome * 6;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-lime-400 selection:text-slate-950">
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────────────────
          0. REAL-TIME FINANCIAL TICKER TAPE (LIVE REAL-WORLD MARQUEE)
          ────────────────────────────────────────────────────────────────────────── */}
      <LiveMarketTicker />

      {/* ──────────────────────────────────────────────────────────────────────────
          1. THE SOVEREIGN HERO WITH HARDWARE SILHOUETTE & ARCHITECTURAL GRID
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-32 overflow-hidden border-b border-border/50">
        {/* Subtle Architectural Ambient Grid (Fine line coordinates, zero blurry purple balls) */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] pointer-events-none opacity-20 dark:opacity-25"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(187, 240, 120, 0.45), transparent 70%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Engineering Pill Badge (Lime & Navy) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/15 dark:bg-lime-950/40 border border-lime-500/30 text-lime-800 dark:text-[#BBF078] text-xs font-semibold tracking-wide mb-8 shadow-sm backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-lime-500 dark:bg-[#BBF078] animate-pulse" />
            <span>Universal Financial Engine v5.0</span>
            <span className="text-lime-600/40 dark:text-lime-400/40">|</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Local On-Device Parsing
            </span>
          </motion.div>

          {/* Main Architectural Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08] max-w-5xl mx-auto"
          >
            Total Wealth Intelligence.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-lime-600 to-emerald-700 dark:from-[#BBF078] dark:via-emerald-400 dark:to-lime-300">
              From Daily Cashflow to Generational Legacy.
            </span>
          </motion.h1>

          {/* Precision Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-normal"
          >
            The private operating system unifying real-time SMS &amp; UPI ledgering,
            multi-asset portfolio analytics, and emergency family continuity — engineered with
            zero data selling.
          </motion.p>

          {/* Action CTAs (Signature Lime Pop) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Button
              onClick={() => router.push("/signup")}
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 h-12 text-sm font-bold rounded-xl bg-lime-400 hover:bg-lime-500 text-slate-950 dark:bg-[#BBF078] dark:hover:bg-[#aee663] dark:text-slate-950 shadow-lg shadow-lime-500/20 border-0 transition-all gap-2"
            >
              Access Sovereign Console
              <ArrowRight className="h-4 w-4 text-slate-950" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              size="lg"
              className="w-full sm:w-auto px-7 py-3.5 h-12 text-sm font-medium rounded-xl border-border bg-card/70 hover:bg-card text-foreground transition-all"
            >
              Sign In to Portfolio
            </Button>
          </motion.div>

          {/* Institutional Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground border-t border-border/50 pt-8"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-[#BBF078]" />
              <span>Zero Lead Selling or Ad Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-[#BBF078]" />
              <span>Bank of Baroda, SBI, HDFC &amp; UPI Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-[#BBF078]" />
              <span>256-bit AES Inactivity Sentinel</span>
            </div>
          </motion.div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            2. INTERACTIVE LIVE FINTECH CONSOLE (SHOW, DON'T TELL)
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
          <div className="rounded-3xl border border-border bg-card/95 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Console Window Header */}
            <div className="px-5 py-4 border-b border-border/80 bg-muted/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-400/40" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                  <span className="h-3 w-3 rounded-full bg-lime-400 dark:bg-[#BBF078]" />
                </div>
                <div className="h-4 w-px bg-border mx-1" />
                <span className="text-xs font-mono font-medium text-muted-foreground tracking-tight">
                  console.investment-intelligence.in
                </span>
              </div>

              {/* Console Mode Selector */}
              <div className="flex items-center bg-background/80 p-1 rounded-xl border border-border text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("passbook")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "passbook"
                      ? "bg-lime-400 text-slate-950 dark:bg-[#BBF078] dark:text-slate-950 font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Universal Passbook
                </button>
                <button
                  onClick={() => setActiveTab("wealth")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "wealth"
                      ? "bg-lime-400 text-slate-950 dark:bg-[#BBF078] dark:text-slate-950 font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Wealth Matrix
                </button>
                <button
                  onClick={() => setActiveTab("nominee")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "nominee"
                      ? "bg-lime-400 text-slate-950 dark:bg-[#BBF078] dark:text-slate-950 font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nominee Sentinel
                </button>
              </div>
            </div>

            {/* Console Screen Body */}
            <div className="p-5 sm:p-7">
              {/* TAB 1: SMART PASSBOOK SIMULATOR */}
              {activeTab === "passbook" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span>Live UPI &amp; Bank Transaction Stream</span>
                        <span className="text-[10px] font-mono font-semibold bg-lime-500/15 text-lime-700 dark:text-[#BBF078] border border-lime-500/30 px-2 py-0.5 rounded-full">
                          Deduplication Active
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Directional debit/credit parsing with instant RuPay CC &amp; UPI tagging.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={handleSimulateAlert}
                      className="bg-lime-400 hover:bg-lime-500 text-slate-950 dark:bg-[#BBF078] dark:hover:bg-[#aee663] text-xs font-bold gap-1.5 rounded-xl shadow-sm self-start sm:self-auto"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Simulate Incoming Alert
                    </Button>
                  </div>

                  {/* Transaction Feed */}
                  <div className="space-y-2.5">
                    <AnimatePresence>
                      {demoList.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-3.5 rounded-2xl bg-muted/30 border border-border hover:border-lime-500/40 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                tx.type === "credit"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-slate-500/10 border-slate-500/20 text-foreground"
                              }`}
                            >
                              {tx.type === "credit" ? (
                                <ArrowDownRight className="h-5 w-5" />
                              ) : tx.instrument.includes("RuPay") ? (
                                <Zap className="h-5 w-5 text-purple-500" />
                              ) : (
                                <Smartphone className="h-5 w-5 text-sky-500" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-foreground truncate">
                                  {tx.merchant}
                                </h4>
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {tx.bank} {tx.account}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-emerald-800 dark:text-[#BBF078] bg-lime-500/15 px-2 py-0.5 rounded-full border border-lime-500/20">
                                  {tx.instrument}
                                </span>
                                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                  Ref: {tx.ref}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-sm font-bold font-mono tracking-tight block ${
                                tx.type === "credit"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground"
                              }`}
                            >
                              {tx.type === "credit" ? "+" : "-"}
                              {tx.amount}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {tx.time}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* TAB 2: WEALTH MATRIX */}
              {activeTab === "wealth" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Consolidated Portfolio Net Worth
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Unified tracking across Equities, Mutual Funds, Gold, Real Estate &amp; FDs.
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Aggregated Net Worth
                      </span>
                      <div className="text-2xl font-extrabold font-mono text-foreground">
                        ₹96,40,000
                        <span className="text-xs font-semibold text-emerald-600 dark:text-[#BBF078] ml-2">
                          +14.8% YTD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Stacked Bar */}
                  <div className="space-y-2">
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
                      {WEALTH_ALLOCATION.map((item) => (
                        <div
                          key={item.asset}
                          style={{ width: `${item.pct}%` }}
                          className={`${item.color} h-full transition-all`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground block text-right font-mono">
                      Institutional Diversification Score: 92/100
                    </span>
                  </div>

                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {WEALTH_ALLOCATION.map((item) => (
                      <div
                        key={item.asset}
                        className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                          <span className="text-xs font-medium text-foreground">{item.asset}</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: NOMINEE SENTINEL */}
              {activeTab === "nominee" && (
                <div className="space-y-5">
                  <div className="pb-2 border-b border-border/50">
                    <h3 className="text-sm font-bold text-foreground">
                      Emergency Inactivity &amp; Family Continuity Sentinel
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Ensures your family has encrypted, read-only emergency access if life takes an
                      unexpected turn.
                    </p>
                  </div>

                  {/* Flow Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                      <div className="h-8 w-8 rounded-lg bg-lime-400/20 text-lime-800 dark:text-[#BBF078] flex items-center justify-center font-bold text-xs font-mono">
                        01
                      </div>
                      <h4 className="text-xs font-bold text-foreground">Inactivity Window</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Configured to 30 or 45 days. If no login is recorded, the sentinel enters
                        grace verification.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                        02
                      </div>
                      <h4 className="text-xs font-bold text-foreground">Two-Stage Ping</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Dual SMS &amp; Email alerts are sent to you. A single click resets the countdown
                        instantly.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                        03
                      </div>
                      <h4 className="text-xs font-bold text-foreground">Nominee Handover</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Trusted nominees receive read-only vault access to insurance, bank folios,
                        and asset locations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. INTERACTIVE WEALTH PROJECTION & SUCCESSION CALCULATOR (REAL DATA)
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-muted/20 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-[#BBF078]">
              Tactile Wealth Simulator
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-3">
              Calculate Your 10-Year Velocity &amp; Protection.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-4 leading-relaxed">
              Adjust your monthly cashflow and current net worth to simulate generational wealth
              accumulation alongside your emergency continuity threshold.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls: Sliders */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Monthly Savings / Investments (SIP)
                  </label>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-[#BBF078]">
                    ₹{monthlySavings.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  className="w-full accent-lime-400 h-2 bg-muted rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>₹5K</span>
                  <span>₹2.5L</span>
                  <span>₹5L/mo</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Current Consolidated Net Worth
                  </label>
                  <span className="font-mono font-bold text-sm text-foreground">
                    ₹{(currentNetWorth / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="50000000"
                  step="500000"
                  value={currentNetWorth}
                  onChange={(e) => setCurrentNetWorth(Number(e.target.value))}
                  className="w-full accent-lime-400 h-2 bg-muted rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>₹1 Lakh</span>
                  <span>₹2.5 Cr</span>
                  <span>₹5 Cr+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Monthly Living Expenses
                  </label>
                  <span className="font-mono font-bold text-sm text-muted-foreground">
                    ₹{monthlyIncome.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="1000000"
                  step="10000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full accent-lime-400 h-2 bg-muted rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Sentinel Inactivity Protection Window
                  </label>
                  <span className="font-mono font-bold text-sm text-amber-500">
                    {inactivityDays} Days
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((days) => (
                    <button
                      key={days}
                      onClick={() => setInactivityDays(days)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        inactivityDays === days
                          ? "bg-lime-400 text-slate-950 dark:bg-[#BBF078] dark:text-slate-950 border-lime-400"
                          : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Projection Card */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Institutional Growth Forecast (12% CAGR)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-[#BBF078] border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Compounding Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    10-Year Trajectory
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-[#BBF078] block mt-1">
                    ₹{(wealthIn10Years / 10000000).toFixed(2)} Cr
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ₹{wealthIn10Years.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    20-Year Legacy
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400 block mt-1">
                    ₹{(wealthIn20Years / 10000000).toFixed(2)} Cr
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ₹{wealthIn20Years.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Recommended 6-Month Emergency Liquidity:</span>
                  <span className="font-mono font-bold text-white">
                    ₹{emergencyFund.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Unclaimed Asset Risk Without Nominee Sentinel:</span>
                  <span className="font-mono font-bold text-red-400">
                    High (Over ₹1.5L Cr in India)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Grace Period Before Family Handover:</span>
                  <span className="font-mono font-bold text-[#BBF078]">
                    {inactivityDays} Days + 2 Warning Pings
                  </span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/signup")}
                size="lg"
                className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 dark:bg-[#BBF078] dark:hover:bg-[#aee663] font-bold text-xs rounded-xl shadow-md gap-2"
              >
                Track &amp; Protect This Wealth Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. THE FOUR ARCHITECTURAL PILLARS (EXPANDED BENTO GRID)
          ────────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-[#BBF078]">
              The Core Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-3">
              Four Pillars of Financial Sovereignty.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-4 leading-relaxed">
              Built from scratch to eliminate manual spreadsheets, broken bank SMS alerts, and
              unclaimed family wealth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1: Smart Passbook */}
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-lime-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-lime-400/15 dark:bg-lime-950/40 border border-lime-500/30 text-lime-800 dark:text-[#BBF078] flex items-center justify-center mb-6">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Smart Passbook &amp; UPI Ledger v5.0
                </h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Directional debit/credit parsing built specifically for SBI, HDFC, ICICI, Bank of
                  Baroda, and all major banks. Accurately flags RuPay Credit Cards on UPI, card
                  swipes, net banking, and eliminates duplicates between instant GPay push alerts and
                  delayed bank SMS.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/60 font-mono text-[11px] text-muted-foreground space-y-1">
                  <div>• Directional Debit/Credit Engine</div>
                  <div>• RuPay CC on UPI Instrument Isolation</div>
                  <div>• 5-Minute Sliding-Window Deduplication</div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border/50 text-xs font-mono text-emerald-600 dark:text-[#BBF078] font-semibold flex items-center gap-1">
                Zero Manual Entry <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Pillar 2: Multi-Asset Radar */}
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-lime-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-lime-400/15 dark:bg-lime-950/40 border border-lime-500/30 text-lime-800 dark:text-[#BBF078] flex items-center justify-center mb-6">
                  <PieChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Unified Multi-Asset Radar
                </h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Consolidates your complete net worth in one single pane of glass: Direct Indian
                  Equities, Mutual Fund SIPs, Sovereign Gold Bonds, EPF/PPF retirement folios,
                  Fixed Deposits, Real Estate, and outstanding loans/liabilities.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/60 font-mono text-[11px] text-muted-foreground space-y-1">
                  <div>• 8 Tracked Indian Asset Classes</div>
                  <div>• Real-Time Asset Allocation &amp; Radar Scores</div>
                  <div>• Net Worth Velocity &amp; Burn Rate Analysis</div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border/50 text-xs font-mono text-emerald-600 dark:text-[#BBF078] font-semibold flex items-center gap-1">
                Single Pane of Truth <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Pillar 3: Inactivity Sentinel */}
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-lime-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-lime-400/15 dark:bg-lime-950/40 border border-lime-500/30 text-lime-800 dark:text-[#BBF078] flex items-center justify-center mb-6">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Inactivity Nominee Sentinel
                </h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Over ₹1.5 lakh crore lies unclaimed across Indian banks and insurance firms because
                  families are unaware of account details. Our inactivity sentinel activates a
                  two-stage grace check before granting trusted nominees read-only access to asset
                  locations.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/60 font-mono text-[11px] text-muted-foreground space-y-1">
                  <div>• Configurable Inactivity Window (15/30/45 Days)</div>
                  <div>• Two-Stage SMS &amp; Email Heartbeat Pings</div>
                  <div>• Read-Only Vault Handover to Verified Nominees</div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border/50 text-xs font-mono text-emerald-600 dark:text-[#BBF078] font-semibold flex items-center gap-1">
                Generational Continuity <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Pillar 4: Autonomous Wealth Intelligence Co-Pilot */}
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-lime-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-lime-400/15 dark:bg-lime-950/40 border border-lime-500/30 text-lime-800 dark:text-[#BBF078] flex items-center justify-center mb-6">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Autonomous Wealth Intelligence Co-Pilot
                </h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  A private, context-aware co-pilot that continuously monitors balance sheet health.
                  Evaluates 6-month liquid runway against fixed expenses, audits debt-to-asset ratios,
                  surfaces upcoming insurance renewal horizons, and answers complex net worth questions
                  without exposing sensitive financial records to external ad trackers.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/60 font-mono text-[11px] text-muted-foreground space-y-1">
                  <div>• Real-Time Debt-to-Asset &amp; Liquidity Stress Testing</div>
                  <div>• Proactive Insurance Lapse &amp; Premium Horizon Alerts</div>
                  <div>• 8-Hour Ephemeral Session Security (Zero Persistent Logging)</div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border/50 text-xs font-mono text-emerald-600 dark:text-[#BBF078] font-semibold flex items-center gap-1">
                Explore Autonomous Co-Pilot <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. INSTITUTIONAL COMPARISON MATRIX (TRANSPARENCY VS CONSUMER APPS)
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-muted/10 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-[#BBF078]">
              Architectural Standard
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight mt-2">
              How We Differ From Consumer Apps.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Free consumer expense trackers make money by selling your spending data. We do not.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40">
                    <th className="py-4 px-5 font-bold text-foreground">Capability</th>
                    <th className="py-4 px-5 font-bold text-emerald-700 dark:text-[#BBF078]">
                      Investment Intelligence
                    </th>
                    <th className="py-4 px-5 font-bold text-muted-foreground">
                      Standard Expense Trackers
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-foreground">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-5 text-emerald-700 dark:text-[#BBF078] font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-[#BBF078]" />
                        <span>{row.us}</span>
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground">
                        <span className="text-slate-500">{row.others}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. FREQUENTLY ASKED QUESTIONS (EDITORIAL & CLEAR)
          ────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 sm:py-32 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-[#BBF078]">
              Clarity &amp; Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mt-3">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Everything you need to know about the engine and family protection architecture.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <Accordion type="single" collapsible>
              {FAQS.map((faq, idx) => (
                <AccordionItem key={faq.question} value={`item-${idx}`} title={faq.question}>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 pb-3">
                    {faq.answer}
                  </p>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          7. THE SOVEREIGN FINAL CTA
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Take Sovereign Control of Your Wealth.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Join the new standard of Indian private wealth intelligence. Clean, fast, and engineered
            without compromise.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              onClick={() => router.push("/signup")}
              size="lg"
              className="w-full sm:w-auto px-9 py-3.5 h-12 bg-lime-400 hover:bg-lime-500 text-slate-950 dark:bg-[#BBF078] dark:hover:bg-[#aee663] font-bold text-sm rounded-xl shadow-lg shadow-lime-500/20 border-0 transition-all gap-2"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 text-slate-950" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              size="lg"
              className="w-full sm:w-auto px-7 py-3.5 h-12 text-sm font-medium rounded-xl border-border bg-card/70 hover:bg-card text-foreground transition-all"
            >
              Access Existing Account
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <PublicChatbot />
    </div>
  );
}
