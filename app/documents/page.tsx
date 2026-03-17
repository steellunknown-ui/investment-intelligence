"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    DialogFooter
} from "@/components/ui/Dialog";
import {
    File,
    FileText,
    Image as ImageIcon,
    UploadCloud,
    Download,
    Link as LinkIcon,
    Trash2,
    Search,
    Archive,
    Filter,
    MoreVertical,
    CheckCircle2,
    X,
    FolderOpen,
    Sparkles
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/DropdownMenu";
import { documentTypes, indianDocuments } from "@/src/lib/presets";
import { formatUpdatedLabel, formatDateTime } from "@/src/lib/time";
import { DocumentViewerModal } from "@/components/documents/DocumentViewerModal";
import { QuickPickPanel } from "@/components/ui/QuickPickPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import type { DocumentFile, DocumentLink } from "@/lib/types";

// Constants
const DOC_TYPES = [
    { value: "invoice", label: "Invoice" },
    { value: "receipt", label: "Receipt" },
    { value: "contract", label: "Contract" },
    { value: "policy", label: "Insurance Policy" },
    { value: "id_proof", label: "ID Proof" },
    { value: "certificate", label: "Certificate" },
    { value: "report", label: "Report" },
    { value: "other", label: "Other" },
];

const ENTITY_TYPES = [
    { value: "insurance_policy", label: "Insurance Policy" },
    { value: "bank_account", label: "Bank Account" },
    { value: "asset", label: "Asset" },
    { value: "liability", label: "Liability" },
    { value: "receivable", label: "Receivable" },
    { value: "belonging", label: "Belonging" },
    { value: "nominee", label: "Nominee" },
];

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isLinkOpen, setIsLinkOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [showArchived, setShowArchived] = useState(false);

    const [showDocTypePick, setShowDocTypePick] = useState(false);
    const [showTitlePick, setShowTitlePick] = useState(false);

    // OTP Modal State
    const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
    const [selectedDocForOTP, setSelectedDocForOTP] = useState<DocumentFile | null>(null);
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");

    // Document Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerDoc, setViewerDoc] = useState<DocumentFile | null>(null);
    const [viewerUrl, setViewerUrl] = useState("");

    // Upload Form
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadForm, setUploadForm] = useState({
        title: "",
        document_type: "other",
        description: "",
        tags: ""
    });

    // Link Form
    const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
    const [linkForm, setLinkForm] = useState({
        entity_type: "insurance_policy",
        entity_id: "",
        link_description: "",
        is_primary: false
    });

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (showArchived) params.append("archived", "true");
            if (filterType !== "all") params.append("type", filterType);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/documents?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    }, [showArchived, filterType, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => fetchDocuments(), 300);
        return () => clearTimeout(timer);
    }, [fetchDocuments]);

    // Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setUploadFile(file);
            setUploadForm(prev => ({ ...prev, title: file.name }));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("title", uploadForm.title);
            formData.append("document_type", uploadForm.document_type);
            formData.append("description", uploadForm.description);
            formData.append("tags", uploadForm.tags);

            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                setIsUploadOpen(false);
                setUploadFile(null);
                setUploadForm({ title: "", document_type: "other", description: "", tags: "" });
                fetchDocuments();
            } else {
                const error = await res.json();
                alert(error.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: DocumentFile) => {
        try {
            const res = await fetch(`/api/documents/${doc.id}/download`);
            if (res.ok) {
                const { url } = await res.json();
                window.open(url, "_blank");
            } else {
                alert("Failed to get download link");
            }
        } catch (error) {
            console.error("Download error:", error);
        }
    };

    const handleViewDocument = async (doc: DocumentFile) => {
        if (doc.is_locked) {
            return; // Do nothing if locked
        }

        try {
            const res = await fetch(`/api/documents/${doc.id}/download`);
            if (res.ok) {
                const { url } = await res.json();
                setViewerDoc(doc);
                setViewerUrl(url);
                setViewerOpen(true);
            } else {
                alert("Failed to get preview link");
            }
        } catch (error) {
            console.error("Preview error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this document? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== id));
            } else {
                alert("Failed to delete");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleArchive = async (doc: DocumentFile) => {
        try {
            const res = await fetch(`/api/documents/${doc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_archived: !doc.is_archived })
            });

            if (res.ok) {
                fetchDocuments();
            }
        } catch (error) {
            console.error("Archive error:", error);
        }
    };

    const handleLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc) return;

        try {
            const res = await fetch("/api/document-links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    document_id: selectedDoc.id,
                    ...linkForm
                })
            });

            if (res.ok) {
                setIsLinkOpen(false);
                alert("Link created successfully!");
                setLinkForm({ entity_type: "insurance_policy", entity_id: "", link_description: "", is_primary: false });
            } else {
                const error = await res.json();
                alert(error.error || "Failed to link");
            }
        } catch (error) {
            console.error("Link error:", error);
        }
    };

    const handleRequestOTP = async (doc: DocumentFile) => {
        setSelectedDocForOTP(doc);
        setOtpError("");
        setOtpLoading(true);

        try {
            const res = await fetch(`/api/documents/${doc.id}/request-otp`, {
                method: "POST"
            });

            const data = await res.json();

            if (res.ok) {
                setIsOTPModalOpen(true);
            } else {
                setOtpError(data.error || "Failed to send OTP");
            }
        } catch (error) {
            setOtpError("Failed to request OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDocForOTP || !otp) return;

        setOtpLoading(true);
        setOtpError("");

        try {
            const res = await fetch(`/api/documents/${selectedDocForOTP.id}/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp })
            });

            const data = await res.json();

            if (res.ok) {
                setIsOTPModalOpen(false);
                setOtp("");
                setSelectedDocForOTP(null);
                fetchDocuments(); // Refresh to update lock status
            } else {
                setOtpError(data.error || "Invalid OTP");
            }
        } catch (error) {
            setOtpError("Verification failed");
        } finally {
            setOtpLoading(false);
        }
    };

    const getFileIcon = (mimeType?: string | null) => {
        if (!mimeType) return File;
        if (mimeType.includes("image")) return ImageIcon;
        if (mimeType.includes("pdf")) return FileText;
        return FileText;
    };

    const formatBytes = (bytes?: number | null) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <DashboardShell
            title="Documents"
            description="Manage and organize your digital records"
        >
            <div className="space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-1 w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search by name, tags..."
                                className="pl-9 bg-card"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            options={[{ value: "all", label: "All Types" }, ...DOC_TYPES]}
                            className="w-[140px]"
                        />
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="checkbox"
                                id="showArchived"
                                checked={showArchived}
                                onChange={(e) => setShowArchived(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-600"
                            />
                            <Label htmlFor="showArchived" className="text-sm">Archived</Label>
                        </div>
                    </div>
                    <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto gap-2 bg-slate-900 border-slate-800 text-white hover:bg-slate-800">
                        <UploadCloud className="h-4 w-4" />
                        Upload Document
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="min-h-[400px]">
                        <EmptyState
                            icon={FolderOpen}
                            title={searchQuery ? "No matching documents" : "No documents upload"}
                            description="Securely store your invoices, policies, and certificates here."
                            action={searchQuery ? undefined : {
                                label: "Upload First Document",
                                onClick: () => setIsUploadOpen(true),
                            }}
                            withCard={true}
                        />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {documents.map((doc) => {
                            const Icon = getFileIcon(doc.mime_type);
                            return (
                                <Card key={doc.id} className={`relative group hover:shadow-md transition-all cursor-pointer ${doc.is_archived ? 'opacity-60 bg-slate-50' : 'bg-card'}`} onClick={() => handleViewDocument(doc)}>
                                    <div className="p-4 flex gap-3">
                                        <div className={`h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 ${doc.is_locked ? 'blur-md' : ''}`}>
                                            <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`font-medium text-foreground truncate ${doc.is_locked ? 'blur-sm' : ''}`} title={doc.title || doc.file_name}>
                                                    {doc.title || doc.file_name}
                                                </h3>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                                            <MoreVertical className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!doc.is_locked && (
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                                                                <Download className="h-4 w-4 mr-2" /> Download
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setIsLinkOpen(true); }}>
                                                            <LinkIcon className="h-4 w-4 mr-2" /> Link to Entity
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(doc); }}>
                                                            <Archive className="h-4 w-4 mr-2" /> {doc.is_archived ? "Unarchive" : "Archive"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} className="text-red-600 focus:text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                                                    {doc.document_type}
                                                </Badge>
                                                <span className="text-[10px] text-slate-500">{formatBytes(doc.file_size)}</span>
                                                {doc.is_locked && (
                                                    <Badge variant="destructive" className="text-[10px] h-5">
                                                        🔒 Locked
                                                    </Badge>
                                                )}
                                            </div>
                                            {doc.is_locked && (
                                                <div className="mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-6"
                                                        onClick={(e) => { e.stopPropagation(); handleRequestOTP(doc); }}
                                                        disabled={otpLoading}
                                                    >
                                                        {otpLoading ? "Sending..." : "View Clear"}
                                                    </Button>
                                                </div>
                                            )}
                                            {doc.tags && doc.tags.length > 0 && (
                                                <div className={`flex flex-wrap gap-1 mt-2 ${doc.is_locked ? 'blur-sm' : ''}`}>
                                                    {doc.tags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{formatUpdatedLabel(doc.updated_at || doc.created_at)}</span>
                                                <span>{formatDateTime(doc.updated_at || doc.created_at)}</span>
                                            </div>
                                            {otpError && selectedDocForOTP?.id === doc.id && (
                                                <p className="text-[10px] text-red-500 mt-1">{otpError}</p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Upload Modal */}
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                            <DialogDescription>Max file size 10MB. Select a document type from Quick Pick to auto-fill.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        {uploadFile ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <CheckCircle2 className="h-8 w-8 text-primary" />
                                                <p className="text-sm font-medium text-primary">{uploadFile.name}</p>
                                                <p className="text-xs text-slate-500">{formatBytes(uploadFile.size)}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                                <UploadCloud className="h-8 w-8" />
                                                <p className="text-sm">Click to select file</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                                            <Sheet open={showTitlePick} onOpenChange={setShowTitlePick}>
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
                                                        title="Select Document Name"
                                                        subtitle="Common Indian documents (50+ options)"
                                                        items={indianDocuments.map(doc => ({ value: doc, label: doc }))}
                                                        onSelect={(value) => {
                                                            setUploadForm(p => ({ ...p, title: value }));
                                                            setShowTitlePick(false);
                                                        }}
                                                    />
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                        <Input
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            placeholder="e.g. Aadhaar Card, PAN Card, Passport..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Document Type</label>
                                            <Sheet open={showDocTypePick} onOpenChange={setShowDocTypePick}>
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
                                                        title="Select Document Type"
                                                        subtitle="Document categories"
                                                        items={documentTypes.map(type => ({ value: type.toLowerCase().replace(/[^a-z0-9]/g, '_'), label: type }))}
                                                        onSelect={(value) => {
                                                            setUploadForm(p => ({ ...p, document_type: value }));
                                                            setShowDocTypePick(false);
                                                        }}
                                                    />
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                        <Select
                                            options={DOC_TYPES}
                                            value={uploadForm.document_type}
                                            onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                                        />
                                    </div>

                                    <Input
                                        label="Tags (comma separated)"
                                        placeholder="e.g. tax, 2024, important"
                                        value={uploadForm.tags}
                                        onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                                    />
                                    <Input
                                        label="Description"
                                        value={uploadForm.description}
                                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    />
                                </div>

                                {/* Desktop QuickPickPanel */}
                                <div className="hidden md:block">
                                    <QuickPickPanel
                                        title="📄 Indian Documents (50+)"
                                        subtitle="Click to auto-fill document title"
                                        items={indianDocuments.map(doc => ({ value: doc, label: doc }))}
                                        onSelect={(value) => {
                                            setUploadForm(p => ({ ...p, title: value }));
                                        }}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={!uploadFile || uploading}>
                                    {uploading ? "Uploading..." : "Upload"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Link Modal */}
                <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Link Document</DialogTitle>
                            <DialogDescription>
                                Associate this document with other records.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleLink} className="space-y-4">
                            <Select
                                label="Link To"
                                options={ENTITY_TYPES}
                                value={linkForm.entity_type}
                                onChange={(e) => setLinkForm({ ...linkForm, entity_type: e.target.value })}
                            />
                            <Input
                                label="Entity ID (UUID)"
                                placeholder="Paste UUID of the record"
                                value={linkForm.entity_id}
                                onChange={(e) => setLinkForm({ ...linkForm, entity_id: e.target.value })}
                                required
                            />
                            <Input
                                label="Description (Optional)"
                                value={linkForm.link_description}
                                onChange={(e) => setLinkForm({ ...linkForm, link_description: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPrimary"
                                    checked={linkForm.is_primary}
                                    onChange={(e) => setLinkForm({ ...linkForm, is_primary: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                <Label htmlFor="isPrimary">Is Primary Document?</Label>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Link</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* OTP Verification Modal */}
                <Dialog open={isOTPModalOpen} onOpenChange={setIsOTPModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Enter OTP</DialogTitle>
                            <DialogDescription>
                                We've sent a 6-digit code to your email. Enter it below to unlock the document.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div>
                                <Label htmlFor="otp">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="Enter code from email"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))}
                                    className="text-center text-lg tracking-widest font-mono"
                                    maxLength={8}
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    OTP expires in 2 minutes. Check your email inbox.
                                </p>
                                {otpError && (
                                    <p className="text-xs text-red-500 mt-1">{otpError}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsOTPModalOpen(false);
                                        setOtp("");
                                        setOtpError("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={otpLoading || otp.length < 6}>
                                    {otpLoading ? "Verifying..." : "Verify & Unlock"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Document Viewer Modal */}
                <DocumentViewerModal
                    open={viewerOpen}
                    onOpenChange={setViewerOpen}
                    fileUrl={viewerUrl}
                    title={viewerDoc?.title || viewerDoc?.file_name || "Document"}
                    locked={viewerDoc?.is_locked || false}
                    onDownload={viewerDoc && !viewerDoc.is_locked ? () => handleDownload(viewerDoc) : undefined}
                />
            </div>
        </DashboardShell>
    );
}
