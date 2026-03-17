"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    TrendingUp,
    Shield,
    Eye,
    EyeOff,
    ArrowRight,
    CheckCircle2
} from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createSupabaseBrowserClient();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });

            if (error) {
                setError(error.message);
                return;
            }

            if (data.user) {
                await fetch("/api/auth/bootstrap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: data.user.id,
                        email,
                        fullName: fullName || null,
                    }),
                });

                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const supabase = createSupabaseBrowserClient();
            const origin = window.location.origin;
            const isLocal = origin.includes('localhost');
            const redirectBase = isLocal ? origin : 'https://investment-intellegince.vercel.app';

            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${redirectBase}/auth/callback`,
                },
            });
        } catch (error) {
            console.error("Google login error:", error);
            setError("Failed to initialize Google login");
        }
    };

    const passwordStrength = password.length >= 8 ? "strong" : password.length >= 4 ? "medium" : "weak";

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative overflow-hidden">
                {/* Shiny grid background */}
                <div className="grid-pattern-full dark:opacity-50" />
                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Investment Intelligence</span>
                    </div>

                    {/* Form Card */}
                    <div className="card-base p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Create your account</h2>
                            <p className="text-muted-foreground mt-2">Start protecting your investment legacy</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Full name
                                </label>
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Email address
                                </label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="mt-2 flex gap-1">
                                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "weak" ? "bg-red-400" : passwordStrength === "medium" ? "bg-amber-400" : "bg-emerald-400"}`} />
                                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "medium" || passwordStrength === "strong" ? (passwordStrength === "medium" ? "bg-amber-400" : "bg-emerald-400") : "bg-slate-200"}`} />
                                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "strong" ? "bg-emerald-400" : "bg-slate-200"}`} />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Create account
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-primary hover:text-primary dark:text-primary dark:hover:text-accent transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Shield className="h-4 w-4" />
                        <span>Your data is secured with 256-bit encryption</span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Features */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                {/* Subtle emerald glow */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-subtle-glow" />
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 grid-pattern opacity-20" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold leading-tight text-white">
                                Everything you need to
                                <br />
                                <span className="text-accent">
                                    protect your wealth
                                </span>
                            </h1>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-4">
                            <BenefitItem text="Track all your investments in one place" />
                            <BenefitItem text="Set up trusted nominees for peace of mind" />
                            <BenefitItem text="Automatic inactivity detection & alerts" />
                            <BenefitItem text="Bank-grade security for your data" />
                            <BenefitItem text="Beautiful insights & portfolio analysis" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <span className="text-white/80">{text}</span>
        </div>
    );
}
