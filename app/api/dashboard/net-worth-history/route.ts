import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { decryptNumber, encryptNumber } from '@/src/lib/encryption'

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
            .select("snapshot_date, net_worth, bank_balance, assets_value, belongings_value, receivables_value, liabilities_value")
            .eq("user_id", user.id)
            .gte("snapshot_date", thirtyDaysAgo.toISOString().split("T")[0])
            .order("snapshot_date", { ascending: true })

        if (error) {
            console.error("Error fetching snapshots:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform data to include total_assets and total_liabilities for chart
        const transformedSnapshots = (snapshots || []).map(s => {
            const net_worth = decryptNumber(s.net_worth as string) || 0
            const bank_balance = decryptNumber(s.bank_balance as string) || 0
            const assets_value = decryptNumber(s.assets_value as string) || 0
            const belongings_value = decryptNumber(s.belongings_value as string) || 0
            const receivables_value = decryptNumber(s.receivables_value as string) || 0
            const liabilities_value = decryptNumber(s.liabilities_value as string) || 0

            return {
                snapshot_date: s.snapshot_date,
                net_worth: net_worth,
                total_assets: bank_balance + assets_value + belongings_value + receivables_value,
                total_liabilities: liabilities_value
            }
        })

        return NextResponse.json({
            snapshots: transformedSnapshots,
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

        type BankAccount = { current_balance: string | number | null }
        type Asset = { current_market_value: string | number | null }
        type Belonging = { current_estimated_value: string | number | null }
        type Receivable = { outstanding_amount: string | number | null }
        type Liability = { outstanding_amount: string | number | null }

        const bankBalance = (bankAccounts as BankAccount[] || []).reduce((sum: number, a: BankAccount) => sum + (decryptNumber(a.current_balance as string) || 0), 0)
        const assetsValue = (assets as Asset[] || []).reduce((sum: number, a: Asset) => sum + (decryptNumber(a.current_market_value as string) || 0), 0)
        const belongingsValue = (belongings as Belonging[] || []).reduce((sum: number, b: Belonging) => sum + (decryptNumber(b.current_estimated_value as string) || 0), 0)
        const receivablesValue = (receivables as Receivable[] || []).reduce((sum: number, r: Receivable) => sum + (decryptNumber(r.outstanding_amount as string) || 0), 0)
        const liabilitiesValue = (liabilities as Liability[] || []).reduce((sum: number, l: Liability) => sum + (decryptNumber(l.outstanding_amount as string) || 0), 0)

        const netWorth = bankBalance + assetsValue + belongingsValue + receivablesValue - liabilitiesValue

        const today = new Date().toISOString().split("T")[0]

        // Upsert today's snapshot
        const { data, error } = await supabase
            .from("net_worth_snapshots")
            .upsert({
                user_id: user.id,
                snapshot_date: today,
                net_worth: encryptNumber(netWorth.toString()),
                bank_balance: encryptNumber(bankBalance.toString()),
                assets_value: encryptNumber(assetsValue.toString()),
                belongings_value: encryptNumber(belongingsValue.toString()),
                receivables_value: encryptNumber(receivablesValue.toString()),
                liabilities_value: encryptNumber(liabilitiesValue.toString())
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
