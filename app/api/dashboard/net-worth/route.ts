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

        // Fetch data from multiple tables in parallel
        const [
            { data: bankAccounts },
            { data: assets },
            { data: belongings },
            { data: receivables },
            { data: liabilities }
        ] = await Promise.all([
            // 1. Bank Accounts (Sum Current Balance)
            supabase.from('bank_accounts').select('current_balance').eq('user_id', user.id).eq('status', 'active'),

            // 2. Assets (Sum Current Market Value)
            supabase.from('assets').select('current_market_value').eq('user_id', user.id), // assuming all statuses count for now, or filter active? Let's take all.

            // 3. Belongings (Sum Current Estimated Value)
            supabase.from('belongings').select('current_estimated_value').eq('user_id', user.id).in('status', ['in_possession', 'in_locker']),

            // 4. Receivables (Sum Outstanding Amount) - money owed TO user
            supabase.from('receivables').select('outstanding_amount').eq('user_id', user.id).in('status', ['pending', 'partial']),

            // 5. Liabilities (Sum Outstanding Amount) - money owed BY user
            supabase.from('liabilities').select('outstanding_amount').eq('user_id', user.id).eq('status', 'active')
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

        const summary = {
            bankBalanceTotal,
            assetsTotalValue,
            belongingsTotalValue,
            receivablesOutstandingTotal,
            liabilitiesOutstandingTotal,
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
