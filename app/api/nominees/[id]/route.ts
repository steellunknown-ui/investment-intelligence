import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { encrypt, decrypt } from '@/src/lib/encryption'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const nomineeId = params.id
        const body = await request.json()
        const { name, relationship, access_level } = body

        // Update only allowed fields (not email or is_verified)
        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = encrypt(name)
        if (relationship !== undefined) updateData.relationship = relationship
        if (access_level !== undefined) updateData.access_level = access_level
        updateData.updated_at = new Date().toISOString()

        const { data: nominee, error } = await supabase
            .from('nominees')
            .update(updateData)
            .eq('id', nomineeId)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Nominees update error:', error)
            return NextResponse.json(
                { error: 'Failed to update nominee' },
                { status: 500 }
            )
        }

        const decryptedNominee = {
            ...nominee,
            name: decrypt(nominee.name),
            email: decrypt(nominee.email),
            nominee_phone: decrypt(nominee.nominee_phone),
            aadhaar_hash: decrypt(nominee.aadhaar_hash),
            pan_hash: decrypt(nominee.pan_hash)
        }

        return NextResponse.json({ nominee: decryptedNominee })
    } catch (error) {
        console.error('Nominees PATCH error:', error)
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

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const nomineeId = params.id

        const { error } = await supabase
            .from('nominees')
            .delete()
            .eq('id', nomineeId)
            .eq('user_id', user.id)

        if (error) {
            console.error('Nominees delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete nominee' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Nominees DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
