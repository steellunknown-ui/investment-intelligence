"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import {
    Landmark,
    Plus,
    Filter,
    Search,
    Edit2,
    Trash2,
    Building2,
    CreditCard,
    Smartphone,
    User,
    CheckCircle,
    XCircle,
    Copy,
    Check,
    Sparkles
} from "lucide-react";
import type { BankAccount } from "@/lib/types";
import { formatUpdatedLabel, formatDateTime } from "@/src/lib/time";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { bankNames } from "@/src/lib/presets";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";

// Constants
const ACCOUNT_TYPES = [
    { value: "savings", label: "Savings Account" },
    { value: "current", label: "Current Account" },
    { value: "salary", label: "Salary Account" },
    { value: "nre", label: "NRE Account" },
    { value: "nro", label: "NRO Account" },
    { value: "fixed_deposit", label: "Fixed Deposit" },
    { value: "recurring_deposit", label: "Recurring Deposit" },
];

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "dormant", label: "Dormant" },
    { value: "closed", label: "Closed" },
];

export default function BankingPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // QuickPick State
    const [showBankPick, setShowBankPick] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        account_number: "",
        bank_name: "",
        branch_name: "",
        ifsc_code: "",
        account_type: "savings",
        account_holder_name: "",
        is_joint_account: false,
        joint_holder_name: "",
        current_balance: "",
        balance_as_of: new Date().toISOString().split("T")[0],
        account_nominee_name: "",
        account_nominee_relationship: "",
        status: "active",
        linked_mobile: "",
        net_banking_enabled: false,
        debit_card_number: "",
        notes: "",
    });

    const resetForm = () => {
        setFormData({
            account_number: "",
            bank_name: "",
            branch_name: "",
            ifsc_code: "",
            account_type: "savings",
            account_holder_name: "",
            is_joint_account: false,
            joint_holder_name: "",
            current_balance: "",
            balance_as_of: new Date().toISOString().split("T")[0],
            account_nominee_name: "",
            account_nominee_relationship: "",
            status: "active",
            linked_mobile: "",
            net_banking_enabled: false,
            debit_card_number: "",
            notes: "",
        });
        setEditingId(null);
    };

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/banking/accounts");
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleEdit = (account: BankAccount) => {
        setFormData({
            account_number: account.account_number,
            bank_name: account.bank_name,
            branch_name: account.branch_name || "",
            ifsc_code: account.ifsc_code,
            account_type: account.account_type,
            account_holder_name: account.account_holder_name,
            is_joint_account: account.is_joint_account,
            joint_holder_name: account.joint_holder_name || "",
            current_balance: String(account.current_balance),
            balance_as_of: account.balance_as_of || new Date().toISOString().split("T")[0],
            account_nominee_name: account.account_nominee_name || "",
            account_nominee_relationship: account.account_nominee_relationship || "",
            status: account.status,
            linked_mobile: account.linked_mobile || "",
            net_banking_enabled: account.net_banking_enabled,
            debit_card_number: account.debit_card_number || "",
            notes: account.notes || "",
        });
        setEditingId(account.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this account?")) return;

        try {
            const res = await fetch(`/api/banking/accounts/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setAccounts((prev) => prev.filter((a) => a.id !== id));
            } else {
                alert("Failed to delete account");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingId
                ? `/api/banking/accounts/${editingId}`
                : "/api/banking/accounts";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchAccounts();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save account");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch =
            acc.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.account_number.includes(searchQuery);
        const matchesFilter = filterStatus === "all" || acc.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const totalBalance = filteredAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);

    return (
        <DashboardShell
            title="Banking"
            description="Track your bank accounts, balances, and deposits"
        >
            <div className="space-y-6">
                {/* Actions & Filters */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex flex-1 w-full sm:w-auto gap-2">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search bank / account..."
                                    className="pl-9 bg-white dark:bg-slate-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0">
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filter</span>
                            </Button>
                        </div>
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="h-4 w-4" />
                            Add Account
                        </Button>
                    </div>

                    {/* Summary Card */}
                    {accounts.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                            <p className="text-emerald-100 text-sm font-medium mb-1">Total Balance Across Accounts</p>
                            <h2 className="text-3xl font-bold">{formatCurrency(totalBalance)}</h2>
                            <p className="text-emerald-100 text-xs mt-2 opacity-80">
                                {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} listed
                            </p>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={Landmark}
                            title={searchQuery ? "No matching accounts found" : "No bank accounts added"}
                            description={searchQuery ? "Try refining your search terms." : "Keep track of your savings, current accounts, and fixed deposits."}
                            action={searchQuery ? undefined : {
                                label: "Add Bank Account",
                                onClick: () => {
                                    resetForm();
                                    setIsModalOpen(true);
                                },
                            }}
                            withCard={true}
                        />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAccounts.map((account) => (
                            <Card key={account.id} className="relative hover:shadow-md transition-all sm:hover:-translate-y-1">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="icon-container bg-blue-50 dark:bg-blue-900/20">
                                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <Badge variant={account.status === 'active' ? 'success' : 'secondary'}>
                                            {account.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                            {account.bank_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                •••• {account.account_number.slice(-4)}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1 uppercase tracking-wide">
                                                {account.account_type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3 space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Balance</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(account.current_balance)}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400">IFSC</span>
                                            <div className="flex items-center gap-1 group/code cursor-pointer" onClick={() => handleCopy(account.ifsc_code, `ifsc-${account.id}`)}>
                                                <span className="font-medium">{account.ifsc_code}</span>
                                                {copiedId === `ifsc-${account.id}` ?
                                                    <Check className="h-3 w-3 text-emerald-500" /> :
                                                    <Copy className="h-3 w-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                                }
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400">Holder</span>
                                            <span className="font-medium truncate">{account.account_holder_name.split(' ')[0]}</span>
                                        </div>
                                    </div>

                                    {(account.net_banking_enabled || account.linked_mobile) && (
                                        <div className="flex gap-3 pt-1">
                                            {account.net_banking_enabled && (
                                                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                                                    <CheckCircle className="h-3 w-3" /> Net Banking
                                                </div>
                                            )}
                                            {account.linked_mobile && (
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Smartphone className="h-3 w-3" /> {account.linked_mobile.slice(-4)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-0 space-y-2">
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(account)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit2 className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(account.id)}
                                            className="h-8 w-8 p-0 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{formatUpdatedLabel(account.updated_at || account.created_at)}</span>
                                        <span>{formatDateTime(account.updated_at || account.created_at)}</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
                            <DialogDescription>
                                Enter your bank account details securely.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {/* Section: Basic Info */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <Building2 className="h-4 w-4" /> Account Details
                                        </h4>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank Name</label>
                                                <Sheet open={showBankPick} onOpenChange={setShowBankPick}>
                                                    <SheetTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="md:hidden h-6 text-xs gap-1"
                                                        >
                                                            <Sparkles className="h-3 w-3" />
                                                            Quick Select
                                                        </Button>
                                                    </SheetTrigger>
                                                    <SheetContent side="bottom" className="h-[80vh]">
                                                        <QuickPickPanel
                                                            title="Select Bank"
                                                            subtitle="Popular Indian banks"
                                                            items={bankNames.map((name) => ({ label: name, value: name }))}
                                                            onSelect={(value) => {
                                                                setFormData((p) => ({ ...p, bank_name: value }));
                                                                setShowBankPick(false);
                                                            }}
                                                        />
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                            <Input
                                                placeholder="e.g. HDFC Bank"
                                                value={formData.bank_name}
                                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <Input
                                            label="Account Number"
                                            value={formData.account_number}
                                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="IFSC Code"
                                            placeholder="e.g. HDFC0001234"
                                            value={formData.ifsc_code}
                                            onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                            required
                                        />
                                        <Input
                                            label="Branch Name"
                                            placeholder="e.g. Indiranagar"
                                            value={formData.branch_name}
                                            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                        />
                                        <Select
                                            label="Account Type"
                                            options={ACCOUNT_TYPES}
                                            value={formData.account_type}
                                            onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                                        />
                                        <Select
                                            label="Status"
                                            options={STATUS_OPTIONS}
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                    </div>

                                    {/* Section: Ownership */}
                                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <User className="h-4 w-4" /> Ownership
                                        </h4>
                                        <Input
                                            label="Primary Holder Name"
                                            value={formData.account_holder_name}
                                            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                                            required
                                        />
                                        <div className="flex items-center gap-2 h-10">
                                            <input
                                                type="checkbox"
                                                id="is_joint"
                                                checked={formData.is_joint_account}
                                                onChange={(e) => setFormData({ ...formData, is_joint_account: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <label htmlFor="is_joint" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Joint Account?
                                            </label>
                                        </div>
                                        {formData.is_joint_account && (
                                            <Input
                                                label="Joint Holder Name"
                                                value={formData.joint_holder_name}
                                                onChange={(e) => setFormData({ ...formData, joint_holder_name: e.target.value })}
                                                required
                                            />
                                        )}
                                        <Input
                                            label="Nominee Name"
                                            value={formData.account_nominee_name}
                                            onChange={(e) => setFormData({ ...formData, account_nominee_name: e.target.value })}
                                        />
                                    </div>

                                    {/* Section: Balance & Extras */}
                                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" /> Balance & Features
                                        </h4>
                                        <Input
                                            label="Current Balance"
                                            type="number"
                                            value={formData.current_balance}
                                            onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Balance As Of"
                                            type="date"
                                            value={formData.balance_as_of}
                                            onChange={(e) => setFormData({ ...formData, balance_as_of: e.target.value })}
                                        />
                                        <Input
                                            label="Linked Mobile"
                                            value={formData.linked_mobile}
                                            onChange={(e) => setFormData({ ...formData, linked_mobile: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2 h-10">
                                            <input
                                                type="checkbox"
                                                id="net_banking"
                                                checked={formData.net_banking_enabled}
                                                onChange={(e) => setFormData({ ...formData, net_banking_enabled: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <label htmlFor="net_banking" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Net Banking Enabled
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title="Select Bank"
                                        subtitle="Popular Indian banks"
                                        items={bankNames.map((name) => ({ label: name, value: name }))}
                                        onSelect={(value) => setFormData((p) => ({ ...p, bank_name: value }))}
                                    />
                                </div>
                            </div>

                            {/* Document Upload - only when editing */}
                            {editingId && (
                                <EntityDocumentUpload
                                    entityType="bank_account"
                                    entityId={editingId}
                                />
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting}>
                                    {submitting ? "Saving..." : editingId ? "Update Account" : "Save Account"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}
