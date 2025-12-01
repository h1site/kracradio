// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a singleton supabase client
let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in your env.'
    );
    // Return a mock client that won't crash but will log errors
    return {
      auth: {
        signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signInWithOAuth: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Supabase not configured') }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('Supabase not configured') }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('Supabase not configured') }) }) }) }),
        delete: () => ({ eq: async () => ({ error: new Error('Supabase not configured') }) }),
      }),
    };
  }

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'kracradio-web'
      }
    }
  });

  return supabaseInstance;
}

// Export the client (will be created on first access)
export const supabase = getSupabaseClient();

// Export Supabase URL for audio proxy
export const SUPABASE_FUNCTIONS_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1`
  : null;
