"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorTheme = "emerald" | "infinix" | "infinix-2" | "royal" | "midnight";

interface ThemeContextType {
    theme: Theme;
    colorTheme: ColorTheme;
    toggleTheme: () => void;
    setColorTheme: (theme: ColorTheme) => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [colorTheme, setColorThemeState] = useState<ColorTheme>("emerald");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as Theme;
        const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme;

        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
        }

        if (savedColorTheme) {
            setColorThemeState(savedColorTheme);
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("theme", theme);
            if (theme === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        }
    }, [theme, mounted]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("colorTheme", colorTheme);
            
            // Remove existing themes
            const themes: ColorTheme[] = ["emerald", "infinix", "infinix-2", "royal", "midnight"];
            themes.forEach(t => document.documentElement.classList.remove(`theme-${t}`));
            
            // Add current theme
            document.documentElement.classList.add(`theme-${colorTheme}`);
        }
    }, [colorTheme, mounted]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const setColorTheme = (newTheme: ColorTheme) => {
        setColorThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, colorTheme, toggleTheme, setColorTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

