"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart } from "lucide-react";

interface AssetAllocationCardProps {
  hasData?: boolean;
}

const allocationCategories = [
  { name: "Stocks", color: "bg-accent-500" },
  { name: "ETFs", color: "bg-accent-300" },
  { name: "Bonds", color: "bg-neutral-400" },
  { name: "Mutual Funds", color: "bg-neutral-300" },
  { name: "Other", color: "bg-neutral-200" },
];

export function AssetAllocationCard({
  hasData = false,
}: AssetAllocationCardProps) {
  if (!hasData) {
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

  return (
    <Card>
      <CardHeader
        title="Asset Allocation"
        description="Distribution across asset classes"
      />
      <CardContent>
        <div className="space-y-4">
          {allocationCategories.map((category) => (
            <div key={category.name} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${category.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    {category.name}
                  </span>
                  <span className="text-sm text-neutral-500">—%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full ${category.color}`}
                    style={{ width: "0%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
