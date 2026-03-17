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

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'File must be jpg, png, or webp' }, { status: 400 })
        }

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
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
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}/avatar.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
        }

        // Get public URL (bucket is now public)
        const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        if (!publicUrlData || !publicUrlData.publicUrl) {
            console.error('Failed to get public URL')
            return NextResponse.json({ error: 'Failed to generate avatar URL' }, { status: 500 })
        }

        // Update profile with avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                avatar_url: publicUrlData.publicUrl,
                updated_at: new Date().toISOString()
            })

        // Also update auth user metadata for Navbar consistency
        const { error: authError } = await supabase.auth.updateUser({
            data: { avatar_url: publicUrlData.publicUrl }
        })

        if (authError) {
            console.error('Auth metadata update error:', authError)
            // We can continue even if auth metadata fails, as DB is the source of truth,
            // but it's good to log it.
        }

        if (updateError) {
            console.error('Profile update error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ avatar_url: publicUrlData.publicUrl })
    } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}