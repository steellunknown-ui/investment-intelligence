import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export const dynamic = 'force-dynamic'

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

        updateLastActivity(supabase, user.id)

        // Parse search params
        const { searchParams } = new URL(request.url)
        const showArchived = searchParams.get('archived') === 'true'
        const type = searchParams.get('type')
        const search = searchParams.get('search')

        let query = supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (!showArchived) {
            query = query.eq('is_archived', false)
        }

        if (type && type !== 'all') {
            query = query.eq('document_type', type)
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        const { data: documents, error } = await query

        if (error) {
            console.error('Documents fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch documents' },
                { status: 500 }
            )
        }

        // Check unlock status for each document
        const documentsWithLockStatus = await Promise.all(
            (documents ?? []).map(async (doc) => {
                // Check if document was unlocked in last 2 minutes
                const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
                const { data: recentVerification } = await supabase
                    .from('document_view_otps')
                    .select('verified_at')
                    .eq('user_id', user.id)
                    .eq('document_id', doc.id)
                    .not('verified_at', 'is', null)
                    .gte('verified_at', twoMinutesAgo)
                    .order('verified_at', { ascending: false })
                    .limit(1)
                    .single()

                return {
                    ...doc,
                    is_locked: !recentVerification
                }
            })
        )

        return NextResponse.json({ documents: documentsWithLockStatus })
    } catch (error) {
        console.error('Documents GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
