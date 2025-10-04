// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Helpful console warning in dev
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY in your env.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export Supabase URL for audio proxy
export const SUPABASE_FUNCTIONS_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1`
  : null;
