import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export const dynamic = 'force-dynamic'

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

        // Fetch holdings
        const { data: holdings, error: holdingsError } = await supabase
            .from('holdings')
            .select('quantity, avg_buy_price')
            .eq('user_id', user.id)

        if (holdingsError) {
            console.error('Holdings fetch error:', holdingsError)
        }

        // Calculate totals from holdings
        let totalInvested = 0
        const holdingsCount = holdings?.length ?? 0

        if (holdings && holdings.length > 0) {
            totalInvested = holdings.reduce((sum, h) => {
                const qty = Number(h.quantity) || 0
                const price = Number(h.avg_buy_price) || 0
                return sum + (qty * price)
            }, 0)
        }

        // For now, totalValue = totalInvested (no live pricing yet)
        const totalValue = totalInvested
        const totalPnL = totalValue - totalInvested // Will be 0 until live pricing

        // Fetch nominees count
        const { count: nomineesCount, error: nomineesError } = await supabase
            .from('nominees')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (nomineesError) {
            console.error('Nominees count error:', nomineesError)
        }

        // Fetch inactivity config for last activity
        const { data: inactivityConfig, error: inactivityError } = await supabase
            .from('inactivity_config')
            .select('last_activity_at')
            .eq('user_id', user.id)
            .single()

        if (inactivityError && inactivityError.code !== 'PGRST116') {
            console.error('Inactivity config fetch error:', inactivityError)
        }

        return NextResponse.json({
            totalInvested,
            totalValue,
            totalPnL,
            holdingsCount,
            nomineesCount: nomineesCount ?? 0,
            lastActivityAt: inactivityConfig?.last_activity_at ?? null,
        })
    } catch (error) {
        console.error('Dashboard summary error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
