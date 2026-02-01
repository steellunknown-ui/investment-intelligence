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

        // Sanitize empty date strings to null
        const sanitizedBody = { ...body }
        const dateFields = ['loan_start_date', 'loan_end_date', 'next_payment_date', 'due_date']
        for (const field of dateFields) {
            if (sanitizedBody[field] === '' || sanitizedBody[field] === undefined) {
                sanitizedBody[field] = null
            }
        }

        // Basic Validation
        if (sanitizedBody.principal_amount !== undefined && Number(sanitizedBody.principal_amount) < 0) {
            return NextResponse.json({ error: 'Principal cannot be negative' }, { status: 400 })
        }
        if (sanitizedBody.outstanding_amount !== undefined && Number(sanitizedBody.outstanding_amount) < 0) {
            return NextResponse.json({ error: 'Outstanding cannot be negative' }, { status: 400 })
        }

        const { data: liability, error } = await supabase
            .from('liabilities')
            .update(sanitizedBody)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Liability update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update liability' },
                { status: 500 }
            )
        }

        return NextResponse.json({ liability })
    } catch (error) {
        console.error('Liability PATCH error:', error)
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
            .from('liabilities')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Liability delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete liability' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Liability DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
