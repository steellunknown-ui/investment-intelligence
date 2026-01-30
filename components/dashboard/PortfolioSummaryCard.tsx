"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PortfolioSummaryCardProps {
  hasData?: boolean;
  totalInvested?: number;
  totalValue?: number;
  totalPnL?: number;
}

// Format currency with ₹ symbol and commas
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PortfolioSummaryCard({
  hasData = false,
  totalInvested = 0,
  totalValue = 0,
  totalPnL = 0,
}: PortfolioSummaryCardProps) {
  const router = useRouter();

  if (!hasData) {
    return (
      <Card>
        <CardHeader
          title="Portfolio Summary"
          description="Your total portfolio value and performance"
        />
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No portfolio data"
            description="Add your first holding to see your portfolio summary."
            action={{
              label: "Add Holdings",
              onClick: () => router.push("/holdings"),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;

  return (
    <Card>
      <CardHeader
        title="Portfolio Summary"
        description="Your total portfolio value and performance"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/holdings")}
          >
            View All
          </Button>
        }
      />
      <CardContent>
        <div className="space-y-6">
          {/* Total Value */}
          <div>
            <p className="text-sm text-neutral-500">Total Value</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-neutral-900">
                {formatCurrency(totalValue)}
              </span>
              {totalPnL !== 0 && (
                <span
                  className={`flex items-center text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {pnlPercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Total Invested</p>
              <div className="mt-1">
                <span className="text-lg font-medium text-neutral-900">
                  {formatCurrency(totalInvested)}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Total P&L</p>
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={`text-lg font-medium ${isPositive ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(totalPnL)}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Live pricing coming soon
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
