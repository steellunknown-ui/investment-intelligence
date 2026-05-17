import { createClient } from '@supabase/supabase-js';
import { capacitorStorage } from './capacitor-storage';

let capacitorAuthClient: ReturnType<typeof createClient> | null = null;

export const createCapacitorAuthClient = () => {
  if (capacitorAuthClient) return capacitorAuthClient;

  // We explicitly use the pure `@supabase/supabase-js` client instead of `@supabase/ssr`
  // for the Capacitor OAuth flow.
  // WHY? Because `@supabase/ssr`'s `createBrowserClient` often defaults PKCE storage
  // to cookies. In Android WebViews, cookies can be volatile.
  // By using the pure JS client, we strictly control the storage via capacitorStorage.
  capacitorAuthClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        autoRefreshToken: false,
        persistSession: true,
        storageKey: 'sb-auth-token', // SYNC with SSR client
        storage: capacitorStorage,
      }
    }
  );

  return capacitorAuthClient;
};
