import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { encrypt, decrypt, encryptFields, decryptFields, encryptNumericFields, decryptNumericFields } from '@/src/lib/encryption'

export const dynamic = 'force-dynamic'

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
        if (sanitizedBody.ownership_percentage !== undefined && (Number(sanitizedBody.ownership_percentage) < 0 || Number(sanitizedBody.ownership_percentage) > 100)) {
            return NextResponse.json({ error: 'Ownership percentage must be between 0 and 100' }, { status: 400 })
        }

        let updateData = encryptFields({ ...sanitizedBody }, [
            'asset_name', 'owner_name', 'property_address', 'registration_number', 
            'vehicle_registration', 'vehicle_make', 'vehicle_model', 'loan_provider', 
            'document_reference', 'location', 'notes'
        ])
        
        updateData = encryptNumericFields(updateData, ['current_market_value'])

        const { data: asset, error } = await supabase
            .from('assets')
            .update(updateData)
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

        let decryptedAsset = decryptFields(asset, [
            'asset_name', 'owner_name', 'property_address', 'registration_number', 
            'vehicle_registration', 'vehicle_make', 'vehicle_model', 'loan_provider', 
            'document_reference', 'location', 'notes'
        ])
        
        decryptedAsset = decryptNumericFields(decryptedAsset, ['current_market_value'])

        return NextResponse.json({ asset: decryptedAsset })
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
