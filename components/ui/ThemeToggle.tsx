"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
    const { theme, toggleTheme, mounted } = useTheme();

    // Don't render anything until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="p-2 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-300 ${theme === "light"
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 rotate-90 scale-0"
                        }`}
                />
                <Moon
                    className={`absolute inset-0 h-5 w-5 text-slate-300 transition-all duration-300 ${theme === "dark"
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 -rotate-90 scale-0"
                        }`}
                />
            </div>
        </button>
    );
}

