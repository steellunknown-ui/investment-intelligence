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

        const { data: holdings, error } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Holdings fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch holdings' },
                { status: 500 }
            )
        }

        let decryptedHoldings = holdings?.map(holding => decryptFields(holding, [
            'symbol', 'name', 'notes'
        ]))
        
        decryptedHoldings = decryptedHoldings?.map(holding => decryptNumericFields(holding, [
            'quantity', 'avg_buy_price'
        ]))

        return NextResponse.json({ holdings: decryptedHoldings ?? [] })
    } catch (error) {
        console.error('Holdings GET error:', error)
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
        const { symbol, name, asset_type, quantity, avg_buy_price, notes, purchase_date, broker, account_number } = body

        // Validate required fields
        if (!symbol || quantity === undefined || quantity === null) {
            return NextResponse.json(
                { error: 'Symbol and quantity are required' },
                { status: 400 }
            )
        }

        let newHoldingData = encryptFields({
            user_id: user.id,
            asset_type,
            symbol: symbol.toUpperCase(),
            name,
            quantity: Number(quantity) || 0,
            avg_buy_price: Number(avg_buy_price) || 0,
            notes: notes || null
        }, [
            'symbol', 'name', 'notes'
        ]);

        newHoldingData = encryptNumericFields(newHoldingData, [
            'quantity', 'avg_buy_price'
        ]);

        const { data: holding, error } = await supabase
            .from('holdings')
            .insert(newHoldingData)
            .select()
            .single()

        if (error) {
            console.error('Holdings insert error:', error)
            return NextResponse.json(
                { error: 'Failed to create holding' },
                { status: 500 }
            )
        }

        let decryptedHolding = decryptFields(holding, [
            'symbol', 'name', 'notes'
        ])
        
        decryptedHolding = decryptNumericFields(decryptedHolding, [
            'quantity', 'avg_buy_price'
        ])

        return NextResponse.json({ holding: decryptedHolding }, { status: 201 })
    } catch (error) {
        console.error('Holdings POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
