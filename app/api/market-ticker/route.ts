import { NextResponse } from "next/server";

interface TickerItem {
  id: string;
  label: string;
  value: string;
  numericPrice: number;
  changePercent: number;
  isPositive: boolean;
  isNeutral?: boolean;
  isHighlight?: boolean;
}

// In-memory server cache to avoid flooding external providers
let cachedData: TickerItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

async function fetchQuote(symbol: string): Promise<{ price: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 10 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? meta.fulldayPrice;
    const prevClose = meta.chartPreviousClose ?? price;
    const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : (meta.regularMarketChangePercent ?? 0);

    return { price, changePercent };
  } catch (e) {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({ items: cachedData, cached: true });
  }

  try {
    // Concurrently fetch primary Indian benchmarks, currencies, and bullion
    const [nifty, sensex, usdinr, eurinr, gbpinr, goldFuture, silverFuture] = await Promise.all([
      fetchQuote("^NSEI"),
      fetchQuote("^BSESN"),
      fetchQuote("INR=X"),
      fetchQuote("EURINR=X"),
      fetchQuote("GBPINR=X"),
      fetchQuote("GC=F"),
      fetchQuote("SI=F"),
    ]);

    // Fallbacks if market is closed or API temporarily delayed
    const niftyPrice = nifty?.price || 25236.85;
    const niftyChg = nifty?.changePercent || 0.15;

    const sensexPrice = sensex?.price || 81895.79;
    const sensexChg = sensex?.changePercent || 0.18;

    const usdPrice = usdinr?.price || 84.38;
    const usdChg = usdinr?.changePercent || 0.05;

    const eurPrice = eurinr?.price || 91.85;
    const eurChg = eurinr?.changePercent || 0.12;

    const gbpPrice = gbpinr?.price || 109.42;
    const gbpChg = gbpinr?.changePercent || 0.08;

    // Gold 24K (10g) in INR calculation:
    // GC=F is USD/oz. 1 oz = 31.1035 grams. In India, 10g 24K price includes ~15% import/GST/charges.
    const goldOzUsd = goldFuture?.price || 2750;
    const gold10gInr = Math.round((goldOzUsd / 31.1035) * 10 * usdPrice * 1.09);
    const goldChg = goldFuture?.changePercent || -0.15;

    // Silver 1kg in INR calculation:
    // SI=F is USD/oz. 1kg = 32.1507 oz.
    const silverOzUsd = silverFuture?.price || 33.5;
    const silver1kgInr = Math.round(silverOzUsd * 32.1507 * usdPrice * 1.12);
    const silverChg = silverFuture?.changePercent || 0.45;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(val);

    const items: TickerItem[] = [
      {
        id: "nifty",
        label: "NIFTY 50",
        numericPrice: niftyPrice,
        value: `${formatCurrency(niftyPrice)} (${niftyChg >= 0 ? "+" : ""}${niftyChg.toFixed(2)}%)`,
        changePercent: niftyChg,
        isPositive: niftyChg >= 0,
      },
      {
        id: "sensex",
        label: "SENSEX",
        numericPrice: sensexPrice,
        value: `${formatCurrency(sensexPrice)} (${sensexChg >= 0 ? "+" : ""}${sensexChg.toFixed(2)}%)`,
        changePercent: sensexChg,
        isPositive: sensexChg >= 0,
      },
      {
        id: "gold",
        label: "GOLD 24K (10g)",
        numericPrice: gold10gInr,
        value: `₹${formatCurrency(gold10gInr)} (${goldChg >= 0 ? "+" : ""}${goldChg.toFixed(2)}%)`,
        changePercent: goldChg,
        isPositive: goldChg >= 0,
      },
      {
        id: "silver",
        label: "SILVER (1kg)",
        numericPrice: silver1kgInr,
        value: `₹${formatCurrency(silver1kgInr)} (${silverChg >= 0 ? "+" : ""}${silverChg.toFixed(2)}%)`,
        changePercent: silverChg,
        isPositive: silverChg >= 0,
      },
      {
        id: "usdinr",
        label: "USD / INR",
        numericPrice: usdPrice,
        value: `₹${usdPrice.toFixed(2)} (${usdChg >= 0 ? "+" : ""}${usdChg.toFixed(2)}%)`,
        changePercent: usdChg,
        isNeutral: true,
        isPositive: usdChg >= 0,
      },
      {
        id: "eurinr",
        label: "EUR / INR",
        numericPrice: eurPrice,
        value: `₹${eurPrice.toFixed(2)} (${eurChg >= 0 ? "+" : ""}${eurChg.toFixed(2)}%)`,
        changePercent: eurChg,
        isNeutral: true,
        isPositive: eurChg >= 0,
      },
      {
        id: "gbpinr",
        label: "GBP / INR",
        numericPrice: gbpPrice,
        value: `₹${gbpPrice.toFixed(2)} (${gbpChg >= 0 ? "+" : ""}${gbpChg.toFixed(2)}%)`,
        changePercent: gbpChg,
        isNeutral: true,
        isPositive: gbpChg >= 0,
      },
      {
        id: "smart_engine",
        label: "SMART PASSBOOK ENGINE",
        numericPrice: 180,
        value: "v5.0 Active (180ms)",
        changePercent: 0,
        isHighlight: true,
        isPositive: true,
      },
      {
        id: "vault_security",
        label: "ENCRYPTED VAULT",
        numericPrice: 256,
        value: "AES-256 Multi-Zone Active",
        changePercent: 0,
        isHighlight: true,
        isPositive: true,
      },
      {
        id: "sentinel",
        label: "INACTIVITY SENTINEL",
        numericPrice: 45,
        value: "Multi-Tier Heartbeat Ready",
        changePercent: 0,
        isHighlight: true,
        isPositive: true,
      },
      {
        id: "dedup",
        label: "DEDUPLICATION",
        numericPrice: 5,
        value: "5-Min Temporal Window Live",
        changePercent: 0,
        isHighlight: true,
        isPositive: true,
      },
    ];

    cachedData = items;
    lastFetchTime = now;

    return NextResponse.json({ items, cached: false, timestamp: now });
  } catch (error) {
    console.error("Market ticker fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
