import { SupabaseClient } from "@supabase/supabase-js";

export async function updateLastActivity(supabase: SupabaseClient, userId: string) {
    try {
        supabase
            .from("inactivity_config")
            .upsert({
                user_id: userId,
                last_activity_at: new Date().toISOString(),
                inactivity_days: 80,
                enabled: true,
                warning_sent_at: null,
                triggered_at: null
            }, { onConflict: 'user_id' })
            .then(({ error }) => {
                if (error) console.error("Failed to update last activity:", error);
            });
    } catch (err) {
        console.error("Error in updateLastActivity:", err);
    }
}
