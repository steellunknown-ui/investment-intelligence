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
import { Trash2, Plus, Calendar, AlertCircle, TrendingDown, TrendingUp, Landmark } from "lucide-react";
import type { BankAccount } from "@/lib/types";
import { toast } from "sonner";

interface BankTransaction {
    id: string;
    account_id: string;
    transaction_date: string;
    amount: number;
    type: "credit" | "debit";
    description?: string;
    reference_number?: string;
    balance_after?: number;
}

interface TransactionsDialogProps {
    account: BankAccount | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const TRANSACTION_TYPES = [
    { value: "credit", label: "Credit (+)" },
    { value: "debit", label: "Debit (-)" },
];

export function TransactionsDialog({ account, open, onOpenChange, onUpdate }: TransactionsDialogProps) {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().split("T")[0],
        amount: "",
        type: "debit",
        description: "",
        reference_number: "",
    });

    const resetForm = useCallback(() => {
        setFormData({
            transaction_date: new Date().toISOString().split("T")[0],
            amount: "",
            type: "debit",
            description: "",
            reference_number: "",
        });
    }, []);

    useEffect(() => {
        if (open && account) {
            fetchTransactions();
            resetForm();
        }
    }, [open, account, resetForm]);

    const fetchTransactions = async () => {
        if (!account) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/banking/${account.id}/transactions`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/banking/${account.id}/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Transaction recorded securely");
                await fetchTransactions(); // Refresh list
                onUpdate(); // Trigger parent refresh to update the global balance
                resetForm(); // Clear form
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to add transaction");
            }
        } catch (error) {
            console.error("Add transaction error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!confirm("Are you sure you want to delete this transaction record? The balance will NOT auto-revert dynamically in this version.")) return;

        // In a real app we'd have a DEL route. For now, simulate UI deletion.
        toast.error("Deletion not supported in this mock phase to prevent balance mismatch.");
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const columns = [
        {
            key: "transaction_date",
            header: "Date",
            render: (tx: BankTransaction) => new Date(tx.transaction_date).toLocaleDateString()
        },
        {
            key: "description",
            header: "Description",
            render: (tx: BankTransaction) => (
                <div>
                    <span className="block font-medium dark:text-gray-200">{tx.description || '-'}</span>
                    {tx.reference_number && <span className="block text-xs text-slate-500">Ref: {tx.reference_number}</span>}
                </div>
            )
        },
        {
            key: "amount",
            header: "Amount",
            className: "text-right",
            render: (tx: BankTransaction) => (
                <div className={`font-medium flex items-center justify-end gap-1 ${tx.type === 'credit' ? 'text-primary dark:text-accent' : 'text-foreground'}`}>
                    {tx.type === 'credit' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                    {formatCurrency(tx.amount)}
                </div>
            )
        },
        {
            key: "balance_after",
            header: "Balance",
            className: "text-right",
            render: (tx: BankTransaction) => (tx.balance_after !== undefined && tx.balance_after !== null) ? <span className="text-slate-500 text-sm">{formatCurrency(tx.balance_after)}</span> : <span className="text-slate-400">-</span>
        }
    ];

    if (!account) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-indigo-600" /> Account Ledger
                    </DialogTitle>
                    <DialogDescription>
                        Passbook history for {account.bank_name} ({account.account_number})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {/* Add Transaction Form */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border/50">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Record New Entry
                        </h4>
                        <form onSubmit={handleAddTransaction} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            <Input
                                label="Date"
                                type="date"
                                value={formData.transaction_date}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900 focus:border-indigo-500"
                            />
                            <Select
                                label="Type"
                                options={TRANSACTION_TYPES}
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as "credit" | "debit" })}
                            />
                            <Input
                                label="Amount (₹)"
                                type="number"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900 focus:border-indigo-500"
                            />
                            <Input
                                label="Description"
                                type="text"
                                placeholder="Salary, Rent, etc."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                className="bg-white dark:bg-slate-900 focus:border-indigo-500"
                            />
                            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                                {submitting ? "Saving..." : "Add Entry"}
                            </Button>
                        </form>
                    </div>

                    {/* Transaction History Table */}
                    <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Passbook Entries
                        </h4>

                        <div className="border border-border rounded-lg overflow-hidden">
                            <Table
                                columns={columns}
                                data={transactions}
                                keyExtractor={(p) => p.id}
                                loading={loading}
                                emptyState={
                                    <div className="text-center py-10 text-slate-500 text-sm bg-background/20">
                                        No transactions recorded yet in this passbook.
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
