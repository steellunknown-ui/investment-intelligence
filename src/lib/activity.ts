import { SupabaseClient } from "@supabase/supabase-js";

export async function updateLastActivity(supabase: SupabaseClient, userId: string) {
    try {
        // Fire and forget - don't await to avoid slowing down the response
        supabase
            .from("inactivity_config")
            .update({
                last_activity_at: new Date().toISOString(),
                // Reset warning/triggered status on activity
                warning_sent_at: null,
                triggered_at: null
            })
            .eq("user_id", userId)
            .then(({ error }) => {
                if (error) console.error("Failed to update last activity:", error);
            });
    } catch (err) {
        console.error("Error in updateLastActivity:", err);
    }
}
