import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

/**
 * GET /api/dashboard/net-worth-history
 * Fetches the last 30 days of net worth snapshots for the chart
 */
export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get last 30 days of snapshots
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: snapshots, error } = await supabase
            .from("net_worth_snapshots")
            .select("snapshot_date, net_worth")
            .eq("user_id", user.id)
            .gte("snapshot_date", thirtyDaysAgo.toISOString().split("T")[0])
            .order("snapshot_date", { ascending: true })

        if (error) {
            console.error("Error fetching snapshots:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            snapshots: snapshots || [],
            period: "30d"
        })
    } catch (err) {
        console.error("Net worth history error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}

/**
 * POST /api/dashboard/net-worth-history
 * Records today's net worth snapshot (upsert)
 */
export async function POST() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch current net worth data
        const [
            { data: bankAccounts },
            { data: assets },
            { data: belongings },
            { data: receivables },
            { data: liabilities }
        ] = await Promise.all([
            supabase.from("bank_accounts").select("current_balance").eq("user_id", user.id).eq("status", "active"),
            supabase.from("assets").select("current_market_value").eq("user_id", user.id),
            supabase.from("belongings").select("current_estimated_value").eq("user_id", user.id),
            supabase.from("receivables").select("outstanding_amount").eq("user_id", user.id).eq("status", "pending"),
            supabase.from("liabilities").select("outstanding_amount").eq("user_id", user.id).eq("status", "active")
        ])

        type BankAccount = { current_balance: number | null }
        type Asset = { current_market_value: number | null }
        type Belonging = { current_estimated_value: number | null }
        type Receivable = { outstanding_amount: number | null }
        type Liability = { outstanding_amount: number | null }

        const bankBalance = (bankAccounts as BankAccount[] || []).reduce((sum: number, a: BankAccount) => sum + (Number(a.current_balance) || 0), 0)
        const assetsValue = (assets as Asset[] || []).reduce((sum: number, a: Asset) => sum + (Number(a.current_market_value) || 0), 0)
        const belongingsValue = (belongings as Belonging[] || []).reduce((sum: number, b: Belonging) => sum + (Number(b.current_estimated_value) || 0), 0)
        const receivablesValue = (receivables as Receivable[] || []).reduce((sum: number, r: Receivable) => sum + (Number(r.outstanding_amount) || 0), 0)
        const liabilitiesValue = (liabilities as Liability[] || []).reduce((sum: number, l: Liability) => sum + (Number(l.outstanding_amount) || 0), 0)

        const netWorth = bankBalance + assetsValue + belongingsValue + receivablesValue - liabilitiesValue

        const today = new Date().toISOString().split("T")[0]

        // Upsert today's snapshot
        const { data, error } = await supabase
            .from("net_worth_snapshots")
            .upsert({
                user_id: user.id,
                snapshot_date: today,
                net_worth: netWorth,
                bank_balance: bankBalance,
                assets_value: assetsValue,
                belongings_value: belongingsValue,
                receivables_value: receivablesValue,
                liabilities_value: liabilitiesValue
            }, {
                onConflict: "user_id,snapshot_date"
            })
            .select()
            .single()

        if (error) {
            console.error("Error saving snapshot:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ snapshot: data })
    } catch (err) {
        console.error("Snapshot save error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
