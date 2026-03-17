"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ViewMode = "card" | "grid";

interface ViewToggleProps {
    viewMode: ViewMode;
    onToggle: (mode: ViewMode) => void;
}

/**
 * Toggle between card view and grid/table view.
 * Card icon = card view, List icon = grid/table view.
 */
export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle("card")}
                className={`h-8 w-8 p-0 rounded-md transition-all ${viewMode === "card"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-accent"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                title="Card View"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle("grid")}
                className={`h-8 w-8 p-0 rounded-md transition-all ${viewMode === "grid"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-accent"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                title="Grid View"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}
