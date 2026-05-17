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
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { TransactionsDialog } from "@/components/banking/TransactionsDialog";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { GridDocUpload } from "@/components/ui/GridDocUpload";
import { getIFSCDetails } from "@/src/lib/ifsc-service";
import { IFSC_REGEX, validateBankAccountNumber } from "@/src/lib/financialValidationRules";
import { Loader2, AlertCircle as AlertCircleIcon } from "lucide-react";
import { bankNames, bankingNotes } from "@/src/lib/presets";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { EntityDocumentsBadge } from "@/components/ui/EntityDocumentsBadge";
import { EntityDocumentUpload } from "@/components/ui/EntityDocumentUpload";
import { GridTable } from "@/components/ui/GridTable";

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
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Transactions Dialog State
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);

    // QuickPick State
    const [showBankPick, setShowBankPick] = useState(false);

    // Joint Holders State
    const [jointHolderCount, setJointHolderCount] = useState(0);
    const [jointHolders, setJointHolders] = useState<
        { name: string; relation?: string }[]
    >([]);

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
        city: "",
        state: "",
    });

    const [isFetchingIFSC, setIsFetchingIFSC] = useState(false);
    const [ifscLoaded, setIfscLoaded] = useState(false);
    const [detectedBank, setDetectedBank] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleQuickPick = (value: string, category?: string) => {
        setFormData(prev => {
            const updates: any = { ...prev };
            if (category === "Bank") updates.bank_name = value;
            else if (category === "Account Type") updates.account_type = value.toLowerCase().replace(/ /g, "_");
            else if (category === "Status") updates.status = value.toLowerCase();
            else if (category === "Notes") {
                const currentNotes = prev.notes ? prev.notes.split('\n').filter(n => n.trim()) : [];
                if (!currentNotes.includes(value)) {
                    updates.notes = [...currentNotes, value].join('\n');
                }
            } else {
                // Fallback for unlabeled/legacy
                updates.bank_name = value;
            }
            return updates;
        });

        // Trigger validation if bank changed
        if (category === "Bank" || !category) {
            const val = validateBankAccountNumber(value, formData.account_number);
            if (formData.account_number && !val.isValid) {
                setFieldErrors(prev => ({ ...prev, account_number: val.error! }));
            } else {
                setFieldErrors(prev => {
                    const n = { ...prev };
                    delete n.account_number;
                    return n;
                });
            }
        }
    };

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
            city: "",
            state: "",
        });
        setJointHolderCount(0);
        setJointHolders([]);
        setEditingId(null);
        setIfscLoaded(false);
        setDetectedBank(null);
        setFieldErrors({});
    };

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/banking/accounts", { cache: 'no-store' });
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
            city: account.city || "",
            state: account.state || "",
        });

        // Load joint holders
        if (account.joint_holders && account.joint_holders.length > 0) {
            setJointHolders(account.joint_holders);
            setJointHolderCount(account.joint_holders.length);
        } else if (account.joint_holder_name) {
            // Convert old format to new
            setJointHolders([{ name: account.joint_holder_name }]);
            setJointHolderCount(1);
        } else {
            setJointHolders([]);
            setJointHolderCount(0);
        }

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

    const handleAccountNumberChange = (value: string) => {
        setFormData(p => ({ ...p, account_number: value }));
        
        const validation = validateBankAccountNumber(formData.bank_name, value);
        if (!validation.isValid) {
            setFieldErrors(prev => ({ ...prev, account_number: validation.error! }));
        } else {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.account_number;
                return newErrors;
            });
        }
    };

    const handleIFSCChange = async (value: string) => {
        let upValue = value.toUpperCase();
        
        // Smart Extraction: Extract IFSC from string (e.g., if user pasted a search result sentence)
        const ifscMatch = upValue.match(/[A-Z]{4}0[A-Z0-9]{6}/);
        if (ifscMatch) {
            upValue = ifscMatch[0];
        }
        
        setFormData(p => ({ ...p, ifsc_code: upValue }));
        
        // Reset errors 
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.ifsc_code;
            return newErrors;
        });

        // 1. Partial/Starting Letter Validation
        if (upValue.length > 0) {
            // First 4 characters must be alphabetic (Bank Code)
            const prefix = upValue.substring(0, 4);
            if (!/^[A-Z]*$/.test(prefix)) {
                setFieldErrors(prev => ({ ...prev, ifsc_code: "Invalid IFSC Code: First 4 characters must be letters (Bank Code)" }));
                return;
            }
            
            // 5th character must be '0' if present
            if (upValue.length >= 5 && upValue[4] !== '0') {
                setFieldErrors(prev => ({ ...prev, ifsc_code: "Invalid IFSC Code: 5th character must be zero" }));
                return;
            }
            
            // Re-validate against full regex if length >= 11
            if (upValue.length > 11) {
                 setFieldErrors(prev => ({ ...prev, ifsc_code: "Invalid IFSC format: Maximum length is 11" }));
                 return;
            }
        }

        if (IFSC_REGEX.test(upValue)) {
            setIsFetchingIFSC(true);
            try {
                // Use internal API proxy to avoid CORS issues
                const response = await fetch(`/api/banking/ifsc/${upValue}`);
                if (response.ok) {
                    const details = await response.json();
                    const matchedBank = bankNames.find(b => 
                        b.toLowerCase().includes(details.BANK.toLowerCase()) || 
                        details.BANK.toLowerCase().includes(b.split(' (')[0].toLowerCase())
                    );

                    setFormData(p => {
                        const newFormData = {
                            ...p,
                            bank_name: matchedBank || details.BANK,
                            branch_name: details.BRANCH,
                            city: details.CITY,
                            state: details.STATE
                        };
                        
                        // Re-validate account number if it exists
                        if (newFormData.account_number) {
                            const validation = validateBankAccountNumber(newFormData.bank_name, newFormData.account_number);
                            if (!validation.isValid) {
                                setFieldErrors(prev => ({ ...prev, account_number: validation.error! }));
                            } else {
                                setFieldErrors(prev => {
                                    const n = { ...prev };
                                    delete n.account_number;
                                    return n;
                                });
                            }
                        }
                        
                        return newFormData;
                    });

                    setDetectedBank(matchedBank || details.BANK);
                    setIfscLoaded(true);
                } else {
                    setFieldErrors(prev => ({ ...prev, ifsc_code: "Invalid IFSC Code. Please check the starting letters." }));
                    setDetectedBank(null);
                    setIfscLoaded(false);
                }
            } catch (error) {
                setFieldErrors(prev => ({ ...prev, ifsc_code: "Failed to verify IFSC" }));
                setDetectedBank(null);
            } finally {
                setIsFetchingIFSC(false);
            }
        } else {
            setIfscLoaded(false);
            setDetectedBank(null);
            if (upValue.length >= 11) {
                setFieldErrors(prev => ({ ...prev, ifsc_code: "Invalid IFSC Code. Please check the starting letters." }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors: Record<string, string> = {};

        // 1. IFSC Check
        if (!IFSC_REGEX.test(formData.ifsc_code)) {
            errors.ifsc_code = "Invalid IFSC format";
        } else if (!ifscLoaded) {
            errors.ifsc_code = "IFSC code could not be verified online. Please check if it is correct.";
        } else if (detectedBank && formData.bank_name !== detectedBank) {
            // Check if selected bank matches detected bank
            errors.bank_name = "Selected bank does not match IFSC bank.";
        }

        // 2. Account Number Validation (Regex: ^\d+$)
        if (!/^\d+$/.test(formData.account_number)) {
            errors.account_number = "Account number must contain digits only.";
        } else {
            const accValidation = validateBankAccountNumber(formData.bank_name, formData.account_number);
            if (!accValidation.isValid) {
                errors.account_number = accValidation.error || "Invalid account number length for selected bank.";
            }
        }

        // 3. Bank Name Match Check
        // If IFSC was verified, bank_name should ideally be autofilled. 
        // If user manually changes it after, or if it doesn't match the expectation.
        // We'll trust our presets matching logic in handleIFSCChange, but if we want to be strict:
        // We need to store the detected bank name separately during handleIFSCChange to compare.
        // For now, let's just make sure they selected SOME bank and it's not "Unknown".

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            
            // Auto-scroll to first error
            const firstErrorKey = Object.keys(errors)[0];
            const element = document.getElementById(`bank-${firstErrorKey}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
            
            return;
        }

        setSubmitting(true);

        try {
            const url = editingId
                ? `/api/banking/accounts/${editingId}`
                : "/api/banking/accounts";
            const method = editingId ? "PATCH" : "POST";

            const payload = {
                ...formData,
                joint_holders: jointHolders.filter(h => h.name.trim() !== "")
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
                                    className="pl-9 bg-card"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-32 sm:w-48 shrink-0">
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    options={[
                                        { value: "all", label: "All Statuses" },
                                        ...STATUS_OPTIONS
                                    ]}
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
                                Add Account
                            </Button>
                        </div>
                    </div>

                    {/* Summary Card */}
                    {accounts.length > 0 && (
                        <div className="rounded-xl p-6 shadow-lg" style={{ background: 'var(--summary-card-bg)', color: 'hsl(var(--summary-card-text))' }}>
                            <p className="opacity-80 text-sm font-medium mb-1">Total Balance Across Accounts</p>
                            <h2 className="text-3xl font-bold">{formatCurrency(totalBalance)}</h2>
                            <p className="opacity-80 text-xs mt-2">
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
                    viewMode === "card" ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAccounts.map((account) => (
                                <Card key={account.id} className="relative hover:shadow-md transition-all sm:hover:-translate-y-1" padding="sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="icon-container h-8 w-8 bg-blue-50 dark:bg-blue-900/20">
                                                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <Badge variant={account.status === 'active' ? 'success' : 'secondary'}>
                                                {account.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-2">
                                            <h3 className="font-semibold text-foreground line-clamp-1">
                                                {account.bank_name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                    •••• {account.account_number.slice(-4)}
                                                </p>
                                                <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase tracking-wide">
                                                    {account.account_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-2 space-y-2">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Balance</p>
                                            <p className="text-xl font-bold text-foreground">
                                                {formatCurrency(account.current_balance)}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-400">IFSC</span>
                                                <div className="flex items-center gap-1 group/code cursor-pointer" onClick={() => handleCopy(account.ifsc_code, `ifsc-${account.id}`)}>
                                                    <span className="font-medium">{account.ifsc_code}</span>
                                                    {copiedId === `ifsc-${account.id}` ?
                                                        <Check className="h-3 w-3 text-primary" /> :
                                                        <Copy className="h-3 w-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-400">Holder</span>
                                                <span className="font-medium truncate">{account.account_holder_name.split(' ')[0]}</span>
                                            </div>
                                            {(account.branch_name || account.city) && (
                                                <div className="flex flex-col gap-1 col-span-2 mt-1">
                                                    <span className="text-slate-400">Location</span>
                                                    <span className="font-medium truncate">
                                                        {account.branch_name}{account.city ? `, ${account.city}` : ''}{account.state ? `, ${account.state}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {(account.net_banking_enabled || account.linked_mobile) && (
                                            <div className="flex gap-3 pt-1">
                                                {account.net_banking_enabled && (
                                                    <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full dark:bg-emerald-900/20 dark:text-accent">
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

                                        {/* Joint Holders Display */}
                                        {account.joint_holders && account.joint_holders.length > 0 && (
                                            <div className="pt-3 border-t border-border">
                                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Joint Holders</p>
                                                <div className="space-y-1">
                                                    {account.joint_holders.map((holder, idx) => (
                                                        <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            <span className="font-medium">{holder.name}</span>
                                                            {holder.relation && (
                                                                <span className="text-slate-400">({holder.relation})</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="pt-0 flex flex-wrap items-center justify-between gap-2 mt-auto">
                                        <div className="text-[10px] text-muted-foreground">
                                            {formatUpdatedLabel(account.updated_at || account.created_at)}
                                        </div>
                                        <div className="flex items-center gap-1 ml-auto">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedAccount(account);
                                                    setIsTransactionsOpen(true);
                                                }}
                                                className="h-8 gap-2 text-xs"
                                            >
                                                <Landmark className="h-3 w-3" /> Ledger
                                            </Button>
                                            <EntityDocumentsBadge
                                                entityType="bank_account"
                                                entityId={account.id}
                                            />
                                            <GridDocUpload
                                                entityType="bank_account"
                                                entityId={account.id}
                                            />
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(account)} className="h-8 w-8 p-0">
                                                <Edit2 className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)} className="h-8 w-8 p-0 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <GridTable
                            items={filteredAccounts}
                            columns={[
                                {
                                    key: 'bank_name', label: 'Bank', render: (a) => (
                                        <div>
                                            <span className="font-medium text-foreground">{a.bank_name}</span>
                                            <span className="block text-xs text-slate-500">•••• {a.account_number.slice(-4)}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'account_type', label: 'Type', render: (a) => (
                                        <Badge variant="outline" className="text-xs capitalize">{a.account_type.replace('_', ' ')}</Badge>
                                    )
                                },
                                {
                                    key: 'current_balance', label: 'Balance', render: (a) => (
                                        <span className="font-semibold text-foreground">{formatCurrency(a.current_balance)}</span>
                                    )
                                },
                                { key: 'ifsc_code', label: 'IFSC', hideMobile: true },
                                {
                                    key: 'status', label: 'Status', render: (a) => (
                                        <Badge variant={a.status === 'active' ? 'success' : 'secondary'} className="text-xs">{a.status}</Badge>
                                    ), hideMobile: true
                                },
                            ]}
                            onEdit={handleEdit}
                            onDelete={(a) => handleDelete(a.id)}
                            renderDocUpload={(a) => (
                                <GridDocUpload entityType="bank_account" entityId={a.id} />
                            )}
                            renderExtraActions={(a) => (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedAccount(a);
                                        setIsTransactionsOpen(true);
                                    }}
                                    className="h-8 px-2 text-xs gap-1"
                                >
                                    <Landmark className="h-3 w-3" /> Ledger
                                </Button>
                            )}
                        />
                    )
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
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
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
                                                                setFormData((p) => {
                                                                    const newFormData = { ...p, bank_name: value };
                                                                    // Re-validate account number if it exists
                                                                    if (newFormData.account_number) {
                                                                        const val = validateBankAccountNumber(newFormData.bank_name, newFormData.account_number);
                                                                        if (!val.isValid) {
                                                                            setFieldErrors(prev => ({ ...prev, account_number: val.error! }));
                                                                        } else {
                                                                            setFieldErrors(prev => {
                                                                                const n = { ...prev };
                                                                                delete n.account_number;
                                                                                return n;
                                                                            });
                                                                        }
                                                                    }
                                                                    return newFormData;
                                                                });
                                                                setShowBankPick(false);
                                                            }}
                                                        />
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                            <Input
                                                id="bank-bank_name"
                                                placeholder="e.g. HDFC Bank"
                                                value={formData.bank_name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData(p => {
                                                        const newFormData = { ...p, bank_name: val };
                                                        // Re-validate account number if it exists
                                                        if (newFormData.account_number) {
                                                            const validation = validateBankAccountNumber(newFormData.bank_name, newFormData.account_number);
                                                            if (!validation.isValid) {
                                                                setFieldErrors(prev => ({ ...prev, account_number: validation.error! }));
                                                            } else {
                                                                setFieldErrors(prev => {
                                                                    const n = { ...prev };
                                                                    delete n.account_number;
                                                                    return n;
                                                                });
                                                            }
                                                        }
                                                        return newFormData;
                                                    });
                                                }}
                                                required
                                                disabled={ifscLoaded}
                                            />
                                            {fieldErrors.bank_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.bank_name}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Input
                                                id="bank-account_number"
                                                label="Account Number"
                                                value={formData.account_number}
                                                onChange={(e) => handleAccountNumberChange(e.target.value)}
                                                required
                                                className={fieldErrors.account_number ? "border-red-500" : ""}
                                            />
                                            {fieldErrors.account_number && (
                                                <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                                    <AlertCircleIcon className="h-3 w-3" />
                                                    {fieldErrors.account_number}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Input
                                                id="bank-ifsc_code"
                                                label="IFSC Code"
                                                placeholder="e.g. HDFC0001234"
                                                value={formData.ifsc_code}
                                                onChange={(e) => handleIFSCChange(e.target.value)}
                                                required
                                                className={fieldErrors.ifsc_code ? "border-red-500" : ""}
                                            />
                                            {isFetchingIFSC && (
                                                <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Fetching bank details...
                                                </div>
                                            )}
                                            {ifscLoaded && !fieldErrors.ifsc_code && (
                                                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                                    <CheckCircle className="h-3 w-3" />
                                                    IFSC Verified Successfully
                                                </div>
                                            )}
                                            {fieldErrors.ifsc_code && (
                                                <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                                    <AlertCircleIcon className="h-3 w-3" />
                                                    {fieldErrors.ifsc_code}
                                                </div>
                                            )}
                                        </div>
                                        <Input
                                            label="Branch Name"
                                            placeholder="e.g. Indiranagar"
                                            value={formData.branch_name}
                                            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                            disabled={ifscLoaded}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="City"
                                                placeholder="e.g. Bangalore"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                disabled={ifscLoaded}
                                            />
                                            <Input
                                                label="State"
                                                placeholder="e.g. Karnataka"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                disabled={ifscLoaded}
                                            />
                                        </div>
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
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
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
                                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
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

                                        {/* Dynamic Joint Holders */}
                                        <div className="space-y-3">
                                            <Select
                                                label="How many joint holders?"
                                                options={[
                                                    { value: "0", label: "0" },
                                                    { value: "1", label: "1" },
                                                    { value: "2", label: "2" },
                                                    { value: "3", label: "3" },
                                                ]}
                                                value={String(jointHolderCount)}
                                                onChange={(e) => {
                                                    const count = Number(e.target.value);
                                                    setJointHolderCount(count);
                                                    setJointHolders(Array.from({ length: count }, (_, i) =>
                                                        jointHolders[i] || { name: "", relation: "" }
                                                    ));
                                                }}
                                            />
                                            {Array.from({ length: jointHolderCount }).map((_, idx) => (
                                                <div key={idx} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                    <p className="text-xs font-medium text-muted-foreground">Joint Holder {idx + 1}</p>
                                                    <Input
                                                        placeholder="Name"
                                                        value={jointHolders[idx]?.name || ""}
                                                        onChange={(e) => {
                                                            const updated = [...jointHolders];
                                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                                            setJointHolders(updated);
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder="Relation (optional)"
                                                        value={jointHolders[idx]?.relation || ""}
                                                        onChange={(e) => {
                                                            const updated = [...jointHolders];
                                                            updated[idx] = { ...updated[idx], relation: e.target.value };
                                                            setJointHolders(updated);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <Input
                                            label="Nominee Name"
                                            value={formData.account_nominee_name}
                                            onChange={(e) => setFormData({ ...formData, account_nominee_name: e.target.value })}
                                        />
                                    </div>

                                    {/* Section: Balance & Extras */}
                                    <div className="space-y-4 pt-2 border-t border-border">
                                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
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
                                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="net_banking" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Net Banking Enabled
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title="Account Presets"
                                        subtitle="Quick fill bank, account type, or status"
                                        items={[
                                            ...bankNames.map(b => ({ label: b, value: b, category: "Bank" })),
                                            ...ACCOUNT_TYPES.map(t => ({ label: t.label, value: t.label, category: "Account Type" })),
                                            ...STATUS_OPTIONS.map(s => ({ label: s.label, value: s.label, category: "Status" })),
                                            ...bankingNotes.map(n => ({ label: n, value: n, category: "Notes" }))
                                        ]}
                                        onSelect={handleQuickPick}
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

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10" disabled={submitting || (!!fieldErrors.ifsc_code && formData.ifsc_code.length > 0)}>
                                    {submitting ? "Saving..." : editingId ? "Update Account" : "Save Account"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Transactions/Ledger Dialog */}
                <TransactionsDialog
                    account={selectedAccount}
                    open={isTransactionsOpen}
                    onOpenChange={setIsTransactionsOpen}
                    onUpdate={fetchAccounts}
                />
            </div>
        </DashboardShell>
    );
}
