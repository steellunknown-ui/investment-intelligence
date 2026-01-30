import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        // Fetch profile onboarding status
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        // Check completion of various modules
        const [
            { count: bankCount },
            { count: assetCount },
            { count: liabilityCount },
            { count: insuranceCount },
            { count: nomineeCount },
            { data: inactivityConfig }
        ] = await Promise.all([
            supabase.from('bank_accounts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('liabilities').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('insurance_policies').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('nominees').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('inactivity_config').select('enabled').eq('user_id', user.id).single()
        ])

        const checklist = {
            hasBankAccount: (bankCount || 0) > 0,
            hasAsset: (assetCount || 0) > 0,
            hasLiability: (liabilityCount || 0) > 0,
            hasInsurancePolicy: (insuranceCount || 0) > 0,
            hasNominee: (nomineeCount || 0) > 0,
            hasInactivityEnabled: inactivityConfig?.enabled || false
        }

        const completedCount = Object.values(checklist).filter(Boolean).length
        const totalCount = Object.keys(checklist).length

        return NextResponse.json({
            onboardingCompleted: profile?.onboarding_completed || false,
            checklist,
            progress: {
                done: completedCount,
                total: totalCount
            }
        })
    } catch (error) {
        console.error('Onboarding status error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
