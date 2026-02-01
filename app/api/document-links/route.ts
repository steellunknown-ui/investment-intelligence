import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function GET(request: Request) {
    try {
        const supabase = createSupabaseServerClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const document_id = searchParams.get('document_id')
        const entity_id = searchParams.get('entity_id')
        const entity_type = searchParams.get('entity_type')

        let query = supabase
            .from('document_links')
            .select('*')
            .eq('user_id', user.id)

        if (document_id) {
            query = query.eq('document_id', document_id)
        }
        if (entity_id) {
            query = query.eq('entity_id', entity_id)
        }
        if (entity_type) {
            query = query.eq('entity_type', entity_type)
        }

        const { data: links, error } = await query

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
        }

        return NextResponse.json({ links: links ?? [] })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        updateLastActivity(supabase, user.id)

        const body = await request.json()
        const { document_id, entity_type, entity_id, link_description, is_primary } = body

        if (!document_id || !entity_id || !entity_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify document ownership
        const { data: doc } = await supabase.from('documents').select('id').eq('id', document_id).eq('user_id', user.id).single()
        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

        const { data: link, error } = await supabase
            .from('document_links')
            .insert({
                user_id: user.id,
                document_id,
                entity_type,
                entity_id,
                link_description,
                is_primary: !!is_primary
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ link }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
