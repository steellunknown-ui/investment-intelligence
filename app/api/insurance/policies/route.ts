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

        const { data: policies, error } = await supabase
            .from('insurance_policies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Insurance policies fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch policies' },
                { status: 500 }
            )
        }

        return NextResponse.json({ policies: policies ?? [] })
    } catch (error) {
        console.error('Insurance policies GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
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

        const body = await request.json()
        const {
            policy_number,
            policy_type,
            provider_name,
            sum_insured,
            premium_amount,
            premium_frequency,
            start_date,
            policy_name,
            end_date,
            maturity_date,
            next_premium_due,
            insured_name,
            insured_relationship,
            policy_nominee_name,
            policy_nominee_relationship,
            status,
            agent_name,
            agent_contact,
            notes
        } = body

        // Validate required fields
        if (!policy_number || !policy_type || !provider_name || !start_date) {
            return NextResponse.json(
                { error: 'Missing required fields: policy_number, policy_type, provider_name, start_date' },
                { status: 400 }
            )
        }

        if (Number(sum_insured) < 0 || Number(premium_amount) < 0) {
            return NextResponse.json(
                { error: 'Amounts cannot be negative' },
                { status: 400 }
            )
        }

        if (premium_frequency && !['monthly', 'quarterly', 'half_yearly', 'yearly'].includes(premium_frequency)) {
            return NextResponse.json(
                { error: 'Invalid premium frequency' },
                { status: 400 }
            )
        }

        const { data: policy, error } = await supabase
            .from('insurance_policies')
            .insert({
                user_id: user.id,
                policy_number,
                policy_type,
                provider_name,
                sum_insured: Number(sum_insured) || 0,
                premium_amount: Number(premium_amount) || 0,
                premium_frequency: premium_frequency || 'yearly',
                start_date,
                policy_name,
                end_date: end_date || null,
                maturity_date: maturity_date || null,
                next_premium_due: next_premium_due || null,
                insured_name,
                insured_relationship: insured_relationship || 'self',
                policy_nominee_name,
                policy_nominee_relationship,
                status: status || 'active',
                agent_name,
                agent_contact,
                notes
            })
            .select()
            .single()

        if (error) {
            console.error('Insurance policy insert error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to create policy' },
                { status: 500 }
            )
        }

        return NextResponse.json({ policy }, { status: 201 })
    } catch (error) {
        console.error('Insurance policies POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
