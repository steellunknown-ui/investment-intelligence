import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
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

        const { data: belongings, error } = await supabase
            .from('belongings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Belongings fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch belongings' },
                { status: 500 }
            )
        }

        let decryptedBelongings = belongings?.map(belonging => decryptFields(belonging, [
            'item_name', 'description', 'storage_location', 'bank_locker_details', 'location_details', 
            'notes', 'insurance_policy_reference'
        ]))

        decryptedBelongings = decryptedBelongings?.map(belonging => decryptNumericFields(belonging, [
            'weight_grams', 'quantity', 'purchase_value', 'current_estimated_value'
        ]))

        return NextResponse.json({ belongings: decryptedBelongings ?? [] })
    } catch (error) {
        console.error('Belongings GET error:', error)
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
            category,
            item_name,
            description,
            material,
            purity,
            weight_grams,
            quantity,
            purchase_value,
            purchase_date,
            current_estimated_value,
            valuation_date,
            storage_location,
            location_details,
            is_insured,
            insurance_policy_reference,
            has_invoice,
            has_certificate,
            bank_locker_details,
            status,
            notes,
            linked_document_ids // New field
        } = body

        // Validation
        if (!category || !item_name) {
            return NextResponse.json(
                { error: 'Missing required fields: category, item_name' },
                { status: 400 }
            )
        }

        if (quantity !== undefined && quantity < 0) {
            return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
        }

        let newBelongingData = encryptFields({
            user_id: user.id,
            category,
            item_name,
            description,
            material: material || null,
            purity: purity || null,
            weight_grams: weight_grams ? Number(weight_grams) : null,
            quantity: quantity !== undefined ? Number(quantity) : 1,
            purchase_value: purchase_value ? Number(purchase_value) : null,
            purchase_date: purchase_date || null,
            current_estimated_value: current_estimated_value ? Number(current_estimated_value) : null,
            valuation_date: valuation_date || null,
            storage_location: storage_location,
            location_details: location_details || null,
            is_insured: !!is_insured,
            insurance_policy_reference: insurance_policy_reference || null,
            has_invoice: !!has_invoice,
            has_certificate: !!has_certificate,
            bank_locker_details: bank_locker_details || null,
            status: status || 'in_possession',
            notes: notes || null
        }, [
            'item_name', 'description', 'storage_location', 'bank_locker_details', 'location_details', 
            'notes', 'insurance_policy_reference'
        ]);

        newBelongingData = encryptNumericFields(newBelongingData, [
            'weight_grams', 'quantity', 'purchase_value', 'current_estimated_value'
        ]);

        const { data: belonging, error } = await supabase
            .from('belongings')
            .insert(newBelongingData)
            .select()
            .single()

        if (error) {
            console.error('Belonging insert error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to create belonging' },
                { status: 500 }
            )
        }

        // Link documents if provided
        if (linked_document_ids && Array.isArray(linked_document_ids) && linked_document_ids.length > 0) {
            const links = linked_document_ids.map(docId => ({
                user_id: user.id,
                document_id: docId,
                entity_type: 'belonging',
                entity_id: belonging.id
            }))

            const { error: linkError } = await supabase
                .from('document_links')
                .insert(links)

            if (linkError) {
                console.error('Failed to link documents during creation:', linkError)
                // Note: We don't fail the whole creation if linking fails, but we log it.
            }
        }

        let decryptedBelonging = decryptFields(belonging, [
            'item_name', 'description', 'storage_location', 'bank_locker_details', 'location_details', 
            'notes', 'insurance_policy_reference'
        ])
        
        decryptedBelonging = decryptNumericFields(decryptedBelonging, [
            'weight_grams', 'quantity', 'purchase_value', 'current_estimated_value'
        ])

        return NextResponse.json({ belonging: decryptedBelonging }, { status: 201 })
    } catch (error) {
        console.error('Belongings POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
