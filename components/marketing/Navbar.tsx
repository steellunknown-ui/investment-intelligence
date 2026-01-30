"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it Works" },
    { href: "#faq", label: "FAQ" },
];

export function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [initials, setInitials] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsLoggedIn(true);
                if (user.user_metadata?.avatar_url) {
                    setAvatarUrl(user.user_metadata.avatar_url);
                }
                if (user.user_metadata?.full_name) {
                    const name = user.user_metadata.full_name;
                    const parts = name.split(' ').filter(Boolean);
                    if (parts.length >= 2) {
                        setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
                    } else if (parts.length === 1) {
                        setInitials(parts[0][0].toUpperCase());
                    }
                } else if (user.email) {
                    setInitials(user.email[0].toUpperCase());
                }
            }
        };
        checkSession();
    }, []);

    const handleLogout = async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setAvatarUrl(null);
        setInitials(null);
        router.refresh();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="icon-container">
                            <TrendingUp className="h-5 w-5 icon-emerald" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                            Investment Intelligence
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        {isLoggedIn ? (
                            <>
                                <Button
                                    onClick={() => router.push("/dashboard")}
                                    variant="primary"
                                >
                                    Go to Dashboard
                                </Button>
                                {/* User Avatar Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-slate-300 overflow-hidden">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="font-medium text-sm">{initials || <User className="h-5 w-5" />}</span>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push("/login")}
                                    className="text-slate-700"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => router.push("/signup")}
                                    variant="primary"
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        <div className="flex justify-end pb-2">
                            <ThemeToggle />
                        </div>
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-slate-700 dark:text-slate-300 font-medium py-2"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                            {isLoggedIn ? (
                                <>
                                    {/* Mobile Avatar */}
                                    <div className="flex items-center gap-3 pb-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="font-medium text-sm">{initials || <User className="h-5 w-5" />}</span>
                                            )}
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">Logged In</span>
                                    </div>
                                    <Button
                                        onClick={() => router.push("/dashboard")}
                                        variant="primary"
                                        className="w-full"
                                    >
                                        Go to Dashboard
                                    </Button>
                                    <Button
                                        onClick={handleLogout}
                                        variant="secondary"
                                        className="w-full text-red-600"
                                    >
                                        Sign out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => router.push("/login")}
                                        className="w-full"
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        onClick={() => router.push("/signup")}
                                        variant="primary"
                                        className="w-full"
                                    >
                                        Get Started
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
