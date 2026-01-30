"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Shield, Info } from "lucide-react";

interface RiskOverviewCardProps {
  hasData?: boolean;
}

const riskFactors = [
  { name: "Diversification", status: "pending" },
  { name: "Sector Concentration", status: "pending" },
  { name: "Volatility Exposure", status: "pending" },
  { name: "Liquidity Risk", status: "pending" },
];

export function RiskOverviewCard({ hasData = false }: RiskOverviewCardProps) {
  if (!hasData) {
    return (
      <Card>
        <CardHeader
          title="Risk Overview"
          description="Portfolio risk assessment"
        />
        <CardContent>
          <EmptyState
            icon={Shield}
            title="No risk data"
            description="Risk analysis will be available once you add holdings to your portfolio."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Risk Overview"
        description="Portfolio risk assessment"
      />
      <CardContent>
        {/* Overall Risk Score */}
        <div className="mb-6 rounded-lg bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Overall Risk Score</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900">—</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
              <Info className="h-6 w-6 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-3">
          {riskFactors.map((factor) => (
            <div
              key={factor.name}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-neutral-700">{factor.name}</span>
              <span className="text-sm text-neutral-400">Pending</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
