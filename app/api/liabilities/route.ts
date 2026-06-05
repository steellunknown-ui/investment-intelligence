import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { createAlert } from '@/lib/alerts'
import { encrypt, decrypt } from '@/src/lib/encryption'

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

        const { data: liabilities, error } = await supabase
            .from('liabilities')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Liabilities fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch liabilities' },
                { status: 500 }
            )
        }

        const decryptedLiabilities = liabilities?.map(liability => ({
            ...liability,
            account_number: decrypt(liability.account_number),
            auto_debit_account: decrypt(liability.auto_debit_account),
            collateral_details: decrypt(liability.collateral_details),
            notes: decrypt(liability.notes)
        }))

        return NextResponse.json({ liabilities: decryptedLiabilities ?? [] })
    } catch (error) {
        console.error('Liabilities GET error:', error)
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
            loan_type,
            loan_name,
            taken_from,
            lender_type,
            principal_amount,
            interest_rate,
            interest_type,
            outstanding_amount,
            emi_amount,
            loan_start_date,
            loan_end_date,
            tenure_months,
            emi_due_day,
            auto_debit_account,
            is_secured,
            collateral_type,
            collateral_details,
            status,
            linked_asset_id,
            account_number,
            notes
        } = body

        // Validation
        if (!loan_type || !taken_from) {
            return NextResponse.json(
                { error: 'Missing required fields: loan_type, taken_from' },
                { status: 400 }
            )
        }

        if (Number(principal_amount) < 0 || Number(outstanding_amount) < 0) {
            return NextResponse.json({ error: 'Amounts cannot be negative' }, { status: 400 })
        }

        if (emi_due_day && (emi_due_day < 1 || emi_due_day > 31)) {
            return NextResponse.json({ error: 'EMI due day must be between 1 and 31' }, { status: 400 })
        }

        if (linked_asset_id) {
            // Verify linked asset belongs to user
            const { data: asset } = await supabase
                .from('assets')
                .select('id')
                .eq('id', linked_asset_id)
                .eq('user_id', user.id)
                .single()

            if (!asset) {
                return NextResponse.json({ error: 'Linked asset not found or not owned by you' }, { status: 400 })
            }
        }

        const { data: liability, error } = await supabase
            .from('liabilities')
            .insert({
                user_id: user.id,
                loan_type,
                loan_name,
                taken_from,
                lender_type,
                principal_amount: Number(principal_amount),
                interest_rate: interest_rate ? Number(interest_rate) : null,
                interest_type,
                outstanding_amount: Number(outstanding_amount),
                emi_amount: emi_amount ? Number(emi_amount) : null,
                loan_start_date: loan_start_date || null,
                loan_end_date: loan_end_date || null,
                tenure_months: tenure_months ? Number(tenure_months) : null,
                emi_due_day: emi_due_day ? Number(emi_due_day) : null,
                auto_debit_account: encrypt(auto_debit_account),
                is_secured: !!is_secured,
                collateral_type: collateral_type || null,
                collateral_details: encrypt(collateral_details || null),
                status: status || 'active',
                linked_asset_id: linked_asset_id || null,
                account_number: encrypt(account_number),
                notes: encrypt(notes || null)
            })
            .select()
            .single()

        if (error) {
            console.error('Liability insert error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to create liability' },
                { status: 500 }
            )
        }

        // Create notification alert
        await createAlert(supabase, {
            userId: user.id,
            type: 'success',
            title: 'Liability Recorded',
            message: `New liability "${loan_name || loan_type}" from ${taken_from} has been recorded.`
        });

        const decryptedLiability = {
            ...liability,
            account_number: decrypt(liability.account_number),
            auto_debit_account: decrypt(liability.auto_debit_account),
            collateral_details: decrypt(liability.collateral_details),
            notes: decrypt(liability.notes)
        }

        return NextResponse.json({ liability: decryptedLiability }, { status: 201 })
    } catch (error) {
        console.error('Liabilities POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
