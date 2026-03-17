import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Track user login activity for the inactivity monitoring system.
 * Upserts the inactivity_tracker table with the current login timestamp
 * and resets all reminder stage flags.
 * 
 * This should be called on every successful login (OAuth callback, email login).
 */
export async function trackLoginActivity(supabase: SupabaseClient, userId: string) {
    try {
        const now = new Date().toISOString();

        await supabase
            .from("inactivity_tracker")
            .upsert({
                user_id: userId,
                last_login_at: now,
                // Reset all reminder stages on login
                reminder_stage_1_sent: false,
                reminder_stage_2_sent: false,
                reminder_stage_3_sent: false,
                nominee_triggered: false,
                updated_at: now,
            }, {
                onConflict: "user_id"
            });

        // Add audit log for login
        await supabase
            .from("audit_logs")
            .insert({
                user_id: userId,
                event_type: 'LOGIN',
                description: 'User logged in, resetting inactivity timers.',
                metadata: { timestamp: now }
            });
    } catch (err) {
        // Non-critical — don't break login flow
        console.error("Failed to track login activity:", err);
    }
}
