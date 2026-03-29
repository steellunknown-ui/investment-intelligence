"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Input } from "./Input";
import { Search, Sparkles } from "lucide-react";

export interface QuickPickItem {
    label: string;
    value: string;
    category?: string;
    meta?: string;
}

interface QuickPickPanelProps {
    title: string;
    subtitle?: string;
    items: QuickPickItem[];
    onSelect: (value: string) => void;
    currentValue?: string;
}

export function QuickPickPanel({ title, subtitle, items, onSelect, currentValue }: QuickPickPanelProps) {
    const [search, setSearch] = useState("");

    const filteredItems = items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.value.toLowerCase().includes(search.toLowerCase()) ||
        (item.meta && item.meta.toLowerCase().includes(search.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
    );

    // Group items by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        const category = item.category || "General";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, QuickPickItem[]>);

    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                </div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>

            <div className="pb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search options..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm bg-background"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar space-y-6">
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No matches found</p>
                        <p className="text-xs text-muted-foreground">Try a different search term</p>
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category} className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b pb-1">
                                {category}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {categoryItems.map((item, index) => (
                                    <button
                                        key={`${category}-${index}`}
                                        type="button"
                                        onClick={() => onSelect(item.value)}
                                        className={`
                                            flex flex-col items-start p-3 rounded-xl text-left transition-all border
                                            ${currentValue === item.value
                                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                : "bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 border-border text-foreground hover:border-slate-300 dark:hover:border-slate-700"
                                            }
                                        `}
                                    >
                                        <span className="text-xs font-semibold line-clamp-1">{item.label}</span>
                                        {item.meta && (
                                            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                                {item.meta}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-4 mt-auto">
                <p className="text-[10px] text-muted-foreground text-center">
                    Click to auto-fill • {filteredItems.length} of {items.length} options
                </p>
            </div>
        </Card>
    );
}
