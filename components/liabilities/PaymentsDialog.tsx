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
import { Trash2, Plus, Calendar, AlertCircle } from "lucide-react";
import type { Liability, LiabilityPayment } from "@/lib/types";

interface PaymentsDialogProps {
    liability: Liability | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const PAYMENT_MODES = [
    { value: "auto_debit", label: "Auto Debit" },
    { value: "online", label: "Online Transfer" },
    { value: "upi", label: "UPI" },
    { value: "cheque", label: "Cheque" },
    { value: "cash", label: "Cash" },
];

export function PaymentsDialog({ liability, open, onOpenChange, onUpdate }: PaymentsDialogProps) {
    const [payments, setPayments] = useState<LiabilityPayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split("T")[0],
        amount: "",
        outstanding_after_payment: "",
        payment_mode: "auto_debit",
        reference_number: "",
        notes: ""
    });

    const resetForm = useCallback(() => {
        setFormData({
            payment_date: new Date().toISOString().split("T")[0],
            amount: liability?.emi_amount ? String(liability.emi_amount) : "",
            outstanding_after_payment: "", // User should ideally input this to confirm balance
            payment_mode: "auto_debit",
            reference_number: "",
            notes: ""
        });
    }, [liability]);

    useEffect(() => {
        if (open && liability) {
            fetchPayments();
            resetForm();
        }
    }, [open, liability, resetForm]);

    const fetchPayments = async () => {
        if (!liability) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/liabilities/${liability.id}/payments`);
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
        if (!liability) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/liabilities/${liability.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchPayments();
                onUpdate(); // Updates parent list for outstanding amount change
                resetForm();
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
            const res = await fetch(`/api/liabilities/${liability?.id}/payments/${paymentId}`, {
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
            render: (payment: LiabilityPayment) => new Date(payment.payment_date).toLocaleDateString()
        },
        {
            key: "amount",
            header: "Amount",
            render: (payment: LiabilityPayment) => <span className="font-medium text-primary">{formatCurrency(payment.amount)}</span>
        },
        {
            key: "outstanding",
            header: "Balance After",
            render: (payment: LiabilityPayment) => payment.outstanding_after_payment ?
                <span className="text-slate-500">{formatCurrency(payment.outstanding_after_payment)}</span> : '-'
        },
        {
            key: "actions",
            header: "",
            className: "text-right w-10",
            render: (payment: LiabilityPayment) => (
                <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        }
    ];

    if (!liability) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Loan Payments</DialogTitle>
                    <DialogDescription>
                        {liability.loan_name || liability.loan_type} ({liability.taken_from})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {/* Add Payment Form */}
                    <div className="bg-background/50 p-4 rounded-xl border border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Record New Payment
                        </h4>
                        <form onSubmit={handleAddPayment} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            <Input
                                label="Date"
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900"
                            />
                            <Input
                                label="Amount Paid"
                                type="number"
                                placeholder={liability.emi_amount ? String(liability.emi_amount) : "0.00"}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900"
                            />
                            <Input
                                label="Balance After (Optional)"
                                type="number"
                                placeholder="Auto-updates loan"
                                value={formData.outstanding_after_payment}
                                onChange={(e) => setFormData({ ...formData, outstanding_after_payment: e.target.value })}
                                className="bg-white dark:bg-slate-900"
                            />
                            <Select
                                label="Mode"
                                options={PAYMENT_MODES}
                                value={formData.payment_mode}
                                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                            />
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                {submitting ? "Saving..." : "Record"}
                            </Button>
                        </form>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                <AlertCircle className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Repaid (Recorded)</p>
                                <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Current Outstanding</p>
                            <p className="text-lg font-bold text-foreground">
                                {formatCurrency(liability.outstanding_amount)}
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
