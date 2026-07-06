import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { calculateInterest } from '@/lib/interest'
import { encrypt, decrypt, encryptFields, decryptFields, encryptNumericFields, decryptNumericFields } from '@/src/lib/encryption'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id } = params

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const body = await request.json()

        // Sanitize empty strings to null (only for fields that exist in body)
        for (const key of Object.keys(body)) {
            if (body[key] === '') {
                body[key] = null
            }
        }

        // Fetch current state to validate logic
        const { data: current, error: fetchError } = await supabase
            .from('receivables')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (!current) {
            return NextResponse.json({ error: 'Receivable not found' }, { status: 404 })
        }

        // Decrypt current record before using its values
        let decryptedCurrent = decryptFields(current, [
            'given_to', 'relationship', 'contact_number', 'email', 'purpose', 
            'agreement_reference', 'notes'
        ])
        
        decryptedCurrent = decryptNumericFields(decryptedCurrent, [
            'principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount'
        ])

        // Logic for Amount Updates
        let updates = { ...body }

        // Recalculate interest if relevant fields changed
        if (body.principal_amount !== undefined || body.interest_rate !== undefined ||
            body.interest_type !== undefined || body.interest_start_date !== undefined ||
            body.interest_end_date !== undefined) {

            const principal = body.principal_amount !== undefined ? Number(body.principal_amount) : decryptedCurrent.principal_amount
            const rate = body.interest_rate !== undefined ? Number(body.interest_rate) : decryptedCurrent.interest_rate
            const type = body.interest_type || decryptedCurrent.interest_type || 'simple'
            const startDate = body.interest_start_date || decryptedCurrent.interest_start_date
            const endDate = body.interest_end_date || decryptedCurrent.interest_end_date

            if (rate && rate > 0 && startDate) {
                const interest_amount = calculateInterest(principal, rate, type, startDate, endDate)
                updates.interest_amount = interest_amount
                updates.last_interest_calculated_at = new Date().toISOString()

                // Update total receivable if not explicitly provided
                if (body.total_receivable === undefined) {
                    updates.total_receivable = principal + interest_amount
                }
            } else {
                updates.interest_amount = 0
                if (body.total_receivable === undefined) {
                    updates.total_receivable = principal
                }
            }
        }

        // If amount_received is being updated
        if (body.amount_received !== undefined) {
            const newReceived = Number(body.amount_received)
            const total = updates.total_receivable !== undefined ? Number(updates.total_receivable) : Number(decryptedCurrent.total_receivable)

            if (newReceived < 0) return NextResponse.json({ error: 'Received amount cannot be negative' }, { status: 400 })
            if (newReceived > total) return NextResponse.json({ error: 'Received amount cannot exceed total' }, { status: 400 })

            updates.outstanding_amount = total - newReceived

            // Auto-update status
            if (newReceived === total && total > 0) {
                updates.status = 'received'
                // Set actual return date only if not already present
                if (!current.actual_return_date && !body.actual_return_date) {
                    updates.actual_return_date = new Date().toISOString().split('T')[0]
                }
            } else if (newReceived > 0) {
                updates.status = 'partial'
                // If moving back from received, clear return date? Maybe user wants to keep history, but typically if it's partial it's not "returned".
                // Let's decide to clear actual_return_date if status goes back to partial/pending
                if (decryptedCurrent.status === 'received') {
                    updates.actual_return_date = null
                }
            } else {
                updates.status = 'pending'
                updates.actual_return_date = null
            }
        }

        let updateData = encryptFields({ ...updates }, [
            'given_to', 'relationship', 'contact_number', 'email', 'purpose', 
            'agreement_reference', 'notes'
        ])
        
        updateData = encryptNumericFields(updateData, [
            'principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount'
        ])

        const { data: receivable, error } = await supabase
            .from('receivables')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Receivable update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update receivable' },
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

        return NextResponse.json({ receivable: decryptedReceivable })
    } catch (error) {
        console.error('Receivable PATCH error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id } = params

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const { error } = await supabase
            .from('receivables')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Receivable delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete receivable' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Receivable DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
