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
    DialogFooter
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import {
    Users,
    Plus,
    Filter,
    Search,
    Edit2,
    Trash2,
    ArrowDownLeft,
    Calendar,
    Phone,
    Mail,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    Sparkles,
    MessageCircle,
    Calculator,
    Copy,
    ChevronDown
} from "lucide-react";
import type { Receivable } from "@/lib/types";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { receivableRelationships, receivablePurposes, receivableStatus, interestTypes } from "@/src/lib/presets";
import { getInterestPreview } from "@/lib/interest";
import { openWhatsApp, openSMS, copyReminder, getReminderModes, type ReminderMode } from "@/lib/reminders";
import { formatUpdatedAt } from "@/lib/dateUtils";
import { toast } from "sonner";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";
import { EntityDocumentsBadge } from "@/components/ui/EntityDocumentsBadge";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { GridTable } from "@/components/ui/GridTable";
import { GridDocUpload } from "@/components/ui/GridDocUpload";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

// Constants
const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "partial", label: "Partially Received" },
    { value: "received", label: "Received (Complete)" },
    { value: "written_off", label: "Written Off" },
    { value: "disputed", label: "Disputed" },
];

const INTEREST_TYPE_OPTIONS = [
    { value: "simple", label: "Simple Interest (Daily)" },
    { value: "compound", label: "Compound Interest (Monthly)" },
];

