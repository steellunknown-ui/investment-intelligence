"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import {
    TrendingUp,
    Shield,
    Users,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    KeyRound
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
            }
        });

        setLoading(false);
        if (error) {
            toast.error("Error sending OTP", { description: error.message });
            return;
        }

        setStep("otp");
        toast.success("OTP Sent!", {
            description: "An 8-digit OTP has been sent to your email address.",
        });
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 8) {
            toast.error("Invalid OTP", { description: "Please enter the 8-digit OTP." });
            return;
        }
        setLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email'
        });

        setLoading(false);
        if (error) {
            toast.error("Verification failed", { description: error.message });
            return;
        }

        setStep("password");
        toast.success("OTP Verified", { description: "You can now set a new password." });
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match", { description: "Please ensure both passwords are the same." });
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password too short", { description: "Password must be at least 6 characters long." });
            return;
        }

        setLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        setLoading(false);
        if (error) {
            toast.error("Error resetting password", { description: error.message });
            return;
        }

        toast.success("Password Reset Successful!", {
            description: "Your password has been successfully updated. You are now logged in.",
        });
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                {/* Subtle emerald glow */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-subtle-glow" />
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 grid-pattern opacity-20" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Investment Intelligence</span>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold leading-tight text-white">
                                Secure your
                                <br />
                                <span className="text-accent">
                                    investment legacy
                                </span>
                            </h1>
                            <p className="mt-4 text-lg text-white/70 max-w-md">
                                Track, protect, and ensure your loved ones can access your portfolio when it matters most.
                            </p>
                        </div>

                        {/* Feature Cards */}
                        <div className="space-y-4">
                            <FeatureCard
                                icon={Shield}
                                title="Military-Grade Security"
                                description="Your data is encrypted end-to-end"
                            />
                            <FeatureCard
                                icon={Users}
                                title="Nominee Access"
                                description="Trusted contacts get access during inactivity"
                            />
                            <FeatureCard
                                icon={Sparkles}
                                title="Smart Insights"
                                description="AI-powered portfolio analysis"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-white/40">
                        Trusted by 10,000+ investors across India
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative overflow-hidden">
                {/* Shiny grid background */}
                <div className="grid-pattern-full dark:opacity-50" />
                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-foreground">Investment Intelligence</span>
                    </div>

                    {/* Form Card */}
                    <div className="card-base p-8 relative">
                        <Link href="/login" className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>

                        <div className="text-center mb-8 mt-6">
                            <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-primary/20 text-primary dark:text-accent rounded-full flex items-center justify-center mb-4">
                                <KeyRound className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Reset Password</h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {step === "email" && "Enter your email to receive an 8-digit OTP."}
                                {step === "otp" && "Enter the 8-digit OTP sent to your email."}
                                {step === "password" && "Enter your new secure password."}
                            </p>
                        </div>

                        {step === "email" && (
                            <form onSubmit={handleSendOTP} className="space-y-5">
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

                                <Button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
                                >
                                    {loading ? "Sending..." : "Send OTP"}
                                    {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                                </Button>
                            </form>
                        )}

                        {step === "otp" && (
                            <form onSubmit={handleVerifyOTP} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        8-Digit OTP
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="12345678"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        required
                                        className="h-12 text-center tracking-[0.5em] font-mono text-lg bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors"
                                    />
                                    <p className="text-xs text-slate-500 mt-2 text-center">
                                        OTP sent to <strong>{email}</strong>
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || otp.length !== 8}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
                                >
                                    {loading ? "Verifying..." : "Verify OTP"}
                                    {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                                </Button>
                            </form>
                        )}

                        {step === "password" && (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        New Password
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !newPassword || !confirmPassword}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
                                >
                                    {loading ? "Updating..." : "Reset Password"}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Remember your password?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-primary hover:text-primary transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Shield className="h-4 w-4" />
                        <span>256-bit SSL encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="icon-container bg-primary/20">
                <Icon className="h-5 w-5 text-accent" />
            </div>
            <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-white/60 mt-0.5">{description}</p>
            </div>
        </div>
    );
}
