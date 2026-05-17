import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (err: any) {
      console.warn(`[SafeStorage] AsyncStorage.getItem failed for "${key}":`, err.message);
      if (typeof localStorage !== 'undefined') {
        try {
          return localStorage.getItem(key);
        } catch {
          return memoryStorage[key] || null;
        }
      }
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err: any) {
      console.warn(`[SafeStorage] AsyncStorage.setItem failed for "${key}":`, err.message);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(key, value);
          return;
        } catch {
          memoryStorage[key] = value;
          return;
        }
      }
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (err: any) {
      console.warn(`[SafeStorage] AsyncStorage.removeItem failed for "${key}":`, err.message);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(key);
          return;
        } catch {
          delete memoryStorage[key];
          return;
        }
      }
      delete memoryStorage[key];
    }
  }
};
