import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { calculateInterest } from '@/lib/interest'
import { encrypt, decrypt, encryptFields, decryptFields, encryptNumericFields, decryptNumericFields } from '@/src/lib/encryption'

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

        const { data: receivables, error } = await supabase
            .from('receivables')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Receivables fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch receivables' },
                { status: 500 }
            )
        }

        let decryptedReceivables = receivables?.map(receivable => decryptFields(receivable, [
            'given_to', 'relationship', 'contact_number', 'email', 'purpose', 
            'agreement_reference', 'notes'
        ]))
        
        decryptedReceivables = decryptedReceivables?.map(receivable => decryptNumericFields(receivable, [
            'principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount'
        ]))

        return NextResponse.json({ receivables: decryptedReceivables ?? [] })
    } catch (error) {
        console.error('Receivables GET error:', error)
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
            given_to,
            relationship,
            contact_number,
            email,
            principal_amount,
            interest_rate,
            interest_type,
            interest_start_date,
            interest_end_date,
            total_receivable,
            amount_received,
            given_date,
            expected_return_date,
            purpose,
            has_written_agreement,
            agreement_reference,
            reminder_enabled,
            notes
        } = body

        // Validation
        if (!given_to || !given_date) {
            return NextResponse.json(
                { error: 'Missing required fields: given_to, given_date' },
                { status: 400 }
            )
        }

        if (Number(principal_amount) < 0) {
            return NextResponse.json(
                { error: 'Principal amount cannot be negative' },
                { status: 400 }
            )
        }

        const principal = Number(principal_amount)
        const rate = interest_rate ? Number(interest_rate) : null
        const type = interest_type || 'simple'
        
        // Calculate interest if rate is provided
        let interest_amount = 0
        let calculated_total = principal
        
        if (rate && rate > 0) {
            const startDate = interest_start_date || given_date
            interest_amount = calculateInterest(principal, rate, type, startDate, interest_end_date)
            calculated_total = principal + interest_amount
        }

        // Use provided total or calculated total
        const finalTotalReceivable = total_receivable ? Number(total_receivable) : calculated_total
        const finalAmountReceived = amount_received ? Number(amount_received) : 0

        if (finalAmountReceived < 0) {
            return NextResponse.json({ error: 'Amount received cannot be negative' }, { status: 400 })
        }

        if (finalAmountReceived > finalTotalReceivable) {
            return NextResponse.json({ error: 'Received amount cannot exceed total receivable' }, { status: 400 })
        }

        // Determine status
        let status = 'pending'
        let actual_return_date = null
        if (finalAmountReceived > 0 && finalAmountReceived < finalTotalReceivable) {
            status = 'partial'
        } else if (finalAmountReceived === finalTotalReceivable && finalTotalReceivable > 0) {
            status = 'received'
            actual_return_date = new Date().toISOString().split('T')[0]
        }

        const newReceivableData = encryptNumericFields(encryptFields({
            user_id: user.id,
            given_to,
            relationship: relationship || null,
            contact_number: contact_number || null,
            email: email || null,
            principal_amount: principal,
            interest_rate: rate,
            interest_type: rate && rate > 0 ? type : null,
            interest_start_date: rate && rate > 0 ? (interest_start_date || given_date) : null,
            interest_end_date: rate && rate > 0 ? interest_end_date : null,
            interest_amount,
            last_interest_calculated_at: rate && rate > 0 ? new Date().toISOString() : null,
            total_receivable: finalTotalReceivable,
            amount_received: finalAmountReceived,
            outstanding_amount: finalTotalReceivable - finalAmountReceived,
            given_date,
            expected_return_date: expected_return_date || null,
            actual_return_date,
            purpose: purpose || null,
            status,
            has_written_agreement: !!has_written_agreement,
            agreement_reference: agreement_reference || null,
            reminder_enabled: !!reminder_enabled,
            notes: notes || null
        }, [
            'given_to', 'relationship', 'contact_number', 'email', 'purpose', 
            'agreement_reference', 'notes'
        ]), [
            'principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount'
        ]);

        const { data: receivable, error } = await supabase
            .from('receivables')
            .insert(newReceivableData)
            .select()
            .single()

        if (error) {
            console.error('Receivable insert error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to create receivable' },
                { status: 500 }
            )
        }

        let decryptedReceivable = decryptFields(receivable, [
            'given_to', 'relationship', 'contact_number', 'email', 'purpose', 
            'agreement_reference', 'notes'
        ])
        
        decryptedReceivable = decryptNumericFields(decryptedReceivable, [
            'principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount'
        ])

        return NextResponse.json({ receivable: decryptedReceivable }, { status: 201 })
    } catch (error) {
        console.error('Receivables POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
