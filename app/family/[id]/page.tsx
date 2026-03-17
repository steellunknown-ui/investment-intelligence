"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Landmark, Building2, Shield, CreditCard, Activity, TrendingDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import FamilyMemberSummaryDashboard from "@/components/family/FamilyMemberSummaryDashboard";

export default function FamilyMemberDashboard() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.id as string;

    return (
        <DashboardShell
            title="Family Member Portfolio"
            description="Read-only view of aggregated financial data"
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/family')}
                        className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Family Hub
                    </Button>

                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 flex items-center bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Eye className="h-3 w-3" /> Read-Only Mode
                    </Badge>
                </div>

                <FamilyMemberSummaryDashboard memberUserId={memberId} />

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mt-8 dark:bg-amber-900/20 dark:border-amber-800/50">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-400">
                        <p className="font-semibold mb-1">Privacy & Security Notice</p>
                        <p>
                            You have been granted read-only access to this family member's portfolio.
                            You can view high-level summaries and aggregated totals, but you cannot edit, add, or delete any records.
                            Detailed inner-workings of individual entries are restricted to the account owner.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
