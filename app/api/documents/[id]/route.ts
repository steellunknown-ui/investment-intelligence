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

        const { data: document, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        return NextResponse.json({ document })
    } catch (error) {
        console.error('Document GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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

        const { data: document, error } = await supabase
            .from('documents')
            .update(body)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Document update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update document' },
                { status: 500 }
            )
        }

        return NextResponse.json({ document })
    } catch (error) {
        console.error('Document PATCH error:', error)
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

        // 1. Get file path first
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // 2. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([doc.file_path])

        if (storageError) {
            console.error('Storage delete error:', storageError)
            // Continue to delete from DB even if storage fail (orphan file is better than broken UI)
        }

        // 3. Delete from DB
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Document DB delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete document record' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Document DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
