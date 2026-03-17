"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { ShieldCheck, LogOut, Loader2, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { canNomineeView, canNomineeEdit, isNomineeHidden } from '@/lib/nominee-permissions'

// We will render "View Only" versions of the actual modules here
// To keep Phase 5 scope manageable, we will just fetch the aggregate summary
// using the existing Phase 4 family/[id]/summary API since the Nominee acts like read-only family!
import FamilyMemberSummaryDashboard from '@/components/family/FamilyMemberSummaryDashboard'

export default function NomineeSessionDashboard() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [loading, setLoading] = useState(true)
    const [sessionData, setSessionData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const validateSession = async () => {
            // First check if the token is in localstorage (anti-tamper basic check)
            const localToken = localStorage.getItem('nominee_session')
            if (!localToken || localToken !== token) {
                setError("Invalid or missing session. Please verify your identity through your access link again.")
                setLoading(false)
                return
            }

            try {
                const res = await fetch(`/api/nominee-session?token=${token}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to validate session')
                }

                setSessionData(data.session)
            } catch (err: any) {
                setError(err.message)
                localStorage.removeItem('nominee_session')
            } finally {
                setLoading(false)
            }
        }

        if (token) validateSession()
    }, [token])

    const handleLogout = () => {
        localStorage.removeItem('nominee_session')
        toast.info("Session Closed")
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        )
    }

    if (error || !sessionData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full p-8 text-center border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Session Expired or Invalid</h2>
                    <p className="text-muted-foreground mb-6 font-medium">
                        {error || "Your emergency access session has ended."}
                    </p>
                    <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                        Return to Home
                    </Button>
                </Card>
            </div>
        )
    }

    // Identify if the host gave them Full Admin view or Limited "View Only"
    const isLimited = sessionData.nominee_access_level === 'limited'

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Minimalist Top Nav for Nominee */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-100 dark:bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-foreground leading-tight">Emergency Access</h1>
                            <p className="text-[10px] text-primary dark:text-accent font-semibold uppercase tracking-wider">
                                Verified Nominee Session
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{sessionData.nominee_name}</p>
                            <p className="text-xs text-slate-500">Access Level: {isLimited ? 'Restricted' : 'Full Overview'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Close Session</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
                {/* Warning Banner */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h3 className="font-medium text-amber-900 dark:text-amber-200">Read-Only Portfolio Mode</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                            You are viewing this data because the portfolio owner was flagged as inactive. You cannot modify any entries or transfer assets directly through this interface. This information is provided to assist you in managing the estate.
                        </p>
                    </div>
                </div>

                {/* We can re-use the Phase 4 aggregate logic here because the scope of the data needed is identical: "Show me all their active accounts" */}
                {/* We pass the portfolio owner's ID so it grabs the host's data, not the nominee's */}
                <FamilyMemberSummaryDashboard memberUserId={sessionData.user_id} />

            </main>
        </div>
    )
}
