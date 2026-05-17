import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './safe-storage';

const supabaseUrl = 'https://rmzgzczmrbooegftrzxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtemd6Y3ptcmJvb2VnZnRyenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTMwODgsImV4cCI6MjA4NDMyOTA4OH0.7zVCfR4s_DCI3DFtdg9jQJMDb7V6nKXcny2YtiPx_x8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Set to false to avoid automatic parsing of browser URL redirect fragments
  },
});
