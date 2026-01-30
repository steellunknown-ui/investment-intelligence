import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function GET(
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

        // Verfiy ownership
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Create Signed URL
        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 60) // 60 seconds expiry

        if (error || !data) {
            return NextResponse.json(
                { error: 'Failed to generate download link' },
                { status: 500 }
            )
        }

        // Lock document immediately after providing download link
        await supabase
            .from('document_view_otps')
            .delete()
            .eq('user_id', user.id)
            .eq('document_id', id)

        return NextResponse.json({ url: data.signedUrl })
    } catch (error) {
        console.error('Download GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
