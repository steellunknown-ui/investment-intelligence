"use client";

import { Edit2, Trash2, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatUpdatedLabel, formatDateTime } from "@/src/lib/time";

export interface GridColumn {
    key: string;
    label: string;
    /** Render custom content. If omitted, shows item[key] as text */
    render?: (item: any) => React.ReactNode;
    /** Hide on mobile */
    hideMobile?: boolean;
    /** Min-width for column (CSS value, e.g. '120px') */
    minWidth?: string;
}

interface GridTableProps {
    items: any[];
    columns: GridColumn[];
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
    /** Show document badge/count. Returns a React node (e.g. EntityDocumentsBadge). */
    renderDocBadge?: (item: any) => React.ReactNode;
    /** Show document upload button. Returns a React node (e.g. EntityDocumentUpload). */
    renderDocUpload?: (item: any) => React.ReactNode;
    /** Key to use for the "last updated" timestamp. Defaults to 'updated_at' */
    timestampKey?: string;
    /** Fallback timestamp key. Defaults to 'created_at' */
    timestampFallbackKey?: string;
    /** Extra action buttons per row */
    renderExtraActions?: (item: any) => React.ReactNode;
}

/**
 * Reusable grid/table view for module items.
 * Uses a proper HTML table so columns align perfectly with headers.
 */
export function GridTable({
    items,
    columns,
    onEdit,
    onDelete,
    renderDocBadge,
    renderDocUpload,
    timestampKey = "updated_at",
    timestampFallbackKey = "created_at",
    renderExtraActions,
}: GridTableProps) {
    if (items.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-border overflow-x-auto">
            <table className="w-full border-collapse">
                {/* Table Header */}
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap ${col.hideMobile ? 'hidden md:table-cell' : ''}`}
                                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                            >
                                {col.label}
                            </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                            Documents
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                            Last Updated
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>

                {/* Table Rows */}
                <tbody>
                    {items.map((item, idx) => {
                        const timestamp = item[timestampKey] || item[timestampFallbackKey];
                        return (
                            <tr
                                key={item.id || idx}
                                className="border-b border-border last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                            >
                                {/* Data Columns */}
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${col.hideMobile ? 'hidden md:table-cell' : ''}`}
                                    >
                                        {col.render
                                            ? col.render(item)
                                            : (item[col.key] ?? '—')
                                        }
                                    </td>
                                ))}

                                {/* Documents Column */}
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <DocCell item={item} renderDocBadge={renderDocBadge} renderDocUpload={renderDocUpload} />
                                </td>

                                {/* Last Updated Column */}
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    {timestamp ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap" title={formatDateTime(timestamp)}>
                                            <Clock className="h-3 w-3 flex-shrink-0" />
                                            {formatUpdatedLabel(timestamp)}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-300">—</span>
                                    )}
                                </td>

                                {/* Actions Column */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 justify-end flex-nowrap">

                                        {/* Extra Actions */}
                                        {renderExtraActions && renderExtraActions(item)}

                                        {/* Edit Button */}
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(item)}
                                                className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}

                                        {/* Delete Button */}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(item)}
                                                className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity hover:text-red-600 flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Helper component for the Documents cell.
 * Shows the doc badge (if docs exist) alongside an upload button.
 */
function DocCell({ item, renderDocBadge, renderDocUpload }: {
    item: any;
    renderDocBadge?: (item: any) => React.ReactNode;
    renderDocUpload?: (item: any) => React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-1">
            {renderDocBadge && renderDocBadge(item)}
            {renderDocUpload && renderDocUpload(item)}
            {!renderDocBadge && !renderDocUpload && (
                <span className="text-xs text-slate-300">—</span>
            )}
        </div>
    );
}
