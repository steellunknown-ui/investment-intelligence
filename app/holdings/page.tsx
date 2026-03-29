"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { HoldingsTable } from "@/components/holdings/HoldingsTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ASSET_TYPES } from "@/lib/constants";
import type { Holding } from "@/lib/types";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { tradingExchanges, investmentTypes, popularBrokersIndia, holdingNotes } from "@/src/lib/presets";
import { Sparkles } from "lucide-react";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [quantity, setQuantity] = useState("");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");
  const [notes, setNotes] = useState("");

  // QuickPick State
  const [showStockPick, setShowStockPick] = useState(false);
  const [showNotesPick, setShowNotesPick] = useState(false);

  const fetchHoldings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/holdings");
      if (!res.ok) throw new Error("Failed to fetch holdings");
      const data = await res.json();
      setHoldings(data.holdings || []);
    } catch (err) {
      console.error("Fetch holdings error:", err);
      setError("Failed to load holdings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const resetForm = () => {
    setSymbol("");
    setName("");
    setAssetType("stock");
    setQuantity("");
    setAvgBuyPrice("");
    setNotes("");
    setError(null);
  };

  const handleQuickPick = (field: string, value: string) => {
    switch (field) {
      case "symbol": setSymbol(value); break;
      case "asset_type": setAssetType(value.toLowerCase()); break;
      case "notes": setNotes(value); break;
    }
    // Close all sheets
    setShowStockPick(false);
    setShowNotesPick(false);
  };

  const handleAddHolding = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          name: name || null,
          asset_type: assetType,
          quantity: Number(quantity),
          avg_buy_price: avgBuyPrice ? Number(avgBuyPrice) : null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add holding");
      }

      setIsModalOpen(false);
      fetchHoldings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add holding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (holdingId: string) => {
    try {
      const res = await fetch(`/api/holdings/${holdingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete holding");
      }

      fetchHoldings();
    } catch (err) {
      console.error("Delete holding error:", err);
    }
  };

  return (
    <DashboardShell
      title="Holdings"
      description="Manage your investment portfolio"
    >
      <HoldingsTable
        holdings={holdings}
        loading={loading}
        onAddHolding={handleAddHolding}
        onDelete={handleDelete}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Holding</DialogTitle>
            <DialogDescription>
              Enter the details of your investment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Symbol</label>
                    <Sheet open={showStockPick} onOpenChange={setShowStockPick}>
                      <SheetTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="md:hidden h-6 text-xs gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Quick Select
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh]">
                        <QuickPickPanel
                          title="Quick Trading Selection"
                          subtitle="Exchanges, investment types, and brokers"
                          items={[
                            ...tradingExchanges.map(ex => ({ value: ex, label: `📈 ${ex}`, category: 'Exchange' })),
                            ...investmentTypes.map(type => ({ value: type, label: `💼 ${type}`, category: 'Type' })),
                            ...popularBrokersIndia.map(broker => ({ value: broker, label: `🏦 ${broker}`, category: 'Broker' })),
                            ...holdingNotes.map(note => ({ value: note, label: `📝 ${note}`, category: 'Common Notes' }))
                          ]}
                          onSelect={(value) => {
                            const exchangeItem = tradingExchanges.find(ex => ex === value);
                            const typeItem = investmentTypes.find(type => type === value);
                            const brokerItem = popularBrokersIndia.find(broker => broker === value);
                            const noteItem = holdingNotes.find(note => note === value);
                            
                            if (exchangeItem) {
                              handleQuickPick("symbol", value);
                            } else if (typeItem) {
                              handleQuickPick("asset_type", value);
                            } else if (brokerItem) {
                              handleQuickPick("notes", `Broker: ${value}`);
                            } else if (noteItem) {
                              handleQuickPick("notes", value);
                            }
                          }}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>
                  <Input
                    placeholder="e.g., AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Name"
                  placeholder="e.g., Apple Inc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  hint="Optional"
                />
                <Select
                  label="Asset Type"
                  options={ASSET_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  placeholder="Select type"
                />
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <Input
                  label="Average Buy Price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={avgBuyPrice}
                  onChange={(e) => setAvgBuyPrice(e.target.value)}
                  hint="Optional"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                    <Sheet open={showNotesPick} onOpenChange={setShowNotesPick}>
                      <SheetTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="md:hidden h-6 text-xs gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Quick Select
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh]">
                        <QuickPickPanel
                          title="Select Note"
                          subtitle="Common holding notes"
                          items={holdingNotes.map(n => ({
                            value: n,
                            label: n,
                            category: "Common Notes"
                          }))}
                          onSelect={(value) => handleQuickPick("notes", value)}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>
                  <textarea
                    placeholder="Any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
              </div>

              <div className="hidden md:block">
                <QuickPickPanel
                  title="Quick Trading Selection"
                  subtitle="Exchanges, investment types, and brokers"
                  items={[
                    ...tradingExchanges.map(ex => ({ value: ex, label: `📈 ${ex}`, category: 'Exchange' })),
                    ...investmentTypes.map(type => ({ value: type, label: `💼 ${type}`, category: 'Type' })),
                    ...popularBrokersIndia.map(broker => ({ value: broker, label: `🏦 ${broker}`, category: 'Broker' })),
                    ...holdingNotes.map(note => ({ value: note, label: `📝 ${note}`, category: 'Common Notes' }))
                  ]}
                  onSelect={(value) => {
                    const exchangeItem = tradingExchanges.find(ex => ex === value);
                    const typeItem = investmentTypes.find(type => type === value);
                    const brokerItem = popularBrokersIndia.find(broker => broker === value);
                    const noteItem = holdingNotes.find(note => note === value);
                    
                    if (exchangeItem) {
                      handleQuickPick("symbol", value);
                    } else if (typeItem) {
                      handleQuickPick("asset_type", value);
                    } else if (brokerItem) {
                      handleQuickPick("notes", `Broker: ${value}`);
                    } else if (noteItem) {
                      handleQuickPick("notes", value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10">
                {submitting ? "Adding..." : "Add Holding"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
