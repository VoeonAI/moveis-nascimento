import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('[supabaseClient] Missing environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabasePublishableKey,
  });
  throw new Error('VITE_SUPABASE_URL and a Supabase publishable key must be defined');
}

export const supabaseProjectUrl = supabaseUrl.replace(/\/$/, '');

export const supabase = createClient(supabaseProjectUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
