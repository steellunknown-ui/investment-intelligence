import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { encrypt, decrypt } from '@/src/lib/encryption'

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

        // Basic Validation
        if (sanitizedBody.quantity !== undefined && Number(sanitizedBody.quantity) < 0) {
            return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
        }

        const updateData = { ...sanitizedBody }
        if (updateData.storage_location !== undefined) updateData.storage_location = encrypt(updateData.storage_location)
        if (updateData.bank_locker_details !== undefined) updateData.bank_locker_details = encrypt(updateData.bank_locker_details)
        if (updateData.location_details !== undefined) updateData.location_details = encrypt(updateData.location_details)
        if (updateData.notes !== undefined) updateData.notes = encrypt(updateData.notes)
        if (updateData.insurance_policy_reference !== undefined) updateData.insurance_policy_reference = encrypt(updateData.insurance_policy_reference)

        const { data: belonging, error } = await supabase
            .from('belongings')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Belonging update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update belonging' },
                { status: 500 }
            )
        }

        const decryptedBelonging = {
            ...belonging,
            storage_location: decrypt(belonging.storage_location),
            bank_locker_details: decrypt(belonging.bank_locker_details),
            location_details: decrypt(belonging.location_details),
            notes: decrypt(belonging.notes),
            insurance_policy_reference: decrypt(belonging.insurance_policy_reference)
        }

        return NextResponse.json({ belonging: decryptedBelonging })
    } catch (error) {
        console.error('Belonging PATCH error:', error)
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
            .from('belongings')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Belonging delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete belonging' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Belonging DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
