import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { createAlert } from '@/lib/alerts'
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

        const { data: assets, error } = await supabase
            .from('assets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Assets fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch assets' },
                { status: 500 }
            )
        }

        let decryptedAssets = assets?.map(asset => decryptFields(asset, [
            'asset_name', 'owner_name', 'property_address', 'registration_number', 
            'vehicle_registration', 'vehicle_make', 'vehicle_model', 'loan_provider', 
            'document_reference', 'location', 'notes'
        ]))
        
        decryptedAssets = decryptedAssets?.map(asset => decryptNumericFields(asset, ['current_market_value']))

        return NextResponse.json({ assets: decryptedAssets ?? [] })
    } catch (error) {
        console.error('Assets GET error:', error)
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
            asset_category,
            asset_type,
            asset_name,
            ownership_type,
            owner_name,
            co_owner_names,
            ownership_percentage,
            purchase_value,
            purchase_date,
            current_market_value,
            valuation_date,
            property_address,
            property_area,
            property_area_unit,
            registration_number,
            vehicle_registration,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            is_under_loan,
            loan_provider,
            loan_outstanding,
            loan_emi,
            loan_end_date,
            document_reference,
            status,
            location,
            notes
        } = body

        // Validation
        if (!asset_category || !asset_type || !asset_name) {
            return NextResponse.json(
                { error: 'Missing required fields: asset_category, asset_type, asset_name' },
                { status: 400 }
            )
        }

        if (ownership_percentage !== undefined && (ownership_percentage < 0 || ownership_percentage > 100)) {
            return NextResponse.json({ error: 'Ownership percentage must be between 0 and 100' }, { status: 400 })
        }

        if (Number(purchase_value) < 0 || Number(current_market_value) < 0) {
            return NextResponse.json({ error: 'Values cannot be negative' }, { status: 400 })
        }

        let newAssetData = encryptFields({
            user_id: user.id,
            asset_category,
            asset_type,
            asset_name,
            ownership_type: ownership_type || 'sole',
            owner_name: owner_name || null,
            co_owner_names: co_owner_names || null,
            ownership_percentage: ownership_percentage !== undefined ? Number(ownership_percentage) : 100,
            purchase_value: purchase_value ? Number(purchase_value) : null,
            purchase_date: purchase_date || null,
            current_market_value: current_market_value ? Number(current_market_value) : null,
            valuation_date: valuation_date || null,
            property_address,
            property_area: property_area ? Number(property_area) : null,
            property_area_unit,
            registration_number,
            vehicle_registration,
            vehicle_make,
            vehicle_model,
            vehicle_year: vehicle_year ? Number(vehicle_year) : null,
            is_under_loan: !!is_under_loan,
            loan_provider,
            loan_outstanding: loan_outstanding ? Number(loan_outstanding) : null,
            loan_emi: loan_emi ? Number(loan_emi) : null,
            loan_end_date: loan_end_date || null,
            document_reference,
            status: status || 'owned',
            location: location || null,
            notes: notes || null
        }, [
            'asset_name', 'owner_name', 'property_address', 'registration_number', 
            'vehicle_registration', 'vehicle_make', 'vehicle_model', 'loan_provider', 
            'document_reference', 'location', 'notes'
        ]);

        newAssetData = encryptNumericFields(newAssetData, ['current_market_value']);

        const { data: asset, error } = await supabase
            .from('assets')
            .insert(newAssetData)
            .select()
            .single()

        if (error) {
            console.error('Asset insert error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to create asset' },
                { status: 500 }
            )
        }

        // Create notification alert
        await createAlert(supabase, {
            userId: user.id,
            type: 'success',
            title: 'Asset Added',
            message: `New asset "${asset_name}" (${asset_type}) has been added to your vault.`
        });

        let decryptedAsset = decryptFields(asset, [
            'asset_name', 'owner_name', 'property_address', 'registration_number', 
            'vehicle_registration', 'vehicle_make', 'vehicle_model', 'loan_provider', 
            'document_reference', 'location', 'notes'
        ])
        
        decryptedAsset = decryptNumericFields(decryptedAsset, ['current_market_value'])

        return NextResponse.json({ asset: decryptedAsset }, { status: 201 })
    } catch (error) {
        console.error('Assets POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
