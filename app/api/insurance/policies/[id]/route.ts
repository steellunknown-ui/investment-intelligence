import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

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
        const sanitizedBody = { ...body }
        for (const key of Object.keys(sanitizedBody)) {
            if (sanitizedBody[key] === '') {
                sanitizedBody[key] = null
            }
        }

        // Validation for numeric fields if present
        if (sanitizedBody.sum_insured !== undefined && Number(sanitizedBody.sum_insured) < 0) {
            return NextResponse.json({ error: 'Sum insured cannot be negative' }, { status: 400 })
        }
        if (sanitizedBody.premium_amount !== undefined && Number(sanitizedBody.premium_amount) < 0) {
            return NextResponse.json({ error: 'Premium amount cannot be negative' }, { status: 400 })
        }
        if (sanitizedBody.premium_frequency && !['monthly', 'quarterly', 'half_yearly', 'yearly'].includes(sanitizedBody.premium_frequency)) {
            return NextResponse.json({ error: 'Invalid premium frequency' }, { status: 400 })
        }

        const { data: policy, error } = await supabase
            .from('insurance_policies')
            .update(sanitizedBody)
            .eq('id', id)
            .eq('user_id', user.id) // Extra safety + RLS
            .select()
            .single()

        if (error) {
            console.error('Insurance policy update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update policy' },
                { status: 500 }
            )
        }

        return NextResponse.json({ policy })
    } catch (error) {
        console.error('Insurance policy PATCH error:', error)
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
            .from('insurance_policies')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Insurance policy delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete policy' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Insurance policy DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
