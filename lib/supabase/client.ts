import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Create a singleton to ensure the same client instance is used
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: 'hoc-dashboard-auth',
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null;
            const value = localStorage.getItem(key);
            console.log(`[Storage] GET ${key}:`, value ? 'found' : 'not found');
            return value;
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return;
            console.log(`[Storage] SET ${key}`);
            localStorage.setItem(key, value);
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return;
            console.log(`[Storage] REMOVE ${key}`);
            localStorage.removeItem(key);
          },
        },
      },
    }
  );

  return supabaseInstance;
}
