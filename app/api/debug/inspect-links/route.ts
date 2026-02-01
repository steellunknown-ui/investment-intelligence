import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export async function GET(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: links, error } = await supabase
            .from('document_links')
            .select(`
                *,
                document:documents(title)
            `)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Group by entity type for easier reading
        const grouped = links?.reduce((acc: any, link) => {
            const key = `${link.entity_type} (${link.entity_id})`
            if (!acc[key]) acc[key] = []
            acc[key].push({
                doc_title: link.document?.title,
                doc_id: link.document_id,
                created: link.created_at
            })
            return acc
        }, {})

        return NextResponse.json({
            count: links?.length,
            raw_links: links,
            grouped_by_entity: grouped
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
