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
import { PaymentsDialog } from "@/components/liabilities/PaymentsDialog";
import {
    CreditCard,
    Plus,
    Filter,
    Search,
    Edit2,
    Trash2,
    Landmark,
    Home,
    Car,
    Briefcase,
    Calendar,
    Wallet,
    Sparkles
} from "lucide-react";
import { Liability, Asset } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { formatUpdatedAt } from "@/lib/dateUtils";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { liabilityTypes, lenderTypes, liabilityStatus, liabilityNotes } from "@/src/lib/presets";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";
import { EntityDocumentsBadge } from "@/components/ui/EntityDocumentsBadge";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { GridTable } from "@/components/ui/GridTable";
import { GridDocUpload } from "@/components/ui/GridDocUpload";

// Constants
const LOAN_TYPES = [
    { value: "home_loan", label: "Home Loan" },
    { value: "car_loan", label: "Car Loan" },
    { value: "personal_loan", label: "Personal Loan" },
    { value: "education_loan", label: "Education Loan" },
    { value: "credit_card", label: "Credit Card" },
    { value: "business_loan", label: "Business Loan" },
    { value: "loan_against_property", label: "Loan Against Property" },
    { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
    { value: "defaulted", label: "Defaulted" },
];

export default function LiabilitiesPage() {
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("active");
    const [filterType, setFilterType] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // QuickPick State
    const [showLoanTypePick, setShowLoanTypePick] = useState(false);
    const [showLenderTypePick, setShowLenderTypePick] = useState(false);
    const [showStatusPick, setShowStatusPick] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        loan_type: "personal_loan",
        loan_name: "",
        taken_from: "",
        principal_amount: "",
        outstanding_amount: "",
        emi_amount: "",
        interest_rate: "",
        loan_start_date: "",
        loan_end_date: "",
        emi_due_day: "",
        is_secured: false,
        collateral_details: "",
        status: "active",
        linked_asset_id: "",
        notes: "",
    });

    const handleQuickPick = (value: string, category?: string) => {
        setFormData(prev => {
            const updates: any = { ...prev };
            const lowerVal = value.toLowerCase();

            if (category === "Loan Type") {
                updates.loan_type = lowerVal.replace(/[^a-z0-9]/g, '_');
            } else if (category === "Lender Type") {
                updates.taken_from = value;
            } else if (category === "Status") {
                updates.status = lowerVal;
            } else if (category === "Notes") {
                const currentNotes = prev.notes ? prev.notes.split('\n').filter(n => n.trim()) : [];
                if (!currentNotes.includes(value)) {
                    updates.notes = [...currentNotes, value].join('\n');
                }
            } else {
                // Fallback
                const isType = liabilityTypes.some(t => t.toLowerCase().replace(/[^a-z0-9]/g, '_') === lowerVal.replace(/[^a-z0-9]/g, '_'));
                const isLender = lenderTypes.some(l => l.toLowerCase() === lowerVal);
                const isStat = liabilityStatus.some(s => s.toLowerCase() === lowerVal);

                if (isType) updates.loan_type = lowerVal.replace(/[^a-z0-9]/g, '_');
                else if (isLender) updates.taken_from = value;
                else if (isStat) updates.status = lowerVal;
            }
            return updates;
        });
    };

    const resetForm = () => {
        setFormData({
            loan_type: "personal_loan",
            loan_name: "",
            taken_from: "",
            principal_amount: "",
            outstanding_amount: "",
            emi_amount: "",
            interest_rate: "",
            loan_start_date: "",
            loan_end_date: "",
            emi_due_day: "",
            is_secured: false,
            collateral_details: "",
            status: "active",
            linked_asset_id: "",
            notes: "",
        });
        setEditingId(null);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const [liabilitiesRes, assetsRes] = await Promise.all([
                fetch("/api/liabilities", { cache: 'no-store' }),
                fetch("/api/assets", { cache: 'no-store' })
            ]);

            if (liabilitiesRes.ok) {
                const data = await liabilitiesRes.json();
                setLiabilities(data.liabilities || []);
            }
            if (assetsRes.ok) {
                const data = await assetsRes.json();
                setAssets(data.assets || []);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (liability: Liability) => {
        setFormData({
            loan_type: liability.loan_type,
            loan_name: liability.loan_name || "",
            taken_from: liability.taken_from,
            principal_amount: String(liability.principal_amount),
            outstanding_amount: String(liability.outstanding_amount),
            emi_amount: liability.emi_amount ? String(liability.emi_amount) : "",
            interest_rate: liability.interest_rate ? String(liability.interest_rate) : "",
            loan_start_date: liability.loan_start_date || "",
            loan_end_date: liability.loan_end_date || "",
            emi_due_day: liability.emi_due_day ? String(liability.emi_due_day) : "",
            is_secured: !!liability.is_secured,
            collateral_details: liability.collateral_details || "",
            status: liability.status || "active",
            linked_asset_id: liability.linked_asset_id || "",
            notes: liability.notes || "",
        });
        setEditingId(liability.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this liability? It cannot be undone.")) return;

        try {
            const res = await fetch(`/api/liabilities/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setLiabilities((prev) => prev.filter((l) => l.id !== id));
            } else {
                alert("Failed to delete liability");
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
                ? `/api/liabilities/${editingId}`
                : "/api/liabilities";
            const method = editingId ? "PATCH" : "POST";

            const payload = {
                ...formData,
                principal_amount: Number(formData.principal_amount),
                outstanding_amount: Number(formData.outstanding_amount),
                emi_amount: formData.emi_amount ? Number(formData.emi_amount) : null,
                interest_rate: formData.interest_rate ? Number(formData.interest_rate) : null,
                emi_due_day: formData.emi_due_day ? Number(formData.emi_due_day) : null,
                linked_asset_id: formData.linked_asset_id || null, // handle empty string
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save liability");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const openPayments = (liability: Liability) => {
        setSelectedLiability(liability);
        setIsPaymentModalOpen(true);
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return "₹0";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'home_loan': return Home;
            case 'car_loan': return Car;
            case 'credit_card': return CreditCard;
            case 'business_loan': return Briefcase;
            default: return Landmark;
        }
    };

    const filteredLiabilities = liabilities.filter(l => {
        const matchesSearch =
            l.taken_from.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.loan_name && l.loan_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = filterStatus === "all" || l.status === filterStatus;
        const matchesType = filterType === "all" || l.loan_type === filterType;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Stats
    const activeLiabilities = liabilities.filter(l => l.status === 'active');
    const totalOutstanding = activeLiabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
    const totalMonthlyEMI = activeLiabilities.reduce((sum, l) => sum + (l.emi_amount || 0), 0);

    return (
        <DashboardShell
            title="Liabilities"
            description="Track your loans, credit cards, and outstanding dues"
        >
            <div className="space-y-6">
                {/* Stats */}
                {liabilities.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-xl p-4 shadow-lg" style={{ background: 'var(--summary-card-bg)', color: 'hsl(var(--summary-card-text))' }}>
                            <p className="opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Total Outstanding</p>
                            <h2 className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Monthly EMI Commitment</p>
                            <h2 className="text-2xl font-bold text-foreground">{formatCurrency(totalMonthlyEMI)}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Active Loans</p>
                            <h2 className="text-2xl font-bold text-primary">{activeLiabilities.length}</h2>
                        </div>
                    </div>
                )}

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-1 w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                        <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search loans..."
                                className="pl-9 bg-card"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-1 gap-2 min-w-0">
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                options={[{ value: "all", label: "All Status" }, ...STATUS_OPTIONS]}
                                className="flex-1 min-w-0"
                            />
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                options={[{ value: "all", label: "All Types" }, ...LOAN_TYPES]}
                                className="flex-1 min-w-0"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
                        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="flex-1 sm:flex-initial gap-2 bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10"
                        >
                            <Plus className="h-4 w-4" />
                            Add Liability
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredLiabilities.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={CreditCard}
                            title={searchQuery ? "No matching liabilities found" : "No liabilities added"}
                            description="Track your loans and EMIs to stay on top of your debt."
                            action={searchQuery ? undefined : {
                                label: "Add Liability",
                                onClick: () => {
                                    resetForm();
                                    setIsModalOpen(true);
                                },
                            }}
                            withCard={true}
                        />
                    </div>
                ) : (
                    viewMode === "card" ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredLiabilities.map((liability) => {
                                const Icon = getIcon(liability.loan_type);
                                return (
                                    <Card key={liability.id} className="relative hover:shadow-md transition-all sm:hover:-translate-y-1" padding="sm">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="icon-container h-8 w-8 bg-red-50 dark:bg-red-900/20">
                                                    <Icon className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                </div>
                                                <Badge variant={liability.status === 'active' ? 'destructive' : 'secondary'} className="capitalize text-[10px] h-5">
                                                    {liability.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-2">
                                                <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
                                                    {liability.loan_name || liability.taken_from}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[11px] text-muted-foreground capitalize">
                                                        {liability.loan_type.replace(/_/g, ' ')}
                                                    </p>
                                                    {liability.is_secured && <Badge variant="outline" className="text-[8px] h-4 px-1">SECURED</Badge>}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2 space-y-2">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Outstanding</p>
                                                <p className="text-xl font-bold text-foreground">
                                                    {formatCurrency(liability.outstanding_amount)}
                                                </p>
                                                <div className="w-full bg-slate-100 h-1 mt-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-red-500 h-full rounded-full"
                                                        style={{ width: `${Math.min((liability.outstanding_amount / liability.principal_amount) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground border-t border-border pt-2">
                                                <div>
                                                    <span className="text-slate-400 block mb-1">EMI</span>
                                                    <span className="font-medium text-foreground">{liability.emi_amount ? formatCurrency(liability.emi_amount) : '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block mb-1">Lender</span>
                                                    <span className="font-medium truncate">{liability.taken_from}</span>
                                                </div>
                                                {liability.emi_due_day && (
                                                    <div className="col-span-2 flex items-center gap-1 text-amber-600 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Due on day {liability.emi_due_day} of month
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex flex-wrap items-center justify-between gap-2 mt-auto">
                                            <div className="text-[10px] text-muted-foreground">
                                                {formatUpdatedAt(liability.updated_at || liability.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1 ml-auto">
                                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => openPayments(liability)}>
                                                    <Wallet className="h-3 w-3 mr-1" /> Pay
                                                </Button>
                                                <EntityDocumentsBadge
                                                    entityType="liability"
                                                    entityId={liability.id}
                                                />
                                                <GridDocUpload
                                                    entityType="liability"
                                                    entityId={liability.id}
                                                />
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(liability)} className="h-8 w-8 p-0">
                                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(liability.id)} className="h-8 w-8 p-0 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <GridTable
                            items={filteredLiabilities}
                            columns={[
                                {
                                    key: 'loan_name', label: 'Loan', render: (l) => (
                                        <div>
                                            <span className="font-medium text-foreground">{l.loan_name || l.taken_from}</span>
                                            <span className="block text-xs text-slate-500 capitalize">{l.loan_type.replace(/_/g, ' ')}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'outstanding_amount', label: 'Outstanding', render: (l) => (
                                        <span className="font-semibold text-foreground">{formatCurrency(l.outstanding_amount)}</span>
                                    )
                                },
                                {
                                    key: 'emi_amount', label: 'EMI', render: (l) => (
                                        <span>{l.emi_amount ? formatCurrency(l.emi_amount) : '—'}</span>
                                    )
                                },
                                { key: 'taken_from', label: 'Lender', hideMobile: true },
                                {
                                    key: 'status', label: 'Status', render: (l) => (
                                        <Badge variant={l.status === 'active' ? 'destructive' : 'secondary'} className="text-xs capitalize">{l.status}</Badge>
                                    ), hideMobile: true
                                },
                            ]}
                            onEdit={handleEdit}
                            onDelete={(l) => handleDelete(l.id)}
                            renderDocBadge={(l) => (
                                <EntityDocumentsBadge entityType="liability" entityId={l.id} />
                            )}
                            renderDocUpload={(l) => (
                                <GridDocUpload entityType="liability" entityId={l.id} />
                            )}
                            renderExtraActions={(l) => (
                                <Button variant="ghost" size="sm" onClick={() => openPayments(l)} className="h-8 px-2 text-xs gap-1">
                                    <Wallet className="h-3 w-3" /> Pay
                                </Button>
                            )}
                        />
                    )
                )}

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Liability" : "Add Liability"}</DialogTitle>
                            <DialogDescription>
                                Add details about your loan or credit card debt.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {/* Section: Basic Info */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                            <Landmark className="h-4 w-4" /> Loan Details
                                        </h4>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loan Type</label>
                                                <Sheet open={showLoanTypePick} onOpenChange={setShowLoanTypePick}>
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
                                                            title="Liability Selections"
                                                            subtitle="Quick fill loan details"
                                                            items={[
                                                                ...liabilityTypes.map(type => ({ value: type, label: type, category: 'Loan Type' })),
                                                                ...lenderTypes.map(l => ({ value: l, label: l, category: 'Lender Type' })),
                                                                ...liabilityStatus.map(s => ({ value: s, label: s, category: 'Status' })),
                                                                ...liabilityNotes.map(n => ({ value: n, label: n, category: 'Notes' }))
                                                            ]}
                                                            onSelect={(value, category) => {
                                                                handleQuickPick(value, category);
                                                                setShowLoanTypePick(false);
                                                            }}
                                                        />
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                            <Select
                                                options={LOAN_TYPES}
                                                value={formData.loan_type}
                                                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
                                            />
                                        </div>
                                        <Input
                                            label="Lender (Bank/Institution)"
                                            placeholder="e.g. HDFC Bank, SBI"
                                            value={formData.taken_from}
                                            onChange={(e) => setFormData({ ...formData, taken_from: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Loan Name (Optional)"
                                            placeholder="e.g. Home Loan - Indiranagar"
                                            value={formData.loan_name}
                                            onChange={(e) => setFormData({ ...formData, loan_name: e.target.value })}
                                        />
                                        <Select
                                            label="Status"
                                            options={STATUS_OPTIONS}
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                    </div>

                                    {/* Section: Amounts */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                            <Wallet className="h-4 w-4" /> Amounts & EMI
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Principal Amount"
                                                type="number"
                                                value={formData.principal_amount}
                                                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="Current Outstanding"
                                                type="number"
                                                value={formData.outstanding_amount}
                                                onChange={(e) => setFormData({ ...formData, outstanding_amount: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="EMI Amount"
                                                type="number"
                                                value={formData.emi_amount}
                                                onChange={(e) => setFormData({ ...formData, emi_amount: e.target.value })}
                                            />
                                            <Input
                                                label="EMI Due Day (1-31)"
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.emi_due_day}
                                                onChange={(e) => setFormData({ ...formData, emi_due_day: e.target.value })}
                                            />
                                            <Input
                                                label="Interest Rate (%)"
                                                type="number"
                                                step="0.01"
                                                value={formData.interest_rate}
                                                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Section: Linked Asset & Other */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                            <Briefcase className="h-4 w-4" /> Additional Info
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Linked Asset (Optional)"
                                                value={formData.linked_asset_id}
                                                onChange={(e) => setFormData({ ...formData, linked_asset_id: e.target.value })}
                                                options={[
                                                    { value: "", label: "None" },
                                                    ...assets.map(a => ({ value: a.id, label: `${a.asset_name} (${a.asset_type})` }))
                                                ]}
                                            />
                                            <div className="flex items-center gap-2 h-10 mt-6 md:col-span-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_secured"
                                                    checked={formData.is_secured}
                                                    onChange={(e) => setFormData({ ...formData, is_secured: e.target.checked })}
                                                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                                />
                                                <label htmlFor="is_secured" className="text-sm text-slate-700 dark:text-slate-300">
                                                    Is this a secured loan? (Has Collateral)
                                                </label>
                                            </div>
                                            {formData.is_secured && (
                                                <Input
                                                    label="Collateral Details"
                                                    value={formData.collateral_details}
                                                    onChange={(e) => setFormData({ ...formData, collateral_details: e.target.value })}
                                                    className="md:col-span-2"
                                                />
                                            )}
                                            <Input
                                                label="Notes"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                className="md:col-span-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title={editingId ? "Quick Updates" : "Quick Selection"}
                                        subtitle="Standardized liability presets"
                                        items={[
                                            ...liabilityTypes.map(type => ({ value: type, label: type, category: 'Loan Type' })),
                                            ...lenderTypes.map(l => ({ value: l, label: l, category: 'Lender Type' })),
                                            ...liabilityStatus.map(s => ({ value: s, label: s, category: 'Status' })),
                                            ...liabilityNotes.map(n => ({ value: n, label: n, category: 'Notes' }))
                                        ]}
                                        onSelect={handleQuickPick}
                                    />
                                </div>
                            </div>

                            {/* Document Upload - only when editing */}
                            {editingId && (
                                <EntityDocumentUpload
                                    entityType="liability"
                                    entityId={editingId}
                                />
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10" disabled={submitting}>
                                    {submitting ? "Saving..." : editingId ? "Update Liability" : "Save Liability"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>


                {/* Payments Modal */}
                <PaymentsDialog
                    liability={selectedLiability}
                    open={isPaymentModalOpen}
                    onOpenChange={setIsPaymentModalOpen}
                    onUpdate={fetchData}
                />
            </div>
        </DashboardShell>
    );
}
