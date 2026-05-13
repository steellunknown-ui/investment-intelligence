/**
 * Capacitor Native Storage Adapter for Supabase Auth
 * 
 * This adapter uses @capacitor/preferences (Android SharedPreferences / iOS UserDefaults)
 * to persist Supabase auth tokens. Unlike WebView localStorage/cookies, native storage
 * survives app process kills, task manager swipes, and device reboots.
 * 
 * This is the PERMANENT fix for:
 * 1. Sessions being lost when the app is closed from recent tabs
 * 2. PKCE code verifier not found errors (verifier lost when WebView process dies)
 * 
 * On web (non-Capacitor), this falls back to standard localStorage.
 */

const isCapacitorNative = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

// Lazy-load Preferences only when in Capacitor
let _preferencesModule: typeof import('@capacitor/preferences') | null = null;

async function getPreferences() {
  if (!_preferencesModule) {
    _preferencesModule = await import('@capacitor/preferences');
  }
  return _preferencesModule.Preferences;
}

/**
 * A localStorage-compatible async storage adapter.
 * 
 * When running inside Capacitor → uses native SharedPreferences (persists across app kills)
 * When running on web → uses standard localStorage (normal browser behavior)
 * 
 * Supabase's @supabase/ssr createBrowserClient accepts an `auth.storage` option
 * that must implement getItem, setItem, and removeItem as async methods.
 */
export const capacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isCapacitorNative()) {
      return localStorage.getItem(key);
    }
    try {
      const Preferences = await getPreferences();
      const { value } = await Preferences.get({ key });
      return value;
    } catch (err) {
      console.warn('[capacitorStorage] getItem failed, falling back to localStorage:', err);
      return localStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isCapacitorNative()) {
      localStorage.setItem(key, value);
      return;
    }
    try {
      const Preferences = await getPreferences();
      await Preferences.set({ key, value });
      // Also mirror to localStorage as a fallback for immediate reads
      try { localStorage.setItem(key, value); } catch {}
    } catch (err) {
      console.warn('[capacitorStorage] setItem failed, falling back to localStorage:', err);
      localStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!isCapacitorNative()) {
      localStorage.removeItem(key);
      return;
    }
    try {
      const Preferences = await getPreferences();
      await Preferences.remove({ key });
      try { localStorage.removeItem(key); } catch {}
    } catch (err) {
      console.warn('[capacitorStorage] removeItem failed, falling back to localStorage:', err);
      localStorage.removeItem(key);
    }
  },
};

// ── Session Timestamp Helpers ──
// These manage the 12-hour session timeout on the client side.

const SESSION_LOGIN_KEY = 'capacitor_session_login_at';
const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Records the current time as the session start.
 * Called after successful login/auth.
 */
export async function recordSessionLogin(): Promise<void> {
  const now = Date.now().toString();
  await capacitorStorage.setItem(SESSION_LOGIN_KEY, now);
}

/**
 * Checks if the current session is still within the 12-hour window.
 * Returns true if session is valid, false if expired or no login recorded.
 */
export async function isSessionValid(): Promise<boolean> {
  const loginAt = await capacitorStorage.getItem(SESSION_LOGIN_KEY);
  if (!loginAt) return false;
  
  const elapsed = Date.now() - parseInt(loginAt, 10);
  return elapsed < SESSION_TIMEOUT_MS;
}

/**
 * Clears the session login timestamp.
 * Called on logout or session timeout.
 */
export async function clearSessionLogin(): Promise<void> {
  await capacitorStorage.removeItem(SESSION_LOGIN_KEY);
}
