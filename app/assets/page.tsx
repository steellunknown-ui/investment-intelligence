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
    Briefcase,
    Plus,
    Filter,
    Search,
    Edit2,
    Trash2,
    Home,
    Car,
    Gem,
    DollarSign,
    Users,
    FileText,
    Sparkles
} from "lucide-react";
import type { Asset } from "@/lib/types";
import { formatUpdatedAt } from "@/lib/dateUtils";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { assetCategories, assetTypes, ownershipTypes, assetStatus, assetNotes } from "@/src/lib/presets";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";
import { EntityDocumentsBadge } from "@/components/ui/EntityDocumentsBadge";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { GridTable } from "@/components/ui/GridTable";
import { GridDocUpload } from "@/components/ui/GridDocUpload";

// Constants
const ASSET_CATEGORIES = [
    { value: "movable", label: "Movable" },
    { value: "immovable", label: "Immovable" },
];

const ASSET_TYPES = assetTypes.map(type => ({
    value: type.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label: type
}));

const IMMOVABLE_TYPES = [
    "residential_property", "commercial_property", "plot_land", "farm_land", 
    "shop_office", "flat_apartment", "house_villa", "property"
];

const STATUS_OPTIONS = [
    { value: "owned", label: "Owned" },
    { value: "sold", label: "Sold" },
    { value: "transferred", label: "Transferred" },
    { value: "disputed", label: "Disputed" },
];

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // QuickPick State
    const [showAssetCategoryPick, setShowAssetCategoryPick] = useState(false);
    const [showAssetTypePick, setShowAssetTypePick] = useState(false);
    const [showOwnershipTypePick, setShowOwnershipTypePick] = useState(false);
    const [showStatusPick, setShowStatusPick] = useState(false);

    const [formData, setFormData] = useState({
        asset_category: "movable",
        asset_type: "other",
        asset_name: "",
        ownership_type: "sole",
        owner_name: "",
        co_owner_names: "", // comma separated for input
        ownership_percentage: "100",
        purchase_value: "",
        purchase_date: "",
        current_market_value: "",
        valuation_date: new Date().toISOString().split("T")[0],
        property_address: "",
        property_area: "",
        property_area_unit: "sq_ft",
        registration_number: "",
        vehicle_registration: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: "",
        is_under_loan: false,
        loan_provider: "",
        loan_outstanding: "",
        loan_emi: "",
        loan_end_date: "",
        document_reference: "",
        status: "owned",
        location: "",
        notes: "",
    });

    const handleQuickPick = (value: string, category?: string) => {
        setFormData(prev => {
            const updates: any = { ...prev };
            const lowerVal = value.toLowerCase();
            const typeKey = lowerVal.replace(/[^a-z0-9]/g, '_');

            if (category === "Type") {
                updates.asset_type = typeKey;
                const isImmovable = IMMOVABLE_TYPES.includes(typeKey);
                updates.asset_category = isImmovable ? 'immovable' : 'movable';
            } else if (category === "Category") {
                updates.asset_category = lowerVal;
            } else if (category === "Status") {
                updates.status = lowerVal;
            } else if (category === "Ownership") {
                updates.ownership_type = lowerVal;
            } else if (category === "Notes") {
                const currentNotes = prev.notes ? prev.notes.split('\n').filter(n => n.trim()) : [];
                if (!currentNotes.includes(value)) {
                    updates.notes = [...currentNotes, value].join('\n');
                }
            } else {
                // Fallback for unlabeled/legacy
                const isCat = assetCategories.some(c => c.toLowerCase() === lowerVal);
                const isType = assetTypes.some(t => t.toLowerCase() === lowerVal || t.toLowerCase().replace(/[^a-z0-9]/g, '_') === typeKey);
                const isOwn = ownershipTypes.some(o => o.toLowerCase() === lowerVal);
                const isStat = assetStatus.some(s => s.toLowerCase() === lowerVal);

                if (isCat) updates.asset_category = lowerVal;
                else if (isType) {
                    updates.asset_type = typeKey;
                    const isImmovable = IMMOVABLE_TYPES.includes(typeKey);
                    updates.asset_category = isImmovable ? 'immovable' : 'movable';
                }
                else if (isOwn) updates.ownership_type = lowerVal;
                else if (isStat) updates.status = lowerVal;
            }
            return updates;
        });
    };

    const resetForm = () => {
        setFormData({
            asset_category: "movable",
            asset_type: "other",
            asset_name: "",
            ownership_type: "sole",
            owner_name: "",
            co_owner_names: "",
            ownership_percentage: "100",
            purchase_value: "",
            purchase_date: "",
            current_market_value: "",
            valuation_date: new Date().toISOString().split("T")[0],
            property_address: "",
            property_area: "",
            property_area_unit: "sq_ft",
            registration_number: "",
            vehicle_registration: "",
            vehicle_make: "",
            vehicle_model: "",
            vehicle_year: "",
            is_under_loan: false,
            loan_provider: "",
            loan_outstanding: "",
            loan_emi: "",
            loan_end_date: "",
            document_reference: "",
            status: "owned",
            location: "",
            notes: "",
        });
        setEditingId(null);
    };

    const fetchAssets = useCallback(async () => {
        try {
            setLoading(true);

            const fetchHeaders: Record<string, string> = {
                'Cache-Control': 'no-cache'
            };
            const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
            if (isNative) {
                const supabase = createSupabaseBrowserClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    fetchHeaders['Authorization'] = `Bearer ${session.access_token}`;
                }
            }

            const res = await fetch("/api/assets", {
                headers: fetchHeaders,
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setAssets(data.assets || []);
            }
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const handleEdit = (asset: Asset) => {
        setFormData({
            asset_category: asset.asset_category,
            asset_type: asset.asset_type,
            asset_name: asset.asset_name,
            ownership_type: asset.ownership_type || "sole",
            owner_name: asset.owner_name || "",
            co_owner_names: asset.co_owner_names?.join(", ") || "",
            ownership_percentage: String(asset.ownership_percentage ?? 100),
            purchase_value: asset.purchase_value ? String(asset.purchase_value) : "",
            purchase_date: asset.purchase_date || "",
            current_market_value: asset.current_market_value ? String(asset.current_market_value) : "",
            valuation_date: asset.valuation_date || "",
            property_address: asset.property_address || "",
            property_area: asset.property_area ? String(asset.property_area) : "",
            property_area_unit: asset.property_area_unit || "sq_ft",
            registration_number: asset.registration_number || "",
            vehicle_registration: asset.vehicle_registration || "",
            vehicle_make: asset.vehicle_make || "",
            vehicle_model: asset.vehicle_model || "",
            vehicle_year: asset.vehicle_year ? String(asset.vehicle_year) : "",
            is_under_loan: !!asset.is_under_loan,
            loan_provider: asset.loan_provider || "",
            loan_outstanding: asset.loan_outstanding ? String(asset.loan_outstanding) : "",
            loan_emi: asset.loan_emi ? String(asset.loan_emi) : "",
            loan_end_date: asset.loan_end_date || "",
            document_reference: asset.document_reference || "",
            status: asset.status || "owned",
            location: asset.location || "",
            notes: asset.notes || "",
        });
        setEditingId(asset.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this asset?")) return;

        try {
            const res = await fetch(`/api/assets/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setAssets((prev) => prev.filter((a) => a.id !== id));
            } else {
                alert("Failed to delete asset");
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
                ? `/api/assets/${editingId}`
                : "/api/assets";
            const method = editingId ? "PATCH" : "POST";

            const payload = {
                ...formData,
                co_owner_names: formData.co_owner_names ? formData.co_owner_names.split(",").map(s => s.trim()).filter(Boolean) : null,
                purchase_value: formData.purchase_value ? Number(formData.purchase_value) : null,
                current_market_value: formData.current_market_value ? Number(formData.current_market_value) : null,
                ownership_percentage: Number(formData.ownership_percentage),
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchAssets();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save asset");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
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
            case 'property': return Home;
            case 'vehicle': return Car;
            case 'gold':
            case 'jewelry': return Gem;
            default: return Briefcase;
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (asset.location && asset.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = filterCategory === "all" || asset.asset_category === filterCategory;
        const matchesStatus = filterStatus === "all" || asset.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalValue = filteredAssets.reduce((sum, asset) => sum + (asset.current_market_value || asset.purchase_value || 0), 0);
    const underLoanCount = filteredAssets.filter(a => a.is_under_loan).length;

    return (
        <DashboardShell
            title="Assets"
            description="Manage your properties, vehicles, and valuables"
        >
            <div className="space-y-6">
                {/* Stats & Actions */}
                <div className="flex flex-col gap-6">
                    {assets.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl p-4 shadow-lg" style={{ background: 'var(--summary-card-bg)', color: 'hsl(var(--summary-card-text))' }}>
                                <p className="opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Total Asset Value</p>
                                <h2 className="text-2xl font-bold">{formatCurrency(totalValue)}</h2>
                            </div>
                            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Assets Tracking</p>
                                <h2 className="text-2xl font-bold text-foreground">{filteredAssets.length}</h2>
                            </div>
                            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Under Loan</p>
                                <h2 className="text-2xl font-bold text-amber-600">{underLoanCount}</h2>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex flex-1 w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search assets..."
                                    className="pl-9 bg-card"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                options={[{ value: "all", label: "All Categories" }, ...ASSET_CATEGORIES]}
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
                                Add Asset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={Briefcase}
                            title={searchQuery ? "No matching assets found" : "No assets added"}
                            description="Track your real estate, vehicles, jewelry, and other valuable assets."
                            action={searchQuery ? undefined : {
                                label: "Add Your First Asset",
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
                            {filteredAssets.map((asset) => {
                                const Icon = getIcon(asset.asset_type);
                                return (
                                    <Card key={asset.id} className="relative hover:shadow-md transition-all sm:hover:-translate-y-1">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="icon-container bg-indigo-50 dark:bg-indigo-900/20">
                                                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="flex gap-2">
                                                    {asset.is_under_loan && (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                            Loan
                                                        </Badge>
                                                    )}
                                                    <Badge variant={asset.status === 'owned' ? 'default' : 'secondary'} className="capitalize">
                                                        {asset.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <h3 className="font-semibold text-foreground line-clamp-1">
                                                    {asset.asset_name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1 uppercase tracking-wide">
                                                        {asset.asset_type}
                                                    </Badge>
                                                    {asset.location && (
                                                        <span className="text-xs text-slate-500 truncate max-w-[150px]">
                                                            📍 {asset.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3 space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Value</p>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {formatCurrency(asset.current_market_value || asset.purchase_value)}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-slate-400">Owner</span>
                                                    <span className="font-medium flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {asset.ownership_type === 'sole' ? 'Sole Owner' : `Joint (${asset.ownership_percentage}%)`}
                                                    </span>
                                                </div>
                                                {asset.is_under_loan && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-slate-400">Loan Due</span>
                                                        <span className="font-medium text-amber-600">
                                                            {formatCurrency(asset.loan_outstanding)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex items-center justify-between mt-auto">
                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatUpdatedAt(asset.updated_at || asset.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <EntityDocumentsBadge
                                                    entityType="asset"
                                                    entityId={asset.id}
                                                />
                                                <GridDocUpload
                                                    entityType="asset"
                                                    entityId={asset.id}
                                                />
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)} className="h-8 w-8 p-0">
                                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(asset.id)} className="h-8 w-8 p-0 hover:text-red-600">
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
                            items={filteredAssets}
                            columns={[
                                {
                                    key: 'asset_name', label: 'Asset', render: (a) => (
                                        <div>
                                            <span className="font-medium text-foreground">{a.asset_name}</span>
                                            <span className="block text-xs text-slate-500">{a.location || a.asset_type}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'asset_type', label: 'Type', render: (a) => (
                                        <Badge variant="outline" className="text-xs capitalize">{a.asset_type}</Badge>
                                    )
                                },
                                {
                                    key: 'current_market_value', label: 'Value', render: (a) => (
                                        <span className="font-semibold text-foreground">{formatCurrency(a.current_market_value || a.purchase_value)}</span>
                                    )
                                },
                                {
                                    key: 'ownership_type', label: 'Owner', render: (a) => (
                                        <span className="text-xs capitalize">{a.ownership_type}</span>
                                    ), hideMobile: true
                                },
                                {
                                    key: 'status', label: 'Status', render: (a) => (
                                        <Badge variant={a.status === 'owned' ? 'default' : 'secondary'} className="text-xs capitalize">{a.status}</Badge>
                                    ), hideMobile: true
                                },
                            ]}
                            onEdit={handleEdit}
                            onDelete={(a) => handleDelete(a.id)}
                            renderDocBadge={(a) => (
                                <EntityDocumentsBadge entityType="asset" entityId={a.id} />
                            )}
                            renderDocUpload={(a) => (
                                <GridDocUpload entityType="asset" entityId={a.id} />
                            )}
                        />
                    )
                )}

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                            <DialogDescription>
                                Enter details about your asset to track its value and status.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {/* Section 1: Classification */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                            <Briefcase className="h-4 w-4" /> Classification
                                        </h4>
                                        <Input
                                            label="Asset Name"
                                            placeholder="e.g. 3BHK Apartment, Honda City"
                                            value={formData.asset_name}
                                            onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                                            required
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                                                <Sheet open={showAssetTypePick} onOpenChange={setShowAssetTypePick}>
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
                                                            title="Asset Selections"
                                                            subtitle="Quick fill asset details"
                                                            items={[
                                                                ...assetTypes.map(type => ({ value: type, label: type, category: 'Type' })),
                                                                ...assetCategories.map(cat => ({ value: cat, label: cat, category: 'Category' })),
                                                                ...assetStatus.map(s => ({ value: s, label: s, category: 'Status' })),
                                                                ...ownershipTypes.map(o => ({ value: o, label: o, category: 'Ownership' })),
                                                                ...assetNotes.map(n => ({ value: n, label: n, category: 'Notes' }))
                                                            ]}
                                                            onSelect={(value, category) => {
                                                                 handleQuickPick(value, category);
                                                                 setShowAssetTypePick(false);
                                                             }}
                                                         />
                                                     </SheetContent>
                                                 </Sheet>
                                             </div>
                                             <Select
                                                 options={ASSET_TYPES}
                                                value={formData.asset_type}
                                                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                                            />
                                        </div>
                                        <Select
                                            label="Category"
                                            options={ASSET_CATEGORIES}
                                            value={formData.asset_category}
                                            onChange={(e) => setFormData({ ...formData, asset_category: e.target.value })}
                                        />
                                        <Select
                                            label="Status"
                                            options={STATUS_OPTIONS}
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                    </div>

                                    {/* Section 2: Valuation */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                            <DollarSign className="h-4 w-4" /> Valuation
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Purchase Value"
                                                type="number"
                                                value={formData.purchase_value}
                                                onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                                            />
                                            <Input
                                                label="Current Market Value"
                                                type="number"
                                                value={formData.current_market_value}
                                                onChange={(e) => setFormData({ ...formData, current_market_value: e.target.value })}
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

                                    {/* Section 3: Details (Conditional) */}
                                    {formData.asset_category === 'immovable' && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                                <Home className="h-4 w-4" /> Property Details
                                            </h4>
                                            <div className="space-y-4">
                                                <Input
                                                    label="Property Address"
                                                    value={formData.property_address}
                                                    onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        label="Area"
                                                        type="number"
                                                        value={formData.property_area}
                                                        onChange={(e) => setFormData({ ...formData, property_area: e.target.value })}
                                                        className="flex-1"
                                                    />
                                                    <Select
                                                        label="Unit"
                                                        options={[{ value: "sq_ft", label: "Sq Ft" }, { value: "sq_m", label: "Sq M" }, { value: "acres", label: "Acres" }]}
                                                        value={formData.property_area_unit}
                                                        onChange={(e) => setFormData({ ...formData, property_area_unit: e.target.value })}
                                                        className="w-24"
                                                    />
                                                </div>
                                                <Input
                                                    label="Registration Number"
                                                    value={formData.registration_number}
                                                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.asset_type === 'vehicle' && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                                <Car className="h-4 w-4" /> Vehicle Details
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Registration Number"
                                                    value={formData.vehicle_registration}
                                                    onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
                                                />
                                                <Input
                                                    label="Make"
                                                    value={formData.vehicle_make}
                                                    onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                                                />
                                                <Input
                                                    label="Model"
                                                    value={formData.vehicle_model}
                                                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                                />
                                                <Input
                                                    label="Year"
                                                    type="number"
                                                    value={formData.vehicle_year}
                                                    onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 4: Loan */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-2">
                                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <FileText className="h-4 w-4" /> Loan Information
                                            </h4>
                                            <div className="ml-auto flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_under_loan"
                                                    checked={formData.is_under_loan}
                                                    onChange={(e) => setFormData({ ...formData, is_under_loan: e.target.checked })}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <label htmlFor="is_under_loan" className="text-sm text-slate-700 dark:text-slate-300">
                                                    Asset is under loan?
                                                </label>
                                            </div>
                                        </div>
                                        {formData.is_under_loan && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/50 p-4 rounded-lg">
                                                <Input
                                                    label="Loan Provider"
                                                    value={formData.loan_provider}
                                                    onChange={(e) => setFormData({ ...formData, loan_provider: e.target.value })}
                                                />
                                                <Input
                                                    label="Outstanding Amount"
                                                    type="number"
                                                    value={formData.loan_outstanding}
                                                    onChange={(e) => setFormData({ ...formData, loan_outstanding: e.target.value })}
                                                />
                                                <Input
                                                    label="Monthly EMI"
                                                    type="number"
                                                    value={formData.loan_emi}
                                                    onChange={(e) => setFormData({ ...formData, loan_emi: e.target.value })}
                                                />
                                                <Input
                                                    label="Loan End Date"
                                                    type="date"
                                                    value={formData.loan_end_date}
                                                    onChange={(e) => setFormData({ ...formData, loan_end_date: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 5: Ownership & Notes */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                                            <Users className="h-4 w-4" /> Ownership & Notes
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Ownership Type"
                                                options={[{ value: "sole", label: "Sole" }, { value: "joint", label: "Joint" }, { value: "inherited", label: "Inherited" }]}
                                                value={formData.ownership_type}
                                                onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                                            />
                                            {formData.ownership_type !== 'sole' && (
                                                <>
                                                    <Input
                                                        label="Ownership %"
                                                        type="number"
                                                        value={formData.ownership_percentage}
                                                        onChange={(e) => setFormData({ ...formData, ownership_percentage: e.target.value })}
                                                    />
                                                    <Input
                                                        label="Co-owner Names"
                                                        placeholder="Comma separated"
                                                        value={formData.co_owner_names}
                                                        onChange={(e) => setFormData({ ...formData, co_owner_names: e.target.value })}
                                                    />
                                                </>
                                            )}
                                            <Input
                                                label="Location / City"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                            <Input
                                                label="Notes"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title={editingId ? "Quick Updates" : "Quick Selection"}
                                        subtitle="Standardized asset presets"
                                        items={[
                                            ...assetTypes.map(type => ({ value: type, label: type, category: 'Type' })),
                                            ...assetCategories.map(cat => ({ value: cat, label: cat, category: 'Category' })),
                                            ...assetStatus.map(s => ({ value: s, label: s, category: 'Status' })),
                                            ...ownershipTypes.map(o => ({ value: o, label: o, category: 'Ownership' })),
                                            ...assetNotes.map(n => ({ value: n, label: n, category: 'Notes' }))
                                        ]}
                                        onSelect={handleQuickPick}
                                    />
                                </div>


                            </div>

                            {/* Document Upload - only when editing */}
                            {editingId && (
                                <EntityDocumentUpload
                                    entityType="asset"
                                    entityId={editingId}
                                />
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10" disabled={submitting}>
                                    {submitting ? "Saving..." : editingId ? "Update Asset" : "Save Asset"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}
