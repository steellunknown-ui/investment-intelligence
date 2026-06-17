import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { encrypt, decrypt, encryptFields, decryptFields } from '@/src/lib/encryption'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        updateLastActivity(supabase, user.id)

        // Get profile from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileError)
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
        }

        // If no profile exists, create one with auth user data
        if (!profile) {
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                    country: 'India'
                })
                .select()
                .single()

            if (createError) {
                console.error('Profile create error:', createError)
                return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
            }

            const decryptedNewProfile = decryptFields(newProfile, [
                'full_name', 'contact_number', 'address', 'city', 'state', 'pincode'
            ])

            return NextResponse.json({
                profile: {
                    full_name: decryptedNewProfile.full_name || '',
                    contact_number: decryptedNewProfile.contact_number || '',
                    gender: newProfile.gender || '',
                    date_of_birth: newProfile.date_of_birth || '',
                    address: decryptedNewProfile.address || '',
                    city: decryptedNewProfile.city || '',
                    state: decryptedNewProfile.state || '',
                    pincode: decryptedNewProfile.pincode || '',
                    country: newProfile.country || 'India',
                    // Priority: Stored avatar_url > Google OAuth picture
                    avatar_url: newProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null
                }
            })
        }

        const decryptedProfile = decryptFields(profile, [
            'full_name', 'contact_number', 'address', 'city', 'state', 'pincode'
        ])

        return NextResponse.json({
            profile: {
                full_name: decryptedProfile.full_name || '',
                contact_number: decryptedProfile.contact_number || '',
                gender: profile.gender || '',
                date_of_birth: profile.date_of_birth || '',
                address: decryptedProfile.address || '',
                city: decryptedProfile.city || '',
                state: decryptedProfile.state || '',
                pincode: decryptedProfile.pincode || '',
                country: profile.country || 'India',
                // Priority: Stored avatar_url > Google OAuth picture
                avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            }
        })
    } catch (error) {
        console.error('Profile GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        updateLastActivity(supabase, user.id)

        const body = await request.json()
        const { full_name, contact_number, gender, date_of_birth, address, city, state, pincode, country } = body

        // Validation
        if (!full_name || full_name.trim() === '') {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
        }

        if (contact_number && !/^\d{10}$/.test(contact_number)) {
            return NextResponse.json({ error: 'Contact number must be 10 digits' }, { status: 400 })
        }

        if (pincode && !/^\d{6}$/.test(pincode)) {
            return NextResponse.json({ error: 'Pincode must be 6 digits' }, { status: 400 })
        }

        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return NextResponse.json({ error: 'Gender must be male, female, or other' }, { status: 400 })
        }

        if (date_of_birth && isNaN(Date.parse(date_of_birth))) {
            return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
        }

        const upsertData = encryptFields({
            id: user.id,
            full_name: full_name.trim(),
            contact_number: contact_number || null,
            gender: gender || null,
            date_of_birth: date_of_birth || null,
            address: address || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null,
            country: country || 'India',
            updated_at: new Date().toISOString()
        }, [
            'full_name', 'contact_number', 'address', 'city', 'state', 'pincode'
        ])

        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert(upsertData)

        if (updateError) {
            console.error('Profile update error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Profile PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}