"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Shield, KeyRound, AlertTriangle, ArrowRight, ShieldCheck, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function NomineePortal() {
    const params = useParams()
    const router = useRouter()

    // The nominee access token from the URL, generated during Stage 4
    const token = params.token as string

    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState('')
    const [aadhaar, setAadhaar] = useState('')
    const [pan, setPan] = useState('')
    const [isBlocked, setIsBlocked] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage(null)

        try {
            const res = await fetch('/api/inactivity/access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: token,
                    nominee_phone: phone,
                    aadhaar: aadhaar || undefined,
                    pan: pan || undefined
                })
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.is_blocked) {
                    setIsBlocked(true)
                }
                throw new Error(data.error || 'Verification failed')
            }

            // Success! Store session token 
            toast.success("Identity Verified", { description: "Redirecting to portfolio access..." })
            localStorage.setItem("nominee_session", data.session_token)
            router.push(data.redirect)

        } catch (err: any) {
            setErrorMessage(err.message)
            toast.error("Access Denied", { description: err.message })
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full p-8 text-center border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Invalid Access Link</h2>
                    <p className="text-muted-foreground">
                        This nominee access link is malformed or missing the required secure token. Please check the URL provided in your email.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="grid-pattern-full opacity-50 absolute inset-0 pointer-events-none" />

            <Card className="max-w-md w-full relative z-10 p-8 shadow-xl shadow-emerald-900/5 border-border">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-primary/20 text-primary dark:text-accent rounded-2xl flex items-center justify-center mb-4 transform -rotate-6 shadow-sm border border-emerald-200 dark:border-emerald-800">
                        <Shield className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Nominee Access Portal</h1>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        You have been granted emergency access to this portfolio. Please verify your identity using the details registered by the portfolio owner.
                    </p>
                </div>

                {isBlocked ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-center space-y-3">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto" />
                        <h3 className="font-semibold text-red-900 dark:text-red-200">Account Blocked</h3>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            {errorMessage || "Due to multiple failed attempts, this access link has been temporarily suspended for security."}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-5">
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-start gap-3 mb-6">
                            <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                Provide your registered <strong>Phone Number</strong>. If the host configured Aadhaar or PAN verification, provide those as well. Unnecessary fields will be safely ignored.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-400" />
                                Registered Phone Number
                            </label>
                            <Input
                                type="tel"
                                placeholder="+91 9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors placeholder:text-slate-400"
                            />
                        </div>

                        <div className="pt-4 border-t border-border space-y-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Optional Identity Verification
                            </label>

                            <div>
                                <Input
                                    label="Aadhaar Number"
                                    placeholder="XXXX XXXX XXXX"
                                    value={aadhaar}
                                    onChange={(e) => setAadhaar(e.target.value)}
                                    className="h-11 bg-background placeholder:text-slate-400"
                                />
                            </div>

                            <div>
                                <Input
                                    label="PAN Number"
                                    placeholder="ABCDE1234F"
                                    value={pan}
                                    onChange={(e) => setPan(e.target.value)}
                                    className="h-11 bg-background uppercase placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {errorMessage && !isBlocked && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {errorMessage}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !phone || isBlocked}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200 mt-6"
                        >
                            {loading ? "Verifying..." : "Verify Identity & Access"}
                            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    )
}
