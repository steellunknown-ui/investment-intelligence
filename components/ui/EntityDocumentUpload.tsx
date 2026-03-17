"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, X, FileText, Image, Loader2, Paperclip, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UploadedDoc {
    id: string;
    file_name: string;
    mime_type: string;
    file_path: string;
    linkId?: string;
}

interface EntityDocumentUploadProps {
    entityType: 'insurance_policy' | 'bank_account' | 'asset' | 'liability' | 'receivable' | 'belonging';
    entityId?: string;
    onUploadComplete?: () => void;
    onDocUploaded?: (docId: string) => void;
}

export function EntityDocumentUpload({ entityType, entityId, onUploadComplete, onDocUploaded }: EntityDocumentUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [linkedDocs, setLinkedDocs] = useState<UploadedDoc[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch existing linked documents
    const fetchLinkedDocs = useCallback(async () => {
        if (!entityId) return;
        try {
            const res = await fetch(`/api/document-links?entity_type=${entityType}&entity_id=${entityId}`);
            if (res.ok) {
                const data = await res.json();
                // Fetch document details for each link
                const docPromises = (data.links || []).map(async (link: { document_id: string; id: string }) => {
                    const docRes = await fetch(`/api/documents/${link.document_id}`);
                    if (docRes.ok) {
                        const docData = await docRes.json();
                        return { ...docData.document, linkId: link.id };
                    }
                    return null;
                });
                const docs = (await Promise.all(docPromises)).filter(Boolean);
                setLinkedDocs(docs);
            }
        } catch (err) {
            console.error('Failed to fetch linked docs:', err);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        if (entityId) {
            fetchLinkedDocs();
        }
    }, [entityId, fetchLinkedDocs]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
        e.target.value = ''; // Reset input
    };

    const handleUpload = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Upload file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('document_type', entityType);

            const uploadRes = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || 'Upload failed');
            }

            const { document } = await uploadRes.json();
            
            // Notify parent even if not linked yet
            onDocUploaded?.(document.id);

            // 2. Link to entity (ONLY IF entityId exists)
            if (entityId) {
                const linkRes = await fetch('/api/document-links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        document_id: document.id,
                        entity_type: entityType,
                        entity_id: entityId,
                    }),
                });

                if (!linkRes.ok) {
                    throw new Error('Failed to link document');
                }

                // Refresh list
                await fetchLinkedDocs();
            } else {
                // If no entityId, show in a temporary "pending" list maybe?
                // For now, let the parent handle displaying the pending docs if it wants.
                // We'll add the doc to linkedDocs state manually so user sees it's "uploaded"
                setLinkedDocs(prev => [...prev, document]);
            }
            
            onUploadComplete?.();
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async (linkId: string) => {
        try {
            const res = await fetch(`/api/document-links/${linkId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setLinkedDocs(prev => prev.filter((d: any) => d.linkId !== linkId));
            }
        } catch (err) {
            console.error('Failed to remove link:', err);
        }
    };

    const handleView = async (docId: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}/download`);
            if (res.ok) {
                const data = await res.json();
                window.open(data.url, '_blank');
            } else {
                setError('Failed to load document');
            }
        } catch (err) {
            console.error('Failed to view document:', err);
            setError('Failed to load document');
        }
    };

    const handleDownload = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}/download`);
            if (res.ok) {
                const data = await res.json();
                // Create a temporary link to trigger download
                const a = document.createElement('a');
                a.href = data.url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                setError('Failed to download document');
            }
        } catch (err) {
            console.error('Failed to download document:', err);
            setError('Failed to download document');
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.startsWith('image/')) {
            return <Image className="h-5 w-5 text-primary" />;
        }
        return <FileText className="h-5 w-5 text-blue-500" />;
    };

    return (
        <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attached Documents</span>
                <span className="text-xs text-muted-foreground">({linkedDocs.length})</span>
            </div>

            {/* Existing Documents */}
            {linkedDocs.length > 0 && (
                <div className="space-y-2 mb-3">
                    {linkedDocs.map((doc: any) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2"
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getFileIcon(doc.mime_type)}
                                <span className="text-xs truncate" title={doc.file_name}>{doc.file_name}</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                <button
                                    type="button"
                                    onClick={() => handleView(doc.id)}
                                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    title="View"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDownload(doc.id, doc.file_name)}
                                    className="p-1 text-primary hover:text-primary hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(doc.linkId)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Remove"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                    ${isDragOver ? 'border-primary bg-primary/10 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-700'}
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            Drop file here or click to upload
                        </span>
                        <span className="text-[10px] text-slate-400">Max 10MB</span>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
        </div>
    );
}
