import { createClient } from '@supabase/supabase-js';
import { capacitorStorage } from './capacitor-storage';

let capacitorAuthClient: ReturnType<typeof createClient> | null = null;

export const createCapacitorAuthClient = () => {
  if (capacitorAuthClient) return capacitorAuthClient;

  // We explicitly use the pure `@supabase/supabase-js` client instead of `@supabase/ssr`
  // for the Capacitor OAuth flow.
  // WHY? Because `@supabase/ssr`'s `createBrowserClient` forces the PKCE verifier to
  // be stored in `document.cookie`. In Android WebViews, `document.cookie` is extremely
  // volatile and gets wiped across deep links, causing "PKCE verifier not found" errors.
  // By using the pure JS client, we can force it to use `capacitorStorage` (SharedPreferences)
  // for the PKCE verifier, making it 100% immune to data loss!
  capacitorAuthClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: capacitorStorage,
        flowType: 'pkce',
        detectSessionInUrl: false,
        autoRefreshToken: false, // We'll let the SSR client handle refreshes
        persistSession: true,
      }
    }
  );

  return capacitorAuthClient;
};
