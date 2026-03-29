"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import {
    Package,
    Plus,
    Filter,
    Search,
    Edit2,
    Trash2,
    Watch,
    Gem,
    Monitor,
    Smartphone,
    Briefcase,
    Lock,
    ShieldCheck,
    MapPin,
    FileText,
    Sparkles
} from "lucide-react";
import type { Belonging } from "@/lib/types";
import { formatUpdatedAt } from "@/lib/dateUtils";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { belongingCategories, belongingStatus, storageLocations, belongingNotes } from "@/src/lib/presets";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";
import { EntityDocumentsBadge } from "@/components/ui/EntityDocumentsBadge";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { GridTable } from "@/components/ui/GridTable";
import { GridDocUpload } from "@/components/ui/GridDocUpload";

// Constants
const CATEGORIES = [
    { value: "jewelry", label: "Jewelry" },
    { value: "watch", label: "Watch" },
    { value: "electronics", label: "Electronics" },
    { value: "gadget", label: "Gadget" },
    { value: "collectible", label: "Collectible" },
    { value: "furniture", label: "Furniture" },
    { value: "document", label: "Important Document" },
    { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
    { value: "in_possession", label: "In Possession" },
    { value: "in_locker", label: "In Bank Locker" },
    { value: "given_away", label: "Given Away" },
    { value: "sold", label: "Sold" },
    { value: "lost", label: "Lost" },
    { value: "stolen", label: "Stolen" },
];

export default function BelongingsPage() {
    const [belongings, setBelongings] = useState<Belonging[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [showInsuredOnly, setShowInsuredOnly] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Queued documents for new entries
    const [queuedDocIds, setQueuedDocIds] = useState<string[]>([]);

    // QuickPick State
    const [showCategoryPick, setShowCategoryPick] = useState(false);
    const [showStatusPick, setShowStatusPick] = useState(false);
    const [showStoragePick, setShowStoragePick] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        category: "other",
        item_name: "",
        description: "",
        material: "",
        purity: "",
        weight_grams: "",
        quantity: "1",
        purchase_value: "",
        purchase_date: "",
        current_estimated_value: "",
        valuation_date: new Date().toISOString().split("T")[0],
        storage_location: "",
        location_details: "",
        is_insured: false,
        insurance_policy_reference: "",
        has_invoice: false,
        has_certificate: false,
        bank_locker_details: "",
        status: "in_possession",
        notes: "",
    });

    const resetForm = () => {
        setFormData({
            category: "other",
            item_name: "",
            description: "",
            material: "",
            purity: "",
            weight_grams: "",
            quantity: "1",
            purchase_value: "",
            purchase_date: "",
            current_estimated_value: "",
            valuation_date: new Date().toISOString().split("T")[0],
            storage_location: "",
            location_details: "",
            is_insured: false,
            insurance_policy_reference: "",
            has_invoice: false,
            has_certificate: false,
            bank_locker_details: "",
            status: "in_possession",
            notes: "",
        });
        setEditingId(null);
        setQueuedDocIds([]);
    };

    const handleQuickPick = (value: string, category?: string) => {
        setFormData(prev => {
            const updates: any = { ...prev };
            if (category === "Category") {
                updates.category = value;
            } else if (category === "Status") {
                updates.status = value;
            } else if (category === "Storage") {
                updates.storage_location = value;
            } else if (category === "Notes") {
                const currentNotes = prev.notes ? prev.notes.split('\n').filter((n: string) => n.trim()) : [];
                if (!currentNotes.includes(value)) {
                    updates.notes = [...currentNotes, value].join('\n');
                }
            }
            return updates;
        });
    };

    const fetchBelongings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/belongings");
            if (res.ok) {
                const data = await res.json();
                setBelongings(data.belongings || []);
            }
        } catch (error) {
            console.error("Failed to fetch belongings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBelongings();
    }, [fetchBelongings]);

    const handleEdit = (item: Belonging) => {
        setFormData({
            category: item.category,
            item_name: item.item_name,
            description: item.description || "",
            material: item.material || "",
            purity: item.purity || "",
            weight_grams: item.weight_grams ? String(item.weight_grams) : "",
            quantity: String(item.quantity),
            purchase_value: item.purchase_value ? String(item.purchase_value) : "",
            purchase_date: item.purchase_date || "",
            current_estimated_value: item.current_estimated_value ? String(item.current_estimated_value) : "",
            valuation_date: item.valuation_date || "",
            storage_location: item.storage_location || "",
            location_details: item.location_details || "",
            is_insured: !!item.is_insured,
            insurance_policy_reference: item.insurance_policy_reference || "",
            has_invoice: !!item.has_invoice,
            has_certificate: !!item.has_certificate,
            bank_locker_details: item.bank_locker_details || "",
            status: item.status,
            notes: item.notes || "",
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch(`/api/belongings/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setBelongings((prev) => prev.filter((b) => b.id !== id));
            } else {
                alert("Failed to delete item");
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
                ? `/api/belongings/${editingId}`
                : "/api/belongings";
            const method = editingId ? "PATCH" : "POST";

            const payload = {
                ...formData,
                quantity: Number(formData.quantity),
                purchase_value: formData.purchase_value ? Number(formData.purchase_value) : null,
                current_estimated_value: formData.current_estimated_value ? Number(formData.current_estimated_value) : null,
                weight_grams: formData.weight_grams ? Number(formData.weight_grams) : null,
                linked_document_ids: queuedDocIds // Include queued docs for linking
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchBelongings();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save item");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'jewelry': return Gem;
            case 'watch': return Watch;
            case 'electronics': return Monitor;
            case 'gadget': return Smartphone;
            case 'document': return FileText;
            default: return Package;
        }
    };

    const filteredBelongings = belongings.filter(b => {
        const matchesSearch =
            b.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.location_details && b.location_details.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = filterCategory === "all" || b.category === filterCategory;
        const matchesStatus = filterStatus === "all" || b.status === filterStatus;
        const matchesInsured = !showInsuredOnly || b.is_insured;

        return matchesSearch && matchesCategory && matchesStatus && matchesInsured;
    });

    // Stats
    const totalItems = belongings.length;
    const totalValue = belongings.reduce((sum, b) => sum + (b.current_estimated_value || b.purchase_value || 0), 0);
    const insuredCount = belongings.filter(b => b.is_insured).length;
    const lockerCount = belongings.filter(b => b.status === 'in_locker' || (b.storage_location && b.storage_location.toLowerCase().includes('locker'))).length;

    return (
        <DashboardShell
            title="Belongings"
            description="Inventory of your valuables and possessions"
        >
            <div className="space-y-6">
                {/* Stats */}
                {belongings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl p-4 shadow-lg" style={{ background: 'var(--summary-card-bg)', color: 'hsl(var(--summary-card-text))' }}>
                            <p className="opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Total Estimated Value</p>
                            <h2 className="text-2xl font-bold">{formatCurrency(totalValue)}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Items Tracked</p>
                            <h2 className="text-2xl font-bold text-foreground">{totalItems}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Insured Items</p>
                            <h2 className="text-2xl font-bold text-primary">{insuredCount}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">In Locker</p>
                            <h2 className="text-2xl font-bold text-blue-600">{lockerCount}</h2>
                        </div>
                    </div>
                )}

                {/* Filters & Actions */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex flex-1 w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search items..."
                                    className="pl-9 bg-card"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                options={[{ value: "all", label: "All Categories" }, ...CATEGORIES]}
                            />
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                options={[{ value: "all", label: "All Status" }, ...STATUS_OPTIONS]}
                            />
                        </div>
                        <div className="flex gap-2">
                            <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
                            <Button
                                onClick={() => {
                                    resetForm();
                                    setIsModalOpen(true);
                                }}
                                className="w-full sm:w-auto gap-2 bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="insuredOnly"
                            checked={showInsuredOnly}
                            onChange={(e) => setShowInsuredOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600"
                        />
                        <label htmlFor="insuredOnly" className="text-sm text-muted-foreground">Show only insured items</label>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredBelongings.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={Package}
                            title={searchQuery ? "No matching items found" : "No belongings added"}
                            description="Keep an inventory of your jewelry, electronics, and valuable documents."
                            action={searchQuery ? undefined : {
                                label: "Add First Item",
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
                            {filteredBelongings.map((item) => {
                                const Icon = getIcon(item.category);
                                const value = item.current_estimated_value || item.purchase_value;

                                return (
                                    <Card key={item.id} className="relative hover:shadow-md transition-all sm:hover:-translate-y-1">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                                        <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-foreground line-clamp-1">
                                                            {item.item_name}
                                                        </h3>
                                                        {item.quantity > 1 ? (
                                                            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600">
                                                                Qty: {item.quantity}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-500 capitalize">{item.category}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="secondary" className="capitalize text-[10px]">
                                                        {item.status.replace('_', ' ')}
                                                    </Badge>
                                                    {item.is_insured && (
                                                        <Badge variant="outline" className="text-primary border-emerald-200 bg-primary/10 text-[10px] gap-1">
                                                            <ShieldCheck className="h-3 w-3" /> Insured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3 space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Value</p>
                                                <p className="text-xl font-bold text-foreground">
                                                    {formatCurrency(value)}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
                                                {(item.storage_location || item.status === 'in_locker') && (
                                                    <div className="flex items-center gap-2">
                                                        {item.status === 'in_locker' ? <Lock className="h-3 w-3 text-blue-500" /> : <MapPin className="h-3 w-3" />}
                                                        <span className={item.status === 'in_locker' ? 'text-blue-600 font-medium' : ''}>
                                                            {item.status === 'in_locker' ? 'Bank Locker' : item.storage_location}
                                                        </span>
                                                    </div>
                                                )}

                                                {(item.material || item.weight_grams) && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {item.material && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                                                {item.material}
                                                            </span>
                                                        )}
                                                        {item.purity && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                                                {item.purity}
                                                            </span>
                                                        )}
                                                        {item.weight_grams && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                                                {item.weight_grams}g
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex items-center justify-between mt-auto">
                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatUpdatedAt(item.updated_at || item.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <EntityDocumentsBadge
                                                    entityType="belonging"
                                                    entityId={item.id}
                                                />
                                                <GridDocUpload
                                                    entityType="belonging"
                                                    entityId={item.id}
                                                />
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0 hover:text-red-600">
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
                            items={filteredBelongings}
                            columns={[
                                {
                                    key: 'item_name', label: 'Item', render: (b) => (
                                        <div>
                                            <span className="font-medium text-foreground">{b.item_name}</span>
                                            <span className="block text-xs text-slate-500 capitalize">{b.category}{b.quantity > 1 ? ` ×${b.quantity}` : ''}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'current_estimated_value', label: 'Value', render: (b) => (
                                        <span className="font-semibold text-foreground">{formatCurrency(b.current_estimated_value || b.purchase_value)}</span>
                                    )
                                },
                                {
                                    key: 'storage_location', label: 'Location', render: (b) => (
                                        <span className="text-xs">{b.storage_location || (b.status === 'in_locker' ? 'Bank Locker' : '—')}</span>
                                    ), hideMobile: true
                                },
                                {
                                    key: 'status', label: 'Status', render: (b) => (
                                        <Badge variant="secondary" className="text-xs capitalize">{b.status.replace('_', ' ')}</Badge>
                                    ), hideMobile: true
                                },
                                {
                                    key: 'is_insured', label: 'Insured', render: (b) => (
                                        b.is_insured ? <Badge variant="outline" className="text-primary border-emerald-200 bg-primary/10 text-[10px]">Yes</Badge> : <span className="text-xs text-slate-400">No</span>
                                    ), hideMobile: true
                                },
                            ]}
                            onEdit={handleEdit}
                            onDelete={(b) => handleDelete(b.id)}
                            renderDocBadge={(b) => (
                                <EntityDocumentsBadge entityType="belonging" entityId={b.id} />
                            )}
                            renderDocUpload={(b) => (
                                <GridDocUpload entityType="belonging" entityId={b.id} />
                            )}
                        />
                    )
                )}

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Item" : "Add Belonging"}</DialogTitle>
                            <DialogDescription>
                                Add details about your valuable possession.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {/* Basics */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                                <Sheet open={showCategoryPick} onOpenChange={setShowCategoryPick}>
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
                                                            title="Select Category"
                                                            subtitle="Item categories"
                                                            items={belongingCategories.map(cat => ({ value: cat.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: cat }))}
                                                            onSelect={(value) => {
                                                                setFormData((p) => ({ ...p, category: value }));
                                                                setShowCategoryPick(false);
                                                            }}
                                                        />
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                            <Select
                                                options={CATEGORIES}
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        </div>
                                        <Input
                                            label="Item Name"
                                            placeholder="e.g. Gold Necklace, Macbook Pro"
                                            value={formData.item_name}
                                            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                            required
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <Input
                                            label="Quantity"
                                            type="number"
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                                <Sheet open={showStatusPick} onOpenChange={setShowStatusPick}>
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
                                                            title="Select Status"
                                                            subtitle="Current item status"
                                                            items={belongingStatus.map(status => ({ value: status.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: status }))}
                                                            onSelect={(value) => {
                                                                setFormData((p) => ({ ...p, status: value }));
                                                                setShowStatusPick(false);
                                                            }}
                                                        />
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                            <Select
                                                options={STATUS_OPTIONS}
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Jewelry Specifics (Conditional) */}
                                    {(formData.category === 'jewelry' || formData.category === 'watch') && (
                                        <div className="space-y-4 pt-2 border-t border-border">
                                            <h4 className="text-sm font-medium flex items-center gap-2"><Gem className="h-4 w-4" /> Material Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input
                                                    label="Material"
                                                    placeholder="Gold, Silver, Platinum"
                                                    value={formData.material}
                                                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                                />
                                                <Input
                                                    label="Purity/Carat"
                                                    placeholder="24K, 18K"
                                                    value={formData.purity}
                                                    onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                                                />
                                                <Input
                                                    label="Weight (grams)"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.weight_grams}
                                                    onChange={(e) => setFormData({ ...formData, weight_grams: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Valuation */}
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <h4 className="text-sm font-medium">Valuation</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Purchase Value"
                                                type="number"
                                                value={formData.purchase_value}
                                                onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                                            />
                                            <Input
                                                label="Current Estimated Value"
                                                type="number"
                                                value={formData.current_estimated_value}
                                                onChange={(e) => setFormData({ ...formData, current_estimated_value: e.target.value })}
                                            />
                                            <Input
                                                label="Purchase Date"
                                                type="date"
                                                value={formData.purchase_date}
                                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                            />
                                            <Input
                                                label="Valuation Date"
                                                type="date"
                                                value={formData.valuation_date}
                                                onChange={(e) => setFormData({ ...formData, valuation_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Storage & Locker, Documentation & Insurance, Notes - keeping existing structure */}
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <h4 className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Storage Location</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stored At</label>
                                                    <Sheet open={showStoragePick} onOpenChange={setShowStoragePick}>
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
                                                                title="Select Storage Location"
                                                                subtitle="Where is this item stored?"
                                                                items={storageLocations.map(loc => ({ value: loc, label: loc }))}
                                                                onSelect={(value) => {
                                                                    setFormData((p) => ({ ...p, storage_location: value }));
                                                                    setShowStoragePick(false);
                                                                }}
                                                            />
                                                        </SheetContent>
                                                    </Sheet>
                                                </div>
                                                <Input
                                                    placeholder="e.g. Home Safe, Office"
                                                    value={formData.storage_location}
                                                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                                                />
                                            </div>
                                            <Input
                                                label="Precise Location Details"
                                                placeholder="e.g. Top shelf, Box #2"
                                                value={formData.location_details}
                                                onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                                            />
                                            {(formData.status === 'in_locker' || formData.storage_location.toLowerCase().includes('locker')) && (
                                                <div className="md:col-span-2">
                                                    <Input
                                                        label="Bank Locker Details"
                                                        placeholder="Bank Name, Branch, Locker No."
                                                        value={formData.bank_locker_details}
                                                        onChange={(e) => setFormData({ ...formData, bank_locker_details: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <h4 className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Documents & Insurance</h4>
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="has_invoice"
                                                            checked={formData.has_invoice}
                                                            onChange={(e) => setFormData({ ...formData, has_invoice: e.target.checked })}
                                                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                        />
                                                        <Label htmlFor="has_invoice" className="cursor-pointer">Has Invoice</Label>
                                                    </div>
                                                    {formData.has_invoice && (
                                                        <p className="text-[10px] text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-md border border-violet-100 dark:border-violet-800 animate-in fade-in slide-in-from-top-1">
                                                            if u have invoice pls upload the document of invoice
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="has_certificate"
                                                            checked={formData.has_certificate}
                                                            onChange={(e) => setFormData({ ...formData, has_certificate: e.target.checked })}
                                                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                        />
                                                        <Label htmlFor="has_certificate" className="cursor-pointer">Has Certificate</Label>
                                                    </div>
                                                    {formData.has_certificate && (
                                                        <p className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-800 animate-in fade-in slide-in-from-top-1">
                                                            pls upload you certifiactre as a proof
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="is_insured"
                                                            checked={formData.is_insured}
                                                            onChange={(e) => setFormData({ ...formData, is_insured: e.target.checked })}
                                                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                        />
                                                        <Label htmlFor="is_insured" className="cursor-pointer">Is Insured</Label>
                                                    </div>
                                                    {formData.is_insured && (
                                                        <p className="text-[10px] text-primary bg-primary/10 dark:bg-emerald-900/20 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800 animate-in fade-in slide-in-from-top-1">
                                                            the item is insured, please upload the insurance document
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {formData.is_insured && (
                                                <Input
                                                    label="Insurance Policy Reference"
                                                    placeholder="Policy # or insurance company name"
                                                    value={formData.insurance_policy_reference}
                                                    onChange={(e) => setFormData({ ...formData, insurance_policy_reference: e.target.value })}
                                                />
                                            )}

                                            {/* Integrated Document Upload UI */}
                                            {(formData.has_invoice || formData.has_certificate || formData.is_insured) && (
                                                <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-slate-50/50 dark:bg-slate-900/30">
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            {editingId ? "Upload your documents here:" : "Queue documents for upload (will be linked after saving):"}
                                                        </p>
                                                        <EntityDocumentUpload
                                                            entityType="belonging"
                                                            entityId={editingId || undefined}
                                                            onDocUploaded={(docId) => {
                                                                if (!editingId) {
                                                                    setQueuedDocIds(prev => [...prev, docId]);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Input
                                            label="Notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title={editingId ? "Quick Updates" : "Quick Selection"}
                                        subtitle="Standardized belonging presets"
                                        items={[
                                            ...belongingCategories.map(cat => ({ value: cat.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: cat, category: 'Category' })),
                                            ...belongingStatus.map(status => ({ value: status.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: status, category: 'Status' })),
                                            ...storageLocations.map(loc => ({ value: loc, label: loc, category: 'Storage' })),
                                            ...belongingNotes.map(n => ({ value: n, label: n, category: 'Notes' }))
                                        ]}
                                        onSelect={handleQuickPick}
                                    />
                                </div>
                            </div>


                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10" disabled={submitting}>
                                    {submitting ? "Saving..." : editingId ? "Update Item" : "Save Item"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}
