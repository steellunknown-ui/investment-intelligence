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
    const isNative = isCapacitorNative();
    if (!isNative) {
      return localStorage.getItem(key);
    }
    try {
      const { value } = await Preferences.get({ key });
      console.log(`[STORAGE] Get: ${key} = ${value ? 'FOUND' : 'NULL'}`);
      return value;
    } catch (err) {
      console.error(`[STORAGE] Get Error (${key}):`, err);
      return localStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const isNative = isCapacitorNative();
    if (!isNative) {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await Preferences.set({ key, value });
      console.log(`[STORAGE] Set: ${key} (Length: ${value.length})`);
      // Backup to localStorage for redundancy
      try { localStorage.setItem(key, value); } catch {}
    } catch (err) {
      console.error(`[STORAGE] Set Error (${key}):`, err);
      localStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    const isNative = isCapacitorNative();
    if (!isNative) {
      localStorage.removeItem(key);
      return;
    }
    try {
      await Preferences.remove({ key });
      console.log(`[STORAGE] Remove: ${key}`);
      try { localStorage.removeItem(key); } catch {}
    } catch (err) {
      console.error(`[STORAGE] Remove Error (${key}):`, err);
      localStorage.removeItem(key);
    }
  },
};

/**
 * Ensures the storage engine is responsive before starting critical tasks.
 */
export async function warmupStorage(): Promise<boolean> {
  if (!isCapacitorNative()) return true;
  try {
    const testKey = '_warmup_test';
    await capacitorStorage.setItem(testKey, '1');
    const val = await capacitorStorage.getItem(testKey);
    await capacitorStorage.removeItem(testKey);
    return val === '1';
  } catch (err) {
    console.error('[STORAGE] Warmup Failed:', err);
    return false;
  }
}

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
