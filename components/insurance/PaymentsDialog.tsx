"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Trash2, Plus, Calendar, AlertCircle, CreditCard, Loader2 } from "lucide-react";
import type { InsurancePolicy, InsurancePayment } from "@/lib/types";
import { toast } from "sonner";

interface PaymentsDialogProps {
    policy: InsurancePolicy | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const PAYMENT_MODES = [
    { value: "online", label: "Online" },
    { value: "auto_debit", label: "Auto Debit" },
    { value: "cheque", label: "Cheque" },
    { value: "cash", label: "Cash" },
];

export function PaymentsDialog({ policy, open, onOpenChange, onUpdate }: PaymentsDialogProps) {
    const [payments, setPayments] = useState<InsurancePayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split("T")[0],
        amount: "",
        payment_mode: "online",
        reference_number: "",
        notes: ""
    });

    const resetForm = useCallback(() => {
        setFormData({
            payment_date: new Date().toISOString().split("T")[0],
            amount: policy ? String(policy.premium_amount) : "",
            payment_mode: "online",
            reference_number: "",
            notes: ""
        });
    }, [policy]);

    useEffect(() => {
        if (open && policy) {
            fetchPayments();
            resetForm();
        }
    }, [open, policy, resetForm]);

    const fetchPayments = async () => {
        if (!policy) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/insurance/policies/${policy.id}/payments`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            }
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!policy) return;

        // Simulate payment gateway delay if mode is online/auto_debit
        if (["online", "auto_debit"].includes(formData.payment_mode)) {
            setIsProcessingPayment(true);
            toast.loading("Initiating secure payment gateway...", { id: "payment-toast" });

            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.loading("Processing payment securely...", { id: "payment-toast" });

            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Payment successful! Generating receipt...", { id: "payment-toast" });

            setIsProcessingPayment(false);
        }

        setSubmitting(true);

        try {
            const res = await fetch(`/api/insurance/policies/${policy.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchPayments(); // Refresh list
                onUpdate(); // Trigger parent refresh (for next due date)
                resetForm(); // Clear form
            } else {
                const error = await res.json();
                alert(error.error || "Failed to add payment");
            }
        } catch (error) {
            console.error("Add payment error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm("Are you sure you want to delete this payment record?")) return;

        try {
            const res = await fetch(`/api/insurance/payments/${paymentId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setPayments(prev => prev.filter(p => p.id !== paymentId));
            } else {
                alert("Failed to delete payment");
            }
        } catch (error) {
            console.error("Delete payment error:", error);
        }
    };

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const columns = [
        {
            key: "payment_date",
            header: "Date",
            render: (payment: InsurancePayment) => new Date(payment.payment_date).toLocaleDateString()
        },
        {
            key: "amount",
            header: "Amount",
            render: (payment: InsurancePayment) => <span className="font-medium">{formatCurrency(payment.amount)}</span>
        },
        {
            key: "payment_mode",
            header: "Mode",
            render: (payment: InsurancePayment) => <span className="capitalize">{payment.payment_mode?.replace('_', ' ') || '-'}</span>
        },
        {
            key: "actions",
            header: "",
            className: "text-right w-10",
            render: (payment: InsurancePayment) => (
                <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        }
    ];

    if (!policy) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Premium Payments</DialogTitle>
                    <DialogDescription>
                        Manage payments for {policy.policy_name || policy.policy_number} ({policy.provider_name})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {/* Add Payment Form */}
                    <div className="bg-background/50 p-4 rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" /> Pay Premium
                            </h4>
                            <span className="text-xs bg-emerald-100 text-primary px-2 py-0.5 rounded-full dark:bg-emerald-900/50 dark:text-accent">
                                Simulated Gateway
                            </span>
                        </div>
                        <form onSubmit={handleAddPayment} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                            <Input
                                label="Date"
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900"
                            />
                            <Input
                                label="Amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900"
                            />
                            <Select
                                label="Mode"
                                options={PAYMENT_MODES}
                                value={formData.payment_mode}
                                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                            />
                            <Button
                                type="submit"
                                disabled={submitting || isProcessingPayment}
                                className="bg-primary hover:bg-primary/90 text-white w-full transition-all"
                            >
                                {isProcessingPayment ? (
                                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
                                ) : submitting ? "Saving..." : "Pay Now"}
                            </Button>
                        </form>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-between items-center bg-primary/10 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                                <AlertCircle className="h-5 w-5 text-primary dark:text-accent" />
                            </div>
                            <div>
                                <p className="text-xs text-primary dark:text-accent font-medium">Total Paid</p>
                                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Next Due Date</p>
                            <p className="text-sm font-medium text-foreground">
                                {policy.next_premium_due ? new Date(policy.next_premium_due).toLocaleDateString() : 'Not set'}
                            </p>
                        </div>
                    </div>

                    {/* History Table */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Payment History
                        </h4>

                        <div className="border border-border rounded-lg overflow-hidden">
                            <Table
                                columns={columns}
                                data={payments}
                                keyExtractor={(p) => p.id}
                                loading={loading}
                                emptyState={
                                    <div className="text-center py-8 text-slate-500 text-sm bg-slate-50">
                                        No payments recorded yet.
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
