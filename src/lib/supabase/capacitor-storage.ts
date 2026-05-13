import { Preferences } from '@capacitor/preferences';

/**
 * Capacitor Native Storage Adapter for Supabase Auth
 *
 * Directly uses @capacitor/preferences to ensure 100% persistence
 * of auth tokens and PKCE verifiers across app kills.
 */

const isCapacitorNative = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

export const capacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isCapacitorNative()) {
      return localStorage.getItem(key);
    }
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (err) {
      return localStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isCapacitorNative()) {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await Preferences.set({ key, value });
      // Backup to localStorage
      try { localStorage.setItem(key, value); } catch {}
    } catch (err) {
      localStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!isCapacitorNative()) {
      localStorage.removeItem(key);
      return;
    }
    try {
      await Preferences.remove({ key });
      try { localStorage.removeItem(key); } catch {}
    } catch (err) {
      localStorage.removeItem(key);
    }
  },
};

// ── Session Timestamp Helpers ──
const SESSION_LOGIN_KEY = 'capacitor_session_login_at';
const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export async function recordSessionLogin(): Promise<void> {
  const now = Date.now().toString();
  await capacitorStorage.setItem(SESSION_LOGIN_KEY, now);
}

export async function isSessionValid(): Promise<boolean> {
  try {
    const loginAt = await capacitorStorage.getItem(SESSION_LOGIN_KEY);
    if (!loginAt) return true; // Assume valid if not tracked yet

    const elapsed = Date.now() - parseInt(loginAt, 10);
    return elapsed < SESSION_TIMEOUT_MS;
  } catch (err) {
    return true;
  }
}

export async function clearSessionLogin(): Promise<void> {
  await capacitorStorage.removeItem(SESSION_LOGIN_KEY);
}
