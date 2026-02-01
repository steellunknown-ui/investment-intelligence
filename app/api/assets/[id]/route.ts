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
        const dateFields = ['purchase_date', 'registration_date', 'due_date', 'warranty_expiry']
        for (const field of dateFields) {
            if (sanitizedBody[field] === '' || sanitizedBody[field] === undefined) {
                sanitizedBody[field] = null
            }
        }

        // Basic Validation
        if (sanitizedBody.ownership_percentage !== undefined && (Number(sanitizedBody.ownership_percentage) < 0 || Number(sanitizedBody.ownership_percentage) > 100)) {
            return NextResponse.json({ error: 'Ownership percentage must be between 0 and 100' }, { status: 400 })
        }

        const { data: asset, error } = await supabase
            .from('assets')
            .update(sanitizedBody)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Asset update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update asset' },
                { status: 500 }
            )
        }

        return NextResponse.json({ asset })
    } catch (error) {
        console.error('Asset PATCH error:', error)
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
            .from('assets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Asset delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete asset' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Asset DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
