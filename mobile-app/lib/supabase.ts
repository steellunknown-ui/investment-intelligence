import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmzgzczmrbooegftrzxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtemd6Y3ptcmJvb2VnZnRyenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTMwODgsImV4cCI6MjA4NDMyOTA4OH0.7zVCfR4s_DCI3DFtdg9jQJMDb7V6nKXcny2YtiPx_x8';

// Safe Storage Wrapper to prevent AsyncStorage from calling window on server-side pre-rendering
const customStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Set to false to avoid automatic parsing of browser URL redirect fragments
  },
});
