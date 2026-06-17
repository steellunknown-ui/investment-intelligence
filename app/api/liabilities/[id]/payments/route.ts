import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { encryptFields, decryptFields, encryptNumericFields, decryptNumericFields } from '@/src/lib/encryption'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id } = params // liability_id

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        // Verify ownership of liability
        const { data: liability, error: liabilityError } = await supabase
            .from('liabilities')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (liabilityError || !liability) {
            return NextResponse.json(
                { error: 'Liability not found' },
                { status: 404 }
            )
        }

        const { data: payments, error } = await supabase
            .from('liability_payments')
            .select('*')
            .eq('liability_id', id)
            .order('payment_date', { ascending: false })

        if (error) {
            console.error('Liability payments fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch payments' },
                { status: 500 }
            )
        }

        let decryptedPayments = payments?.map(payment => decryptFields(payment, [
            'reference_number', 'notes'
        ]))
        
        decryptedPayments = decryptedPayments?.map(payment => decryptNumericFields(payment, ['amount']))

        return NextResponse.json({ payments: decryptedPayments ?? [] })
    } catch (error) {
        console.error('Liability payments GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id } = params // liability_id

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
            payment_date,
            amount,
            principal_component,
            interest_component,
            payment_mode,
            reference_number,
            outstanding_after_payment,
            status,
            notes
        } = body

        if (!payment_date || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: payment_date, amount' },
                { status: 400 }
            )
        }

        if (Number(amount) <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            )
        }

        // Verify ownership
        const { data: liability, error: liabilityError } = await supabase
            .from('liabilities')
            .select('id, outstanding_amount')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (liabilityError || !liability) {
            return NextResponse.json(
                { error: 'Liability not found' },
                { status: 404 }
            )
        }

        // Prepare Payment Data
        let paymentData = encryptFields({
            user_id: user.id,
            liability_id: id,
            payment_date,
            amount: Number(amount),
            principal_component: principal_component ? Number(principal_component) : null,
            interest_component: interest_component ? Number(interest_component) : null,
            payment_mode,
            reference_number,
            outstanding_after_payment: outstanding_after_payment ? Number(outstanding_after_payment) : null,
            status: status || 'completed',
            notes
        }, ['reference_number', 'notes'])

        paymentData = encryptNumericFields(paymentData, ['amount', 'principal_component', 'interest_component', 'outstanding_after_payment'])

        // Insert Payment
        const { data: payment, error: insertError } = await supabase
            .from('liability_payments')
            .insert(paymentData)
            .select()
            .single()

        if (insertError) {
            console.error('Payment insert error:', insertError)
            return NextResponse.json(
                { error: insertError.message || 'Failed to record payment' },
                { status: 500 }
            )
        }

        // Auto-update liability outstanding amount if provided
        if (outstanding_after_payment !== undefined && outstanding_after_payment !== null) {
            const newOutstanding = Number(outstanding_after_payment)
            const updates: any = { outstanding_amount: newOutstanding }

            if (newOutstanding === 0) {
                updates.status = 'closed'
            }

            const { error: updateError } = await supabase
                .from('liabilities')
                .update(updates)
                .eq('id', id)

            if (updateError) {
                console.error('Failed to auto-update liability outstanding:', updateError)
                // We don't fail the request since payment was recorded
            }
        }

        return NextResponse.json({ payment }, { status: 201 })
    } catch (error) {
        console.error('Liability payment POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
