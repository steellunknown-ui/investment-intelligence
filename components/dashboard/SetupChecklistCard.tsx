"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    CheckCircle2,
    Circle,
    Wallet,
    Landmark,
    Briefcase,
    Shield,
    Users,
    Clock
} from "lucide-react";

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    action: () => void;
    actionLabel: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SetupChecklistCardProps {
    checklist: {
        hasBankAccount: boolean;
        hasAsset: boolean;
        hasLiability: boolean;
        hasInsurancePolicy: boolean;
        hasNominee: boolean;
        hasInactivityEnabled: boolean;
    };
    progress: {
        done: number;
        total: number;
    };
}

export function SetupChecklistCard({ checklist, progress }: SetupChecklistCardProps) {
    const router = useRouter();

    const items: ChecklistItem[] = [
        {
            id: 'bank',
            label: 'Add Bank Account',
            description: 'Link your primary bank account',
            completed: checklist.hasBankAccount,
            action: () => router.push('/banking'),
            actionLabel: 'Add Account',
            icon: Wallet
        },
        {
            id: 'asset',
            label: 'Add an Asset',
            description: 'Property, vehicle, or investment',
            completed: checklist.hasAsset,
            action: () => router.push('/assets'),
            actionLabel: 'Add Asset',
            icon: Landmark
        },
        {
            id: 'liability',
            label: 'Track Liabilities',
            description: 'Record loans and debts (optional)',
            completed: checklist.hasLiability,
            action: () => router.push('/liabilities'),
            actionLabel: 'Add Liability',
            icon: Briefcase
        },
        {
            id: 'insurance',
            label: 'Add Insurance Policy',
            description: 'Secure your family\'s future',
            completed: checklist.hasInsurancePolicy,
            action: () => router.push('/insurance'),
            actionLabel: 'Add Policy',
            icon: Shield
        },
        {
            id: 'nominee',
            label: 'Setup Nominees',
            description: 'Designate beneficiaries',
            completed: checklist.hasNominee,
            action: () => router.push('/nominee'),
            actionLabel: 'Add Nominee',
            icon: Users
        },
        {
            id: 'inactivity',
            label: 'Enable Inactivity Alert',
            description: 'Automated account monitoring',
            completed: checklist.hasInactivityEnabled,
            action: () => router.push('/settings'),
            actionLabel: 'Enable',
            icon: Clock
        }
    ];

    const progressPercent = Math.round((progress.done / progress.total) * 100);

    return (
        <Card className="relative overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Setup Checklist</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Complete these steps to fully secure your financial records
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{progress.done}/{progress.total}</p>
                        <p className="text-xs text-muted-foreground">completed</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-3">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${item.completed
                                        ? 'bg-primary/10 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-card border-border'
                                    }`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`p-2 rounded-lg ${item.completed
                                            ? 'bg-emerald-100 dark:bg-primary/20'
                                            : 'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                        <Icon className={`h-4 w-4 ${item.completed
                                                ? 'text-primary dark:text-accent'
                                                : 'text-slate-500'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${item.completed
                                                ? 'text-emerald-900 dark:text-emerald-100'
                                                : 'text-foreground'
                                            }`}>
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-primary dark:text-accent" />
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={item.action}
                                            className="text-xs"
                                        >
                                            {item.actionLabel}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
