import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Safe access to environment variables that works in both Node and Browser environments
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

// We prioritize environment variables (for Netlify/Vercel)
// Fallbacks are provided for local testing if env vars aren't set
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://tfybjhgrwwbgyxqxraks.supabase.co';

// IMPORTANT: Replace this with your actual Supabase publishable API key
const supabaseKey = getEnv('SUPABASE_KEY') || 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';
// ------------------------------------------------------------------

if (!supabaseUrl || !supabaseKey || supabaseKey === 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY') {
    console.error("Supabase credentials missing or placeholder used in services/supabaseClient.ts. Please provide your Supabase URL and anonymous key.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
