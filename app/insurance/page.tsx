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
    Shield,
    Plus,
    Filter,
    Search,
    Edit2,
    Trash2,
    Calendar,
    User,
    History,
    AlertCircle,
    Sparkles
} from "lucide-react";
import type { InsurancePolicy } from "@/lib/types";
import { formatUpdatedLabel, formatDateTime } from "@/src/lib/time";
import { PaymentsDialog } from "@/components/insurance/PaymentsDialog";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { insuranceProviders } from "@/src/lib/presets";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";

// Constants
const POLICY_TYPES = [
    { value: "life", label: "Life Insurance" },
    { value: "health", label: "Health Insurance" },
    { value: "vehicle", label: "Vehicle Insurance" },
    { value: "property", label: "Property Insurance" },
    { value: "travel", label: "Travel Insurance" },
    { value: "other", label: "Other" },
];

const PREMIUM_FREQUENCIES = [
    { value: "yearly", label: "Yearly" },
    { value: "half_yearly", label: "Half Yearly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "monthly", label: "Monthly" },
];

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "lapsed", label: "Lapsed" },
    { value: "matured", label: "Matured" },
    { value: "surrendered", label: "Surrendered" },
];

export default function InsurancePage() {
    const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Payment Dialog State
    const [paymentPolicy, setPaymentPolicy] = useState<InsurancePolicy | null>(null);
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);

    // QuickPick State
    const [showProviderPick, setShowProviderPick] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        policy_number: "",
        policy_type: "life",
        provider_name: "",
        policy_name: "",
        sum_insured: "",
        premium_amount: "",
        premium_frequency: "yearly",
        start_date: "",
        end_date: "",
        maturity_date: "",
        insured_name: "",
        insured_relationship: "self",
        status: "active",
        notes: "",
    });

    const resetForm = () => {
        setFormData({
            policy_number: "",
            policy_type: "life",
            provider_name: "",
            policy_name: "",
            sum_insured: "",
            premium_amount: "",
            premium_frequency: "yearly",
            start_date: "",
            end_date: "",
            maturity_date: "",
            insured_name: "",
            insured_relationship: "self",
            status: "active",
            notes: "",
        });
        setEditingId(null);
    };

    const fetchPolicies = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/insurance/policies");
            if (res.ok) {
                const data = await res.json();
                setPolicies(data.policies || []);
            }
        } catch (error) {
            console.error("Failed to fetch policies:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const handleEdit = (policy: InsurancePolicy) => {
        setFormData({
            policy_number: policy.policy_number,
            policy_type: policy.policy_type,
            provider_name: policy.provider_name,
            policy_name: policy.policy_name || "",
            sum_insured: String(policy.sum_insured),
            premium_amount: String(policy.premium_amount),
            premium_frequency: policy.premium_frequency || "yearly",
            start_date: policy.start_date.split("T")[0],
            end_date: policy.end_date?.split("T")[0] || "",
            maturity_date: policy.maturity_date?.split("T")[0] || "",
            insured_name: policy.insured_name || "",
            insured_relationship: policy.insured_relationship || "self",
            status: policy.status,
            notes: policy.notes || "",
        });
        setEditingId(policy.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this policy?")) return;

        try {
            const res = await fetch(`/api/insurance/policies/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setPolicies((prev) => prev.filter((p) => p.id !== id));
            } else {
                alert("Failed to delete policy");
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
                ? `/api/insurance/policies/${editingId}`
                : "/api/insurance/policies";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchPolicies();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save policy");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenPayments = (policy: InsurancePolicy) => {
        setPaymentPolicy(policy);
        setIsPaymentsOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const isOverdue = (dateStr?: string | null) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
    };

    return (
        <DashboardShell
            title="Insurance"
            description="Manage your life, health, and vehicle insurance policies"
        >
            <div className="space-y-6">
                {/* Actions & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-1 w-full sm:w-auto gap-2">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search policies..."
                                className="pl-9 bg-white dark:bg-slate-800"
                            />
                        </div>
                        <Button variant="outline" className="gap-2 shrink-0">
                            <Filter className="h-4 w-4" />
                            Filter
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
                        Add Policy
                    </Button>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : policies.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={Shield}
                            title="No insurance policies added"
                            description="Track your insurance coverage, premiums, and renewal dates in one place."
                            action={{
                                label: "Add Your First Policy",
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
                        {policies.map((policy) => {
                            const overdue = isOverdue(policy.next_premium_due);
                            return (
                                <Card key={policy.id} className="relative hover:shadow-md transition-shadow group">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="icon-container bg-emerald-50 dark:bg-emerald-900/20">
                                                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex gap-2">
                                                {overdue && policy.status === 'active' && (
                                                    <Badge variant="destructive" className="flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" /> Overdue
                                                    </Badge>
                                                )}
                                                <Badge variant={policy.status === 'active' ? 'success' : 'secondary'}>
                                                    {policy.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                {policy.provider_name}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {policy.policy_type} • {policy.policy_number}
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Sum Insured</span>
                                            <span className="font-medium">{formatCurrency(policy.sum_insured)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Premium</span>
                                            <span className="font-medium">
                                                {formatCurrency(policy.premium_amount)}
                                                <span className="text-xs text-slate-400 font-normal">
                                                    /{policy.premium_frequency === 'yearly' ? 'yr' : 'mo'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {policy.insured_name || 'Self'}
                                            </span>
                                            {policy.next_premium_due ? (
                                                <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    Due: {new Date(policy.next_premium_due).toLocaleDateString()}
                                                </span>
                                            ) : policy.end_date ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    End: {new Date(policy.end_date).toLocaleDateString()}
                                                </span>
                                            ) : null}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 space-y-2">
                                        <div className="flex gap-2 justify-between">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleOpenPayments(policy)}
                                                className="h-8 gap-2 text-xs flex-1"
                                            >
                                                <History className="h-3 w-3" /> Payments
                                            </Button>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(policy)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(policy.id)}
                                                    className="h-8 w-8 p-0 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{formatUpdatedLabel(policy.updated_at || policy.created_at)}</span>
                                            <span>{formatDateTime(policy.updated_at || policy.created_at)}</span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Policy" : "Add New Policy"}</DialogTitle>
                            <DialogDescription>
                                Enter the details of your insurance policy.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Input
                                        label="Policy Number"
                                        value={formData.policy_number}
                                        onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                                        required
                                    />

                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Provider Name</label>
                                            <Sheet open={showProviderPick} onOpenChange={setShowProviderPick}>
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
                                                        title="Select Insurance Provider"
                                                        subtitle="Popular Indian insurers"
                                                        items={insuranceProviders.map((name) => ({ label: name, value: name }))}
                                                        onSelect={(value) => {
                                                            setFormData((p) => ({ ...p, provider_name: value }));
                                                            setShowProviderPick(false);
                                                        }}
                                                    />
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                        <Input
                                            placeholder="e.g. LIC, HDFC Ergo"
                                            value={formData.provider_name}
                                            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Select
                                        label="Policy Type"
                                        options={POLICY_TYPES}
                                        value={formData.policy_type}
                                        onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                                    />
                                    <Input
                                        label="Policy Name (Optional)"
                                        placeholder="e.g. Jeevan Anand"
                                        value={formData.policy_name}
                                        onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                                    />
                                    <Input
                                        label="Sum Insured"
                                        type="number"
                                        value={formData.sum_insured}
                                        onChange={(e) => setFormData({ ...formData, sum_insured: e.target.value })}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            label="Premium Amount"
                                            type="number"
                                            value={formData.premium_amount}
                                            onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                                            required
                                        />
                                        <Select
                                            label="Frequency"
                                            options={PREMIUM_FREQUENCIES}
                                            value={formData.premium_frequency}
                                            onChange={(e) => setFormData({ ...formData, premium_frequency: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        label="Start Date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Renewal/End Date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                    <Input
                                        label="Maturity Date"
                                        type="date"
                                        value={formData.maturity_date}
                                        onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                                    />
                                    <Select
                                        label="Status"
                                        options={STATUS_OPTIONS}
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    />
                                    <Input
                                        label="Insured Name"
                                        placeholder="Who is covered?"
                                        value={formData.insured_name}
                                        onChange={(e) => setFormData({ ...formData, insured_name: e.target.value })}
                                    />
                                    <Input
                                        label="Relationship"
                                        placeholder="e.g. Self, Spouse"
                                        value={formData.insured_relationship}
                                        onChange={(e) => setFormData({ ...formData, insured_relationship: e.target.value })}
                                    />
                                    <Input
                                        label="Notes"
                                        placeholder="Agent details, policy features..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title="Select Provider"
                                        subtitle="Popular Indian insurers"
                                        items={insuranceProviders.map((name) => ({ label: name, value: name }))}
                                        onSelect={(value) => setFormData((p) => ({ ...p, provider_name: value }))}
                                    />
                                </div>
                            </div>

                            {/* Document Upload - only when editing */}
                            {editingId && (
                                <EntityDocumentUpload
                                    entityType="insurance_policy"
                                    entityId={editingId}
                                />
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting}>
                                    {submitting ? "Saving..." : editingId ? "Update Policy" : "Save Policy"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Payments Dialog */}
                <PaymentsDialog
                    policy={paymentPolicy}
                    open={isPaymentsOpen}
                    onOpenChange={setIsPaymentsOpen}
                    onUpdate={fetchPolicies}
                />
            </div>
        </DashboardShell>
    );
}
