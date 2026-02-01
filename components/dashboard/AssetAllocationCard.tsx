"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart, TrendingUp } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { NetWorthSummary } from "@/lib/types";

interface AssetAllocationCardProps {
  hasData?: boolean;
  netWorth?: NetWorthSummary | null;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-emerald-600 font-medium">
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function AssetAllocationCard({
  hasData = false,
  netWorth
}: AssetAllocationCardProps) {
  if (!hasData || !netWorth) {
    return (
      <Card>
        <CardHeader
          title="Asset Allocation"
          description="Distribution across asset classes"
        />
        <CardContent>
          <EmptyState
            icon={PieChart}
            title="No allocation data"
            description="Add holdings to see how your investments are distributed across different asset classes."
          />
        </CardContent>
      </Card>
    );
  }

  // Transform net worth data for Radar Chart
  // We normalize to give a balanced visual shape, but tooltip shows real values
  const data = [
    { subject: 'Cash', value: netWorth.bankBalanceTotal || 0, fullMark: 100 },
    { subject: 'Assets', value: netWorth.assetsTotalValue || 0, fullMark: 100 },
    { subject: 'Belongings', value: netWorth.belongingsTotalValue || 0, fullMark: 100 },
    { subject: 'Receivables', value: netWorth.receivablesOutstandingTotal || 0, fullMark: 100 },
    { subject: 'Liabilities', value: netWorth.liabilitiesOutstandingTotal || 0, fullMark: 100 },
  ];

  // Logic to prevent flat chart if all are zero (though hasData check usually handles this)
  const maxValue = Math.max(...data.map(d => d.value));

  // If we have just one dominant category, the radar looks like a line. 
  // Radar charts work best when there's some distribution.

  return (
    <Card>
      <CardHeader
        title="Asset Breakdown"
        description="Visualizing your financial distribution"
        action={
          <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Analysis
          </div>
        }
      />
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, maxValue * 1.1]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Value"
                dataKey="value"
                stroke="#059669" // emerald-600
                strokeWidth={2}
                fill="#10b981" // emerald-500
                fillOpacity={0.4}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