export default function ReceivablesPage() {
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [receiveAmount, setReceiveAmount] = useState("");
    const [interestPreview, setInterestPreview] = useState<any>(null);
    const [reminderMode, setReminderMode] = useState<ReminderMode>("polite");

    // QuickPick State
    const [showRelationshipPick, setShowRelationshipPick] = useState(false);
    const [showPurposePick, setShowPurposePick] = useState(false);
    const [showStatusPick, setShowStatusPick] = useState(false);
    const [showInterestTypePick, setShowInterestTypePick] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        given_to: "",
        relationship: "",
        contact_number: "",
        email: "",
        principal_amount: "",
        interest_rate: "",
        interest_type: "simple" as "simple" | "compound",
        interest_start_date: "",
        interest_end_date: "",
        total_receivable: "",
        amount_received: "0",
        given_date: new Date().toISOString().split("T")[0],
        expected_return_date: "",
        purpose: "",
        status: "pending",
        has_written_agreement: false,
        agreement_reference: "",
        reminder_enabled: false,
        notes: "",
    });

    const resetForm = () => {
        setFormData({
            given_to: "",
            relationship: "",
            contact_number: "",
            email: "",
            principal_amount: "",
            interest_rate: "",
            interest_type: "simple",
            interest_start_date: "",
            interest_end_date: "",
            total_receivable: "",
            amount_received: "0",
            given_date: new Date().toISOString().split("T")[0],
            expected_return_date: "",
            purpose: "",
            status: "pending",
            has_written_agreement: false,
            agreement_reference: "",
            reminder_enabled: false,
            notes: "",
        });
        setEditingId(null);
        setInterestPreview(null);
    };

    // Calculate interest preview when relevant fields change
    useEffect(() => {
        const { principal_amount, interest_rate, interest_type, interest_start_date, interest_end_date } = formData;

        if (principal_amount && interest_rate && Number(interest_rate) > 0) {
            const startDate = interest_start_date || formData.given_date;
            const preview = getInterestPreview(
                Number(principal_amount),
                Number(interest_rate),
                interest_type,
                startDate,
                interest_end_date || undefined
            );
            setInterestPreview(preview);
        } else {
            setInterestPreview(null);
        }
    }, [formData.principal_amount, formData.interest_rate, formData.interest_type, formData.interest_start_date, formData.interest_end_date, formData.given_date]);

    const fetchReceivables = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/receivables");
            if (res.ok) {
                const data = await res.json();
                setReceivables(data.receivables || []);
            }
        } catch (error) {
            console.error("Failed to fetch receivables:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReceivables();
    }, [fetchReceivables]);

    const handleEdit = (rec: Receivable) => {
        setFormData({
            given_to: rec.given_to,
            relationship: rec.relationship || "",
            contact_number: rec.contact_number || "",
            email: rec.email || "",
            principal_amount: String(rec.principal_amount),
            interest_rate: rec.interest_rate ? String(rec.interest_rate) : "",
            interest_type: rec.interest_type || "simple",
            interest_start_date: rec.interest_start_date || "",
            interest_end_date: rec.interest_end_date || "",
            total_receivable: String(rec.total_receivable),
            amount_received: String(rec.amount_received),
            given_date: rec.given_date,
            expected_return_date: rec.expected_return_date || "",
            purpose: rec.purpose || "",
            status: rec.status,
            has_written_agreement: !!rec.has_written_agreement,
            agreement_reference: rec.agreement_reference || "",
            reminder_enabled: !!rec.reminder_enabled,
            notes: rec.notes || "",
        });
        setEditingId(rec.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this record? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/receivables/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setReceivables((prev) => prev.filter((r) => r.id !== id));
            } else {
                alert("Failed to delete receivable");
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
                ? `/api/receivables/${editingId}`
                : "/api/receivables";
            const method = editingId ? "PATCH" : "POST";

            const principal = Number(formData.principal_amount);
            const rate = formData.interest_rate ? Number(formData.interest_rate) : null;

            // Use preview total if available, otherwise use form total or principal
            let total = principal;
            if (interestPreview) {
                total = interestPreview.total;
            } else if (formData.total_receivable) {
                total = Number(formData.total_receivable);
            }

            const payload = {
                ...formData,
                principal_amount: principal,
                interest_rate: rate,
                interest_type: rate && rate > 0 ? formData.interest_type : null,
                interest_start_date: rate && rate > 0 ? (formData.interest_start_date || formData.given_date) : null,
                interest_end_date: rate && rate > 0 ? formData.interest_end_date : null,
                total_receivable: total,
                amount_received: Number(formData.amount_received),
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchReceivables();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save receivable");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickReceive = async () => {
        if (!selectedReceivable || !receiveAmount) return;
        setSubmitting(true);
        try {
            const amountToAdd = Number(receiveAmount);
            const newTotalReceived = selectedReceivable.amount_received + amountToAdd;

            if (newTotalReceived > selectedReceivable.total_receivable) {
                alert("Total received cannot exceed total receivable amount");
                setSubmitting(false);
                return;
            }

            const res = await fetch(`/api/receivables/${selectedReceivable.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount_received: newTotalReceived }),
            });

            if (res.ok) {
                setIsReceiveOpen(false);
                setReceiveAmount("");
                setSelectedReceivable(null);
                fetchReceivables();
            } else {
                const error = await res.json();
                alert(error.error || "Failed updates");
            }
        } catch (error) {
            console.error("Receive error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const openReceiveModal = (rec: Receivable) => {
        setSelectedReceivable(rec);
        setReceiveAmount("");
        setIsReceiveOpen(true);
    };

    const handleReminderAction = (rec: Receivable, action: 'whatsapp' | 'sms' | 'copy') => {
        const reminderData = {
            name: rec.given_to,
            phone: rec.contact_number || undefined,
            outstanding: rec.outstanding_amount,
            dueDate: rec.expected_return_date || undefined,
            // TODO: Add UPI from user profile/settings if available
            upiId: undefined
        };

        switch (action) {
            case 'whatsapp':
                openWhatsApp(reminderData, reminderMode);
                break;
            case 'sms':
                openSMS(reminderData, reminderMode);
                break;
            case 'copy':
                copyReminder(reminderData, reminderMode);
                break;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filteredReceivables = receivables.filter(r => {
        const matchesSearch =
            r.given_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.purpose && r.purpose.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = filterStatus === "all" || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalReceivable = receivables.reduce((sum, r) => sum + r.total_receivable, 0);
    const totalReceived = receivables.reduce((sum, r) => sum + r.amount_received, 0);
    const totalOutstanding = receivables.reduce((sum, r) => sum + r.outstanding_amount, 0);

    // Overdue count (only active ones)
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = receivables.filter(r =>
        r.status !== 'received' &&
        r.status !== 'written_off' &&
        r.expected_return_date &&
        r.expected_return_date < today
    ).length;

    return (
        <DashboardShell
            title="Receivables"
            description="Track money you lent and payment recovery"
        >
            <div className="space-y-6">
                {/* Stats */}
                {receivables.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 Ig:grid-cols-4 gap-4">
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Receivable</p>
                            <h2 className="text-2xl font-bold text-foreground">{formatCurrency(totalReceivable)}</h2>
                        </div>
                        <div className="bg-primary/10 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                            <p className="text-primary dark:text-accent text-xs font-medium uppercase tracking-wider mb-1">Total Received</p>
                            <h2 className="text-2xl font-bold text-primary dark:text-emerald-300">{formatCurrency(totalReceived)}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Pending Collection</p>
                            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalOutstanding)}</h2>
                        </div>
                        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Overdue Records</p>
                            <h2 className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-foreground'}`}>
                                {overdueCount}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-1 w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search by name, purpose..."
                                className="pl-9 bg-card"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            options={[{ value: "all", label: "All Status" }, ...STATUS_OPTIONS]}
                            className="w-[160px]"
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
                            Add Receivable
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredReceivables.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={Users}
                            title={searchQuery ? "No matching records found" : "No receivables added"}
                            description="Keep track of money you've lent to friends, family, or others."
                            action={searchQuery ? undefined : {
                                label: "Add First Receivable",
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
                            {filteredReceivables.map((rec) => {
                                const isOverdue = rec.expected_return_date && rec.expected_return_date < today && rec.status !== 'received';
                                const percentReceived = Math.min((rec.amount_received / rec.total_receivable) * 100, 100);
                                const hasInterest = rec.interest_amount && rec.interest_amount > 0;

                                return (
                                    <Card key={rec.id} className="relative hover:shadow-md transition-all sm:hover:-translate-y-1">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-semibold">
                                                        {rec.given_to.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-foreground line-clamp-1">
                                                            {rec.given_to}
                                                        </h3>
                                                        {rec.relationship && <p className="text-xs text-slate-500">{rec.relationship}</p>}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={rec.status === 'received' ? 'success' : isOverdue ? 'destructive' : 'secondary'}
                                                    className="capitalize"
                                                >
                                                    {isOverdue && rec.status !== 'received' ? 'Overdue' : rec.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3 space-y-4">
                                            {hasInterest ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">Principal:</span>
                                                        <span className="font-medium">{formatCurrency(rec.principal_amount)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">Interest:</span>
                                                        <span className="font-medium text-blue-600">{formatCurrency(rec.interest_amount || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm border-t pt-1">
                                                        <span className="text-slate-500">Total:</span>
                                                        <span className="font-semibold">{formatCurrency(rec.total_receivable)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-end mb-1">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Receivable</p>
                                                    <p className="text-sm font-medium text-foreground">{formatCurrency(rec.total_receivable)}</p>
                                                </div>
                                            )}

                                            <div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${rec.status === 'received' ? 'bg-primary' : 'bg-blue-500'}`}
                                                        style={{ width: `${percentReceived}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                    <span>Rec: {formatCurrency(rec.amount_received)}</span>
                                                    <span>Bal: {formatCurrency(rec.outstanding_amount)}</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
                                                {rec.expected_return_date && (
                                                    <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        Exp. Return: {new Date(rec.expected_return_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {rec.contact_number && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3" />
                                                        {rec.contact_number}
                                                    </div>
                                                )}
                                                {rec.purpose && (
                                                    <div className="flex items-center gap-2 italic text-slate-500">
                                                        <FileText className="h-3 w-3" />
                                                        {rec.purpose}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex flex-col gap-3 mt-auto">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatUpdatedAt(rec.updated_at || rec.created_at)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {rec.status !== 'received' && rec.status !== 'written_off' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs border-emerald-200 text-primary hover:bg-primary/10 hover:text-emerald-800 mr-1"
                                                            onClick={() => openReceiveModal(rec)}
                                                        >
                                                            <ArrowDownLeft className="h-3 w-3 mr-1" /> Receive
                                                        </Button>
                                                    )}
                                                    <EntityDocumentsBadge
                                                        entityType="receivable"
                                                        entityId={rec.id}
                                                    />
                                                    <GridDocUpload
                                                        entityType="receivable"
                                                        entityId={rec.id}
                                                    />
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(rec)} className="h-8 w-8 p-0">
                                                        <Edit2 className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rec.id)} className="h-8 w-8 p-0 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {rec.contact_number && rec.outstanding_amount > 0 ? (
                                                <TooltipProvider>
                                                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                                                        <div className="flex gap-1 flex-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:-translate-y-0.5 transition-all"
                                                                        onClick={() => handleReminderAction(rec, 'whatsapp')}
                                                                    >
                                                                        <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Send WhatsApp Reminder</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 hover:-translate-y-0.5 transition-all"
                                                                        onClick={() => handleReminderAction(rec, 'sms')}
                                                                    >
                                                                        <Phone className="h-3 w-3 mr-1" /> SMS
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Send SMS Reminder</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs text-slate-600 hover:text-slate-800 hover:-translate-y-0.5 transition-all"
                                                                        onClick={() => handleReminderAction(rec, 'copy')}
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Copy Reminder Text</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
                                                                    <ChevronDown className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {getReminderModes().map((mode) => (
                                                                    <DropdownMenuItem
                                                                        key={mode.value}
                                                                        onClick={() => setReminderMode(mode.value)}
                                                                        className={reminderMode === mode.value ? "bg-blue-50 text-blue-700" : ""}
                                                                    >
                                                                        {mode.label}
                                                                        {reminderMode === mode.value && " ✓"}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TooltipProvider>
                                            ) : (
                                                <div className="pt-2 border-t border-border">
                                                    <p className="text-xs text-slate-400 text-center italic">
                                                        {!rec.contact_number ? "Add phone number to send reminders" : "No pending amount"}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="text-xs text-muted-foreground mt-2">
                                                {formatUpdatedAt(rec.updated_at || rec.created_at)}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <GridTable
                            items={filteredReceivables}
                            columns={[
                                {
                                    key: 'given_to', label: 'Person', render: (r) => (
                                        <div>
                                            <span className="font-medium text-foreground">{r.given_to}</span>
                                            <span className="block text-xs text-slate-500">{r.relationship || r.purpose || ''}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'total_receivable', label: 'Total', render: (r) => (
                                        <span className="font-semibold text-foreground">{formatCurrency(r.total_receivable)}</span>
                                    )
                                },
                                {
                                    key: 'outstanding_amount', label: 'Pending', render: (r) => (
                                        <span className={r.outstanding_amount > 0 ? 'text-red-600 font-medium' : 'text-primary'}>
                                            {formatCurrency(r.outstanding_amount)}
                                        </span>
                                    )
                                },
                                {
                                    key: 'expected_return_date', label: 'Due', render: (r) => (
                                        <span className="text-xs">{r.expected_return_date ? new Date(r.expected_return_date).toLocaleDateString() : '—'}</span>
                                    ), hideMobile: true
                                },
                                {
                                    key: 'status', label: 'Status', render: (r) => {
                                        const isOverdue = r.expected_return_date && r.expected_return_date < today && r.status !== 'received';
                                        return <Badge variant={r.status === 'received' ? 'success' : isOverdue ? 'destructive' : 'secondary'} className="text-xs capitalize">
                                            {isOverdue ? 'Overdue' : r.status.replace('_', ' ')}
                                        </Badge>;
                                    }, hideMobile: true
                                },
                            ]}
                            onEdit={handleEdit}
                            onDelete={(r) => handleDelete(r.id)}
                            renderDocBadge={(r) => (
                                <EntityDocumentsBadge entityType="receivable" entityId={r.id} />
                            )}
                            renderDocUpload={(r) => (
                                <GridDocUpload entityType="receivable" entityId={r.id} />
                            )}
                            renderExtraActions={(r) => (
                                r.status !== 'received' && r.status !== 'written_off' ? (
                                    <Button variant="ghost" size="sm" onClick={() => openReceiveModal(r)} className="h-8 px-2 text-xs gap-1 text-primary">
                                        <ArrowDownLeft className="h-3 w-3" /> Rec
                                    </Button>
                                ) : null
                            )}
                        />
                    )
                )}

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Record" : "Add Receivable"}</DialogTitle>
                            <DialogDescription>
                                Track money you lent out with interest calculations.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {/* Basics */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Given To (Name)"
                                            placeholder="e.g. John Doe"
                                            value={formData.given_to}
                                            onChange={(e) => setFormData({ ...formData, given_to: e.target.value })}
                                            required
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Relationship</label>
                                                <Sheet open={showRelationshipPick} onOpenChange={setShowRelationshipPick}>
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
                                                            title="Select Relationship"
                                                            subtitle="Common relationships"
                                                            items={receivableRelationships.map(rel => ({ value: rel, label: rel }))}
                                                            onSelect={(value) => {
                                                                setFormData((p) => ({ ...p, relationship: value }));
                                                                setShowRelationshipPick(false);
                                                            }}
                                                        />
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                            <Input
                                                placeholder="e.g. Friend, Cousin"
                                                value={formData.relationship}
                                                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                            />
                                        </div>
                                        <Input
                                            label="Contact Number"
                                            value={formData.contact_number}
                                            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                        />
                                        <Input
                                            label="Email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    {/* Money */}
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <h4 className="text-sm font-medium">Financial Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Principal Given"
                                                type="number"
                                                value={formData.principal_amount}
                                                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="Interest Rate (%)"
                                                type="number"
                                                step="0.01"
                                                value={formData.interest_rate}
                                                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                            />
                                            <Select
                                                label="Interest Type"
                                                value={formData.interest_type}
                                                onChange={(e) => setFormData({ ...formData, interest_type: e.target.value as "simple" | "compound" })}
                                                options={INTEREST_TYPE_OPTIONS}
                                            />
                                            <Input
                                                label="Interest Start Date"
                                                type="date"
                                                value={formData.interest_start_date}
                                                onChange={(e) => setFormData({ ...formData, interest_start_date: e.target.value })}
                                                placeholder="Defaults to given date"
                                            />
                                            <Input
                                                label="Interest End Date (Optional)"
                                                type="date"
                                                value={formData.interest_end_date}
                                                onChange={(e) => setFormData({ ...formData, interest_end_date: e.target.value })}
                                                placeholder="Leave empty for current date"
                                            />
                                            {editingId && (
                                                <Input
                                                    label="Amount Received So Far"
                                                    type="number"
                                                    value={formData.amount_received}
                                                    onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                                                />
                                            )}
                                        </div>

                                        {/* Interest Preview */}
                                        {interestPreview && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Calculator className="h-4 w-4 text-blue-600" />
                                                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">Interest Calculation Preview</h5>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Principal:</span>
                                                        <span className="ml-2 font-medium">{formatCurrency(Number(formData.principal_amount))}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Interest:</span>
                                                        <span className="ml-2 font-medium text-blue-600">{formatCurrency(interestPreview.interest)}</span>
                                                    </div>
                                                    <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                                                        <span className="text-muted-foreground">Total Receivable:</span>
                                                        <span className="ml-2 font-semibold text-lg">{formatCurrency(interestPreview.total)}</span>
                                                    </div>
                                                    <div className="col-span-2 text-xs text-slate-500">
                                                        {formData.interest_type === 'compound'
                                                            ? `Calculated over ${interestPreview.months} months (compound monthly)`
                                                            : `Calculated over ${interestPreview.days} days (simple daily)`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Manual Total Override */}
                                        <Input
                                            label="Total Expected Return (Override)"
                                            type="number"
                                            placeholder={interestPreview ? `Auto-calculated: ${formatCurrency(interestPreview.total)}` : "Same as principal if no interest"}
                                            value={formData.total_receivable}
                                            onChange={(e) => setFormData({ ...formData, total_receivable: e.target.value })}
                                        />
                                    </div>

                                    {/* Dates & Other */}
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Date Given"
                                                type="date"
                                                value={formData.given_date}
                                                onChange={(e) => setFormData({ ...formData, given_date: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="Expected Return Date"
                                                type="date"
                                                value={formData.expected_return_date}
                                                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                                            />
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Purpose</label>
                                                    <Sheet open={showPurposePick} onOpenChange={setShowPurposePick}>
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
                                                                title="Select Purpose"
                                                                subtitle="Common purposes for lending"
                                                                items={receivablePurposes.map(purpose => ({ value: purpose, label: purpose }))}
                                                                onSelect={(value) => {
                                                                    setFormData((p) => ({ ...p, purpose: value }));
                                                                    setShowPurposePick(false);
                                                                }}
                                                            />
                                                        </SheetContent>
                                                    </Sheet>
                                                </div>
                                                <Input
                                                    value={formData.purpose}
                                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                                    className="md:col-span-2"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="has_agreement"
                                                    checked={formData.has_written_agreement}
                                                    onChange={(e) => setFormData({ ...formData, has_written_agreement: e.target.checked })}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                                />
                                                <label htmlFor="has_agreement" className="text-sm text-slate-700 dark:text-slate-300">
                                                    Has written agreement?
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="reminder"
                                                    checked={formData.reminder_enabled}
                                                    onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                                />
                                                <label htmlFor="reminder" className="text-sm text-slate-700 dark:text-slate-300">
                                                    Enable reminders?
                                                </label>
                                            </div>
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
                                        title="Quick Receivable Selection"
                                        subtitle="Relationships, purposes, and interest types"
                                        items={[
                                            ...receivableRelationships.map(rel => ({ value: rel, label: `👥 ${rel}`, category: 'Relationship' })),
                                            ...receivablePurposes.map(purpose => ({ value: purpose, label: `🏷️ ${purpose}`, category: 'Purpose' })),
                                            ...receivableStatus.map(status => ({ value: status.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: `📊 ${status}`, category: 'Status' })),
                                            ...interestTypes.map(type => ({ value: type.toLowerCase(), label: `💰 ${type} Interest`, category: 'Interest' }))
                                        ]}
                                        onSelect={(value) => {
                                            const relationshipItem = receivableRelationships.find(rel => rel === value);
                                            const purposeItem = receivablePurposes.find(purpose => purpose === value);
                                            const statusItem = receivableStatus.find(status => status.toLowerCase().replace(/[^a-z0-9]/g, '_') === value);
                                            const interestItem = interestTypes.find(type => type.toLowerCase() === value);

                                            if (relationshipItem) {
                                                setFormData(p => ({ ...p, relationship: value }));
                                            } else if (purposeItem) {
                                                setFormData(p => ({ ...p, purpose: value }));
                                            } else if (statusItem) {
                                                setFormData(p => ({ ...p, status: value }));
                                            } else if (interestItem) {
                                                setFormData(p => ({ ...p, interest_type: value as "simple" | "compound" }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Document Upload - only when editing */}
                            {editingId && (
                                <EntityDocumentUpload
                                    entityType="receivable"
                                    entityId={editingId}
                                />
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10" disabled={submitting}>
                                    {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Receive Payment Modal */}
                <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Receive Payment</DialogTitle>
                            <DialogDescription>
                                Add a received amount for {selectedReceivable?.given_to}.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedReceivable && (
                            <div className="py-4 space-y-4">
                                <div className="bg-background rounded p-3 text-sm">
                                    {selectedReceivable.interest_amount && selectedReceivable.interest_amount > 0 ? (
                                        <>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-500">Principal:</span>
                                                <span className="font-medium">{formatCurrency(selectedReceivable.principal_amount)}</span>
                                            </div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-500">Interest:</span>
                                                <span className="font-medium text-blue-600">{formatCurrency(selectedReceivable.interest_amount || 0)}</span>
                                            </div>
                                            <div className="flex justify-between mb-1 border-t pt-1">
                                                <span className="text-slate-500">Total Receivable:</span>
                                                <span className="font-semibold">{formatCurrency(selectedReceivable.total_receivable)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-500">Total Receivable:</span>
                                            <span className="font-medium">{formatCurrency(selectedReceivable.total_receivable)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-500">Already Received:</span>
                                        <span className="font-medium">{formatCurrency(selectedReceivable.amount_received)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                                        <span className="text-slate-500">Pending:</span>
                                        <span className="font-bold text-blue-600">{formatCurrency(selectedReceivable.outstanding_amount)}</span>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="receive_amount">Amount Received Now</Label>
                                    <Input
                                        id="receive_amount"
                                        type="number"
                                        placeholder="Enter amount"
                                        value={receiveAmount}
                                        onChange={(e) => setReceiveAmount(e.target.value)}
                                        className="mt-1"
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        This will increase the total amount received.
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>Cancel</Button>
                            <Button onClick={handleQuickReceive} disabled={submitting || !receiveAmount} className="bg-primary hover:bg-primary/90 text-white">
                                {submitting ? "Processing..." : "Confirm Receipt"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}
