import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

/**
 * GET /api/credit-score
 * Fetches the user's credit profile
 */
export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch credit profile
        const { data: profile, error } = await supabase
            .from("credit_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (which is fine for first time)
            console.error("Error fetching credit profile:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If no profile exists, return default values
        if (!profile) {
            return NextResponse.json({
                profile: {
                    estimated_monthly_income: 0,
                    income_source: 'salary',
                    employment_type: 'salaried',
                    employer_name: '',
                    years_employed: 0,
                    existing_credit_cards: 0,
                    total_credit_limit: 0,
                    credit_utilization_percent: 0,
                    has_missed_payments: false,
                    missed_payments_count: 0,
                    oldest_account_years: 0,
                    calculated_score: null,
                    score_calculated_at: null
                },
                exists: false
            })
        }

        return NextResponse.json({ profile, exists: true })
    } catch (err) {
        console.error("Credit profile error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}

/**
 * PUT /api/credit-score
 * Updates or creates the user's credit profile
 */
export async function PUT(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()

        // Upsert the credit profile
        const { data, error } = await supabase
            .from("credit_profiles")
            .upsert({
                user_id: user.id,
                estimated_monthly_income: body.estimated_monthly_income || 0,
                income_source: body.income_source || 'salary',
                employment_type: body.employment_type || 'salaried',
                employer_name: body.employer_name || null,
                years_employed: body.years_employed || 0,
                existing_credit_cards: body.existing_credit_cards || 0,
                total_credit_limit: body.total_credit_limit || 0,
                credit_utilization_percent: body.credit_utilization_percent || 0,
                has_missed_payments: body.has_missed_payments || false,
                missed_payments_count: body.missed_payments_count || 0,
                oldest_account_years: body.oldest_account_years || 0
            }, {
                onConflict: "user_id"
            })
            .select()
            .single()

        if (error) {
            console.error("Error updating credit profile:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: data })
    } catch (err) {
        console.error("Credit profile update error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
