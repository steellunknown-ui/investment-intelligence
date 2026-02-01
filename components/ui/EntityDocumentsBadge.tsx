"use client";

import { useState, useEffect } from "react";
import { FileText, Image, Paperclip, Eye, Download, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface LinkedDoc {
    id: string;
    file_name: string;
    mime_type: string;
    linkId: string;
}

interface EntityDocumentsBadgeProps {
    entityType: 'insurance_policy' | 'bank_account' | 'asset' | 'liability' | 'receivable' | 'belonging';
    entityId: string;
}

export function EntityDocumentsBadge({ entityType, entityId }: EntityDocumentsBadgeProps) {
    const [docs, setDocs] = useState<LinkedDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await fetch(`/api/document-links?entity_type=${entityType}&entity_id=${entityId}`);
                if (res.ok) {
                    const data = await res.json();
                    const docPromises = (data.links || []).map(async (link: { document_id: string; id: string }) => {
                        const docRes = await fetch(`/api/documents/${link.document_id}`);
                        if (docRes.ok) {
                            const docData = await docRes.json();
                            return { ...docData.document, linkId: link.id };
                        }
                        return null;
                    });
                    const fetchedDocs = (await Promise.all(docPromises)).filter(Boolean);
                    setDocs(fetchedDocs);
                }
            } catch (err) {
                console.error('Failed to fetch docs:', err);
            } finally {
                setLoading(false);
            }
        };

        if (entityId) {
            fetchDocs();
        }
    }, [entityType, entityId]);

    const handleView = async (docId: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}/download`);
            if (res.ok) {
                const data = await res.json();
                window.open(data.url, '_blank');
            }
        } catch (err) {
            console.error('Failed to view:', err);
        }
    };

    const handleDownload = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}/download`);
            if (res.ok) {
                const data = await res.json();
                const a = document.createElement('a');
                a.href = data.url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Failed to download:', err);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.startsWith('image/')) {
            return <Image className="h-3.5 w-3.5 text-emerald-500" />;
        }
        return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    };

    if (loading) {
        return (
            <div className="flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
            </div>
        );
    }

    if (docs.length === 0) {
        return null; // Don't show if no documents
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{docs.length}</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-y-auto">
                {docs.map((doc) => (
                    <div
                        key={doc.id}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getFileIcon(doc.mime_type)}
                            <span className="text-xs truncate" title={doc.file_name}>
                                {doc.file_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-0.5 ml-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(doc.id);
                                }}
                                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title="View"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(doc.id, doc.file_name);
                                }}
                                className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                title="Download"
                            >
                                <Download className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
