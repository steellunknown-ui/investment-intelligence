"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface GridDocUploadProps {
    entityType: 'insurance_policy' | 'bank_account' | 'asset' | 'liability' | 'receivable' | 'belonging';
    entityId: string;
}

/**
 * Compact upload button for use inside grid table rows.
 * Shows a small upload icon that opens the file explorer on click.
 */
export function GridDocUpload({ entityType, entityId }: GridDocUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setUploading(true);
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

            // 2. Link to entity
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

            toast.success('Document uploaded successfully');
            // Reload to refresh badge counts
            window.location.reload();
        } catch (err: any) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!entityId) return null;

    return (
        <>
            <input
                ref={fileRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                disabled={uploading}
            />
            <Button
                variant="ghost"
                size="sm"
                onClick={handleClick}
                disabled={uploading}
                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Upload Document"
            >
                {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Upload className="h-3.5 w-3.5" />
                )}
            </Button>
        </>
    );
}
