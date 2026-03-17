"use client";

import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { formatUpdatedAt } from "@/lib/dateUtils";
import type { Holding } from "@/lib/types";

interface HoldingsTableProps {
  holdings: Holding[];
  loading?: boolean;
  onAddHolding?: () => void;
  onDelete?: (id: string) => void;
}

const assetTypeLabels: Record<Holding["asset_type"], string> = {
  stock: "Stock",
  etf: "ETF",
  mutual_fund: "Mutual Fund",
  bond: "Bond",
  crypto: "Crypto",
  other: "Other",
};

export function HoldingsTable({
  holdings,
  loading = false,
  onAddHolding,
  onDelete,
}: HoldingsTableProps) {
  const columns = [
    {
      key: "asset",
      header: "Asset",
      render: (holding: Holding) => (
        <div>
          <p className="font-medium text-neutral-900">{holding.symbol}</p>
          <p className="text-xs text-neutral-500">
            {holding.name || assetTypeLabels[holding.asset_type]}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (holding: Holding) => (
        <Badge variant="default">
          {assetTypeLabels[holding.asset_type]}
        </Badge>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      className: "text-right",
      render: (holding: Holding) => (
        <span className="font-mono">{holding.quantity.toLocaleString()}</span>
      ),
    },
    {
      key: "avgPrice",
      header: "Avg. Price",
      className: "text-right",
      render: (holding: Holding) => (
        <span className="font-mono">
          {holding.avg_buy_price !== null
            ? `$${holding.avg_buy_price.toLocaleString()}`
            : "—"}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Last Updated",
      render: (holding: Holding) => (
        <span className="text-xs text-muted-foreground">
          {formatUpdatedAt(holding.updated_at || holding.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (holding: Holding) => (
        <button
          onClick={() => onDelete?.(holding.id)}
          className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
          title="Delete holding"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            Your Holdings
          </h3>
          <p className="text-sm text-neutral-500">
            {holdings.length} {holdings.length === 1 ? "asset" : "assets"} in
            your portfolio
          </p>
        </div>
        <Button onClick={onAddHolding} size="sm" className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10">
          <Plus className="h-4 w-4" />
          Add Holding
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={holdings}
        keyExtractor={(h) => h.id}
        loading={loading}
        emptyState={
          <div className="py-12">
            <EmptyState
              icon={Briefcase}
              title="No holdings yet"
              description="Start building your portfolio by adding your first investment holding."
              action={{
                label: "Add Your First Holding",
                onClick: onAddHolding || (() => { }),
              }}
            />
          </div>
        }
      />
    </div>
  );
}
