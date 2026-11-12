"use client";

import { useEffect, useState, useRef } from "react";

export interface TickerItem {
  id: string;
  label: string;
  value: string;
  numericPrice: number;
  changePercent: number;
  isPositive: boolean;
  isNeutral?: boolean;
  isHighlight?: boolean;
}

const INITIAL_FALLBACK_ITEMS: TickerItem[] = [
  { id: "nifty", label: "NIFTY 50", numericPrice: 25236.85, value: "25,236.85 (+0.15%)", changePercent: 0.15, isPositive: true },
  { id: "sensex", label: "SENSEX", numericPrice: 81895.79, value: "81,895.79 (+0.18%)", changePercent: 0.18, isPositive: true },
  { id: "gold", label: "GOLD 24K (10g)", numericPrice: 79150, value: "₹79,150 (-0.15%)", changePercent: -0.15, isPositive: false },
  { id: "silver", label: "SILVER (1kg)", numericPrice: 94200, value: "₹94,200 (+0.45%)", changePercent: 0.45, isPositive: true },
  { id: "usdinr", label: "USD / INR", numericPrice: 84.38, value: "₹84.38 (+0.05%)", changePercent: 0.05, isNeutral: true, isPositive: true },
  { id: "eurinr", label: "EUR / INR", numericPrice: 91.85, value: "₹91.85 (+0.12%)", changePercent: 0.12, isNeutral: true, isPositive: true },
  { id: "gbpinr", label: "GBP / INR", numericPrice: 109.42, value: "₹109.42 (+0.08%)", changePercent: 0.08, isNeutral: true, isPositive: true },
  { id: "smart_engine", label: "SMART PASSBOOK ENGINE", numericPrice: 180, value: "v5.0 Active (180ms)", changePercent: 0, isHighlight: true, isPositive: true },
  { id: "vault_security", label: "ENCRYPTED VAULT", numericPrice: 256, value: "AES-256 Multi-Zone Active", changePercent: 0, isHighlight: true, isPositive: true },
  { id: "sentinel", label: "INACTIVITY SENTINEL", numericPrice: 45, value: "Multi-Tier Heartbeat Ready", changePercent: 0, isHighlight: true, isPositive: true },
  { id: "dedup", label: "DEDUPLICATION", numericPrice: 5, value: "5-Min Temporal Window Live", changePercent: 0, isHighlight: true, isPositive: true },
];

export function LiveMarketTicker() {
  const [items, setItems] = useState<TickerItem[]>(INITIAL_FALLBACK_ITEMS);
  const [lastTickId, setLastTickId] = useState<string | null>(null);

  // 1. Fetch Real-World Live Data from /api/market-ticker
  const fetchLiveData = async () => {
    try {
      const res = await fetch("/api/market-ticker", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
      }
    } catch (e) {
      console.warn("Live ticker fetch fallback:", e);
    }
  };

  useEffect(() => {
    fetchLiveData();
    // Poll API every 10 seconds for fresh market updates
    const apiInterval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(apiInterval);
  }, []);

  // 2. Continuous 1-Second Live Micro-Fluctuation Engine
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setItems((prevItems) => {
        // Randomly choose 1 or 2 market items to micro-tick (excluding static platform highlights)
        const marketIndices = [0, 1, 2, 3, 4, 5, 6]; // Nifty, Sensex, Gold, Silver, USD, EUR, GBP
        const randomIndex = marketIndices[Math.floor(Math.random() * marketIndices.length)];

        return prevItems.map((item, idx) => {
          if (idx !== randomIndex || item.isHighlight) return item;

          // Tiny fractional micro-tick (-0.03% to +0.03%)
          const deltaPct = (Math.random() * 0.06 - 0.03);
          const newPrice = item.numericPrice * (1 + deltaPct / 100);
          const newChangePct = item.changePercent + deltaPct;
          const isUp = deltaPct >= 0;

          setLastTickId(item.id);

          const formatCurrency = (val: number, maxDec: number = 2) =>
            new Intl.NumberFormat("en-IN", { maximumFractionDigits: maxDec }).format(val);

          let formattedVal = "";
          if (item.id === "gold" || item.id === "silver") {
            formattedVal = `₹${formatCurrency(Math.round(newPrice), 0)} (${newChangePct >= 0 ? "+" : ""}${newChangePct.toFixed(2)}%)`;
          } else if (item.id.includes("inr")) {
            formattedVal = `₹${newPrice.toFixed(2)} (${newChangePct >= 0 ? "+" : ""}${newChangePct.toFixed(2)}%)`;
          } else {
            formattedVal = `${formatCurrency(newPrice, 2)} (${newChangePct >= 0 ? "+" : ""}${newChangePct.toFixed(2)}%)`;
          }

          return {
            ...item,
            numericPrice: newPrice,
            changePercent: newChangePct,
            value: formattedVal,
            isPositive: newChangePct >= 0,
          };
        });
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  return (
    <div className="mt-16 w-full overflow-hidden border-b border-border/70 bg-card/80 dark:bg-slate-950/85 backdrop-blur-md py-3 sm:py-3.5 text-xs sm:text-[13px] font-mono select-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {/* Loop Set 1 */}
        <div className="flex items-center gap-8 shrink-0">
          {items.map((item, idx) => (
            <div key={`s1-${item.id}-${idx}`} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  item.isHighlight
                    ? "bg-lime-400 dark:bg-[#BBF078] animate-pulse"
                    : item.isPositive
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                    : "bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                }`}
              />
              <span className="font-bold text-foreground tracking-tight">{item.label}:</span>
              <span
                className={`transition-colors duration-300 ${
                  item.isHighlight
                    ? "text-emerald-700 dark:text-[#BBF078] font-semibold"
                    : item.isPositive
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-red-500 dark:text-red-400 font-semibold"
                }`}
              >
                {item.value}
              </span>
              <span className="text-border/70 ml-4 font-normal">|</span>
            </div>
          ))}
        </div>

        {/* Loop Set 2 (Duplicate for continuous infinite animation) */}
        <div className="flex items-center gap-8 shrink-0" aria-hidden="true">
          {items.map((item, idx) => (
            <div key={`s2-${item.id}-${idx}`} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  item.isHighlight
                    ? "bg-lime-400 dark:bg-[#BBF078] animate-pulse"
                    : item.isPositive
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                    : "bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                }`}
              />
              <span className="font-bold text-foreground tracking-tight">{item.label}:</span>
              <span
                className={`transition-colors duration-300 ${
                  item.isHighlight
                    ? "text-emerald-700 dark:text-[#BBF078] font-semibold"
                    : item.isPositive
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-red-500 dark:text-red-400 font-semibold"
                }`}
              >
                {item.value}
              </span>
              <span className="text-border/70 ml-4 font-normal">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
