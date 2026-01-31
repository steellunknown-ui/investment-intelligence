import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { calculateCreditScore, calculateEligibility, CreditScoreFactors } from '@/lib/credit-score'

/**
 * GET /api/credit-score/calculate
 * Calculates credit score and eligibility based on user's financial data
 */
export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch all required data in parallel
        const [
            { data: creditProfile },
            { data: liabilities },
            { data: assets },
            { data: bankAccounts }
        ] = await Promise.all([
            supabase.from("credit_profiles").select("*").eq("user_id", user.id).single(),
            supabase.from("liabilities").select("outstanding_amount").eq("user_id", user.id).eq("status", "active"),
            supabase.from("assets").select("current_market_value").eq("user_id", user.id),
            supabase.from("bank_accounts").select("current_balance").eq("user_id", user.id).eq("status", "active")
        ])

        // Calculate totals
        type LiabilityRow = { outstanding_amount: number | null }
        type AssetRow = { current_market_value: number | null }
        type BankRow = { current_balance: number | null }

        const totalLiabilities = (liabilities as LiabilityRow[] || []).reduce((sum: number, l: LiabilityRow) => sum + (Number(l.outstanding_amount) || 0), 0)
        const totalAssets = (assets as AssetRow[] || []).reduce((sum: number, a: AssetRow) => sum + (Number(a.current_market_value) || 0), 0)
        const bankBalance = (bankAccounts as BankRow[] || []).reduce((sum: number, b: BankRow) => sum + (Number(b.current_balance) || 0), 0)

        // Build factors for calculation
        const factors: CreditScoreFactors = {
            totalLiabilities,
            totalAssets,
            bankBalance,
            monthlyIncome: creditProfile?.estimated_monthly_income || 0,
            existingCreditCards: creditProfile?.existing_credit_cards || 0,
            totalCreditLimit: creditProfile?.total_credit_limit || 0,
            creditUtilization: creditProfile?.credit_utilization_percent || 0,
            hasMissedPayments: creditProfile?.has_missed_payments || false,
            missedPaymentsCount: creditProfile?.missed_payments_count || 0,
            oldestAccountYears: creditProfile?.oldest_account_years || 0
        }

        // Calculate score
        const scoreResult = calculateCreditScore(factors)

        // Calculate eligibility
        const eligibility = calculateEligibility(
            scoreResult.score,
            factors.monthlyIncome,
            factors.totalLiabilities
        )

        // Update cached score in profile
        if (creditProfile) {
            await supabase
                .from("credit_profiles")
                .update({
                    calculated_score: scoreResult.score,
                    score_calculated_at: new Date().toISOString()
                })
                .eq("user_id", user.id)
        }

        return NextResponse.json({
            score: scoreResult,
            eligibility,
            factors: {
                totalLiabilities,
                totalAssets,
                bankBalance,
                monthlyIncome: factors.monthlyIncome,
                dtiRatio: factors.monthlyIncome > 0
                    ? ((totalLiabilities / (factors.monthlyIncome * 12)) * 100).toFixed(1)
                    : 0
            },
            hasProfile: !!creditProfile,
            calculatedAt: new Date().toISOString()
        })
    } catch (err) {
        console.error("Credit score calculation error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
