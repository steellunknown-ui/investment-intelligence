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
    const session = await getSession()
    return session?.user ?? null
}
