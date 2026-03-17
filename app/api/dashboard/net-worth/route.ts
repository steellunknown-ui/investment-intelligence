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

        // Fetch data from multiple tables in parallel
        const [
            { data: bankAccounts, count: bankCount },
            { data: assets, count: assetsCount },
            { data: belongings, count: belongingsCount },
            { data: receivables, count: receivablesCount },
            { data: liabilities, count: liabilitiesCount }
        ] = await Promise.all([
            // 1. Bank Accounts (Sum Current Balance)
            supabase.from('bank_accounts').select('current_balance', { count: 'exact', head: false }).eq('user_id', user.id).eq('status', 'active'),

            // 2. Assets (Sum Current Market Value)
            supabase.from('assets').select('current_market_value', { count: 'exact', head: false }).eq('user_id', user.id),

            // 3. Belongings (Sum Current Estimated Value)
            supabase.from('belongings').select('current_estimated_value', { count: 'exact', head: false }).eq('user_id', user.id).in('status', ['in_possession', 'in_locker']),

            // 4. Receivables (Sum Outstanding Amount) - money owed TO user
            supabase.from('receivables').select('outstanding_amount', { count: 'exact', head: false }).eq('user_id', user.id).in('status', ['pending', 'partial']),

            // 5. Liabilities (Sum Outstanding Amount) - money owed BY user
            supabase.from('liabilities').select('outstanding_amount', { count: 'exact', head: false }).eq('user_id', user.id).eq('status', 'active')
        ])

        // Calculate Totals
        const bankBalanceTotal = bankAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0
        const assetsTotalValue = assets?.reduce((sum, a) => sum + (a.current_market_value || 0), 0) || 0
        const belongingsTotalValue = belongings?.reduce((sum, b) => sum + (b.current_estimated_value || 0), 0) || 0
        const receivablesOutstandingTotal = receivables?.reduce((sum, r) => sum + (r.outstanding_amount || 0), 0) || 0
        const liabilitiesOutstandingTotal = liabilities?.reduce((sum, l) => sum + (l.outstanding_amount || 0), 0) || 0

        // Net Worth Formula
        // (Liquid Cash + Investments/Assets + Valuables + Money Owed To You) - (Debts)
        const netWorth = (bankBalanceTotal + assetsTotalValue + belongingsTotalValue + receivablesOutstandingTotal) - liabilitiesOutstandingTotal

        const summary: any = {
            bankBalanceTotal,
            assetsTotalValue,
            belongingsTotalValue,
            receivablesOutstandingTotal,
            liabilitiesOutstandingTotal,
            
            // New specific fields
            assets_value: assetsTotalValue,
            assets_count: assetsCount || 0,
            belongings_value: belongingsTotalValue,
            belongings_count: belongingsCount || 0,
            bank_balance: bankBalanceTotal,
            bank_accounts: bankCount || 0,
            receivables_total: receivablesOutstandingTotal,
            receivables_count: receivablesCount || 0,
            liabilities_total: liabilitiesOutstandingTotal,
            liabilities_count: liabilitiesCount || 0,

            netWorth,
            updatedAt: new Date().toISOString()
        }

        return NextResponse.json(summary)
    } catch (error) {
        console.error('Net Worth API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
