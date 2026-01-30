import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

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

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const title = formData.get('title') as string
        const document_type = formData.get('document_type') as string
        const description = formData.get('description') as string
        const tags = formData.get('tags') as string // comma separated

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // 1. Validate File
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 })
        }

        // 2. Upload to Storage
        const fileExt = file.name.split('.').pop()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${user.id}/${Date.now()}_${safeFileName}`

        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = new Uint8Array(arrayBuffer)

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return NextResponse.json(
                { error: 'Upload failed: ' + uploadError.message },
                { status: 500 }
            )
        }

        // 3. Insert Metadata
        const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

        const { data: document, error: dbError } = await supabase
            .from('documents')
            .insert({
                user_id: user.id,
                file_name: file.name,
                file_path: filePath,
                mime_type: file.type,
                file_size: file.size,
                document_type: document_type || 'other',
                title: title || file.name,
                description: description || null,
                tags: tagArray,
                is_archived: false
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB insert error:', dbError)
            return NextResponse.json(
                { error: 'Failed to save document metadata' },
                { status: 500 }
            )
        }

        updateLastActivity(supabase, user.id)

        return NextResponse.json({ document }, { status: 201 })
    } catch (error) {
        console.error('Upload POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
