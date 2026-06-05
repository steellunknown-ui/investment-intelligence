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

        // Sanitize empty date strings to null (only for fields that exist in body)
        const sanitizedBody = { ...body }
        for (const key of Object.keys(sanitizedBody)) {
            if (sanitizedBody[key] === '') {
                sanitizedBody[key] = null
            }
        }

        // Basic Validation
        if (sanitizedBody.principal_amount !== undefined && Number(sanitizedBody.principal_amount) < 0) {
            return NextResponse.json({ error: 'Principal cannot be negative' }, { status: 400 })
        }
        if (sanitizedBody.outstanding_amount !== undefined && Number(sanitizedBody.outstanding_amount) < 0) {
            return NextResponse.json({ error: 'Outstanding cannot be negative' }, { status: 400 })
        }

        const updateData = { ...sanitizedBody }
        if (updateData.account_number !== undefined) updateData.account_number = encrypt(updateData.account_number)
        if (updateData.auto_debit_account !== undefined) updateData.auto_debit_account = encrypt(updateData.auto_debit_account)
        if (updateData.collateral_details !== undefined) updateData.collateral_details = encrypt(updateData.collateral_details)

        const { data: liability, error } = await supabase
            .from('liabilities')
            .update(updateData)
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

        const decryptedLiability = {
            ...liability,
            account_number: decrypt(liability.account_number),
            auto_debit_account: decrypt(liability.auto_debit_account),
            collateral_details: decrypt(liability.collateral_details)
        }

        return NextResponse.json({ liability: decryptedLiability })
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
