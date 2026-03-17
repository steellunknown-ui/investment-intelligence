"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
    Sparkles,
    Wallet,
    Shield,
    ArrowRight,
    CheckCircle2
} from "lucide-react";

interface OnboardingModalProps {
    open: boolean;
    onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-2xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-emerald-100 dark:bg-primary/20 rounded-xl">
                                        <Sparkles className="h-6 w-6 text-primary dark:text-accent" />
                                    </div>
                                    <DialogTitle className="text-2xl">Welcome to Investment Intelligence!</DialogTitle>
                                </div>
                                <DialogDescription className="text-base leading-relaxed pt-2">
                                    Your complete financial command center. Track investments, manage insurance,
                                    secure assets, and protect your family's future—all in one place.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-sm mb-1">Complete Financial Visibility</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Track bank accounts, assets, liabilities, insurance, and documents in real-time
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-sm mb-1">Family Protection</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Designate nominees and enable automated inactivity monitoring
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-sm mb-1">Secure & Private</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Bank-grade encryption with Supabase. Your data stays yours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-emerald-100 dark:bg-primary/20 rounded-xl">
                                        <Wallet className="h-6 w-6 text-primary dark:text-accent" />
                                    </div>
                                    <DialogTitle className="text-2xl">Setup Your Financial Foundation</DialogTitle>
                                </div>
                                <DialogDescription className="text-base leading-relaxed pt-2">
                                    Start by adding your core financial accounts and assets to get an accurate picture of your net worth.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 space-y-3">
                                <div className="p-4 border border-border rounded-lg">
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
                                        Bank Accounts
                                    </h4>
                                    <p className="text-xs text-muted-foreground ml-8">
                                        Link your savings, checking, and credit card accounts
                                    </p>
                                </div>
                                <div className="p-4 border border-border rounded-lg">
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
                                        Assets & Property
                                    </h4>
                                    <p className="text-xs text-muted-foreground ml-8">
                                        Add real estate, vehicles, and investments
                                    </p>
                                </div>
                                <div className="p-4 border border-border rounded-lg">
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
                                        Liabilities (Optional)
                                    </h4>
                                    <p className="text-xs text-muted-foreground ml-8">
                                        Track loans, mortgages, and outstanding debts
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-emerald-100 dark:bg-primary/20 rounded-xl">
                                        <Shield className="h-6 w-6 text-primary dark:text-accent" />
                                    </div>
                                    <DialogTitle className="text-2xl">Protect Your Legacy</DialogTitle>
                                </div>
                                <DialogDescription className="text-base leading-relaxed pt-2">
                                    Ensure your family can access critical information when it matters most.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 space-y-4">
                                <div className="p-5 bg-primary/10 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <h4 className="font-semibold text-sm mb-2">Setup Nominees</h4>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Designate trusted individuals who can access your financial records in case of emergency or inactivity.
                                    </p>
                                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                                        <li className="flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-primary" />
                                            Add up to 3 nominees
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-primary" />
                                            Control access levels (View Only or Limited)
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-border">
                                    <h4 className="font-semibold text-sm mb-2">Enable Inactivity Monitoring</h4>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Automated system to alert nominees if you haven't logged in for a specified period.
                                    </p>
                                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                                        <li className="flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-slate-600" />
                                            Set custom inactivity threshold (e.g., 90 days)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-slate-600" />
                                            Automated email alerts to nominees
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-center pt-6 mt-6 border-t border-border">
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-8 rounded-full transition-colors ${i === step
                                    ? 'bg-primary'
                                    : i < step
                                        ? 'bg-emerald-300'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                            Skip for now
                        </Button>
                        <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white gap-2">
                            {step === 3 ? 'Get Started' : 'Continue'}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
