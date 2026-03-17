import { SupabaseClient } from '@supabase/supabase-js';

export type AlertType = 'system' | 'security' | 'inactivity' | 'warning' | 'success' | 'info';

export interface CreateAlertParams {
  userId: string;
  type?: AlertType;
  title: string;
  message?: string;
}

/**
 * Creates a notification alert for a user.
 * This should be used from server-side code.
 */
export async function createAlert(
  supabase: SupabaseClient,
  params: CreateAlertParams
) {
  const { userId, type = 'system', title, message } = params;

  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error creating alert:', err);
    return { success: false, error: err };
  }
}
