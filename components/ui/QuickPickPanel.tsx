"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";
import { Search, Sparkles } from "lucide-react";

interface QuickPickItem {
    label: string;
    value: string;
    meta?: string;
}

interface QuickPickPanelProps {
    title: string;
    subtitle?: string;
    items: QuickPickItem[];
    onSelect: (value: string) => void;
}

export function QuickPickPanel({ title, subtitle, items, onSelect }: QuickPickPanelProps) {
    const [search, setSearch] = useState("");

    const filteredItems = items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.value.toLowerCase().includes(search.toLowerCase()) ||
        (item.meta && item.meta.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                </div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>

            <div className="p-4 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 p-2">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No matches found</p>
                        <p className="text-xs text-muted-foreground">Add manually or adjust search</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredItems.map((item, index) => (
                            <Button
                                key={index}
                                type="button"
                                variant="ghost"
                                className="w-full justify-start h-auto py-2.5 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 text-left"
                                onClick={() => onSelect(item.value)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {item.label}
                                    </p>
                                    {item.meta && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {item.meta}
                                        </p>
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-border bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-center">
                    Click to auto-fill • {filteredItems.length} of {items.length} shown
                </p>
            </div>
        </Card>
    );
}
