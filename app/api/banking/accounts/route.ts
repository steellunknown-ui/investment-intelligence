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

        const { data: accounts, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Bank accounts fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch bank accounts' },
                { status: 500 }
            )
        }

        return NextResponse.json({ accounts: accounts ?? [] })
    } catch (error) {
        console.error('Bank accounts GET error:', error)
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
            account_number,
            bank_name,
            branch_name,
            ifsc_code,
            account_type,
            account_holder_name,
            is_joint_account,
            joint_holder_name,
            current_balance,
            balance_as_of,
            account_nominee_name,
            account_nominee_relationship,
            status,
            linked_mobile,
            net_banking_enabled,
            debit_card_number,
            notes
        } = body

        // Validate required fields
        if (!account_number || !bank_name || !ifsc_code || !account_holder_name) {
            return NextResponse.json(
                { error: 'Missing required fields: account_number, bank_name, ifsc_code, account_holder_name' },
                { status: 400 }
            )
        }

        if (Number(current_balance) < 0) {
            return NextResponse.json(
                { error: 'Balance cannot be negative' },
                { status: 400 }
            )
        }

        if (is_joint_account && !joint_holder_name) {
            return NextResponse.json(
                { error: 'Joint holder name is required for joint accounts' },
                { status: 400 }
            )
        }

        const { data: account, error } = await supabase
            .from('bank_accounts')
            .insert({
                user_id: user.id,
                account_number,
                bank_name,
                branch_name,
                ifsc_code,
                account_type: account_type || 'savings',
                account_holder_name,
                is_joint_account: !!is_joint_account,
                joint_holder_name: joint_holder_name || null,
                current_balance: Number(current_balance) || 0,
                balance_as_of: balance_as_of || new Date().toISOString().split('T')[0],
                account_nominee_name,
                account_nominee_relationship,
                status: status || 'active',
                linked_mobile,
                net_banking_enabled: !!net_banking_enabled,
                debit_card_number,
                notes
            })
            .select()
            .single()

        if (error) {
            console.error('Bank account insert error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to create bank account' },
                { status: 500 }
            )
        }

        return NextResponse.json({ account }, { status: 201 })
    } catch (error) {
        console.error('Bank accounts POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
