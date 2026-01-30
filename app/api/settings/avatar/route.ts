import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        updateLastActivity(supabase, user.id)

        const formData = await request.formData()
        const file = formData.get('avatar') as File
        
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
        }

        // Create avatars bucket if it doesn't exist
        const { data: buckets } = await supabase.storage.listBuckets()
        const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars')
        
        if (!avatarBucket) {
            await supabase.storage.createBucket('avatars', { public: true })
        }

        // Delete existing avatar if any
        const { data: existingFiles } = await supabase.storage
            .from('avatars')
            .list(user.id)
        
        if (existingFiles && existingFiles.length > 0) {
            await supabase.storage
                .from('avatars')
                .remove(existingFiles.map(file => `${user.id}/${file.name}`))
        }

        // Upload new avatar
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/avatar.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update user metadata
        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: publicUrl }
        })

        if (updateError) {
            console.error('Update user error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ avatar_url: publicUrl })
    } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}