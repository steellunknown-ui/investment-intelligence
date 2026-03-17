import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export async function getSession() {
    const supabase = createSupabaseServerClient()

    try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
            console.error('Error getting session:', error.message)
            return null
        }
        return session
    } catch {
        return null
    }
}

export async function getUser() {
    const supabase = createSupabaseServerClient()
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
            console.error('Error getting user:', error.message)
            return null
        }
        return user
    } catch {
        return null
    }
}
