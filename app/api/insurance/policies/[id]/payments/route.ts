import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { createAlert } from '@/lib/alerts'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id: policyId } = params

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        // Verify policy ownership first
        const { data: policy, error: policyError } = await supabase
            .from('insurance_policies')
            .select('id')
            .eq('id', policyId)
            .eq('user_id', user.id)
            .single()

        if (policyError || !policy) {
            return NextResponse.json(
                { error: 'Policy not found or access denied' },
                { status: 404 }
            )
        }

        const { data: payments, error } = await supabase
            .from('insurance_payments')
            .select('*')
            .eq('policy_id', policyId)
            .eq('user_id', user.id)
            .order('payment_date', { ascending: false })

        if (error) {
            console.error('Insurance payments fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch payments' },
                { status: 500 }
            )
        }

        return NextResponse.json({ payments: payments ?? [] })
    } catch (error) {
        console.error('Insurance payments GET error:', error)
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
        const { id: policyId } = params

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
            payment_mode,
            reference_number,
            receipt_url,
            notes
        } = body

        if (!payment_date || amount === undefined || Number(amount) < 0) {
            return NextResponse.json(
                { error: 'Invalid payment data' },
                { status: 400 }
            )
        }

        // Fetch policy to get frequency and current next_due_date
        const { data: policy, error: policyError } = await supabase
            .from('insurance_policies')
            .select('*')
            .eq('id', policyId)
            .eq('user_id', user.id)
            .single()

        if (policyError || !policy) {
            return NextResponse.json(
                { error: 'Policy not found or access denied' },
                { status: 404 }
            )
        }

        // Insert payment
        const { data: payment, error: insertError } = await supabase
            .from('insurance_payments')
            .insert({
                user_id: user.id,
                policy_id: policyId,
                payment_date,
                amount: Number(amount),
                payment_mode,
                reference_number,
                receipt_url,
                notes
            })
            .select()
            .single()

        if (insertError) {
            console.error('Payment insert error:', insertError)
            return NextResponse.json(
                { error: 'Failed to record payment' },
                { status: 500 }
            )
        }

        // Update policy next_premium_due
        let nextDueDate = policy.next_premium_due ? new Date(policy.next_premium_due) : new Date(policy.start_date);
        // If date is invalid, fallback to today
        if (isNaN(nextDueDate.getTime())) nextDueDate = new Date();

        const frequency = policy.premium_frequency || 'yearly';

        // Add frequency
        switch (frequency) {
            case 'monthly':
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDueDate.setMonth(nextDueDate.getMonth() + 3);
                break;
            case 'half_yearly':
                nextDueDate.setMonth(nextDueDate.getMonth() + 6);
                break;
            case 'yearly':
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                break;
        }

        const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

        await supabase
            .from('insurance_policies')
            .update({ next_premium_due: nextDueDateStr })
            .eq('id', policyId)

        // Create notification alert
        await createAlert(supabase, {
            userId: user.id,
            type: 'success',
            title: 'Payment Recorded',
            message: `A payment of ₹${amount} for policy ${policy.policy_number} has been recorded.`
        });

        return NextResponse.json({ payment }, { status: 201 })
    } catch (error) {
        console.error('Insurance payment POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
