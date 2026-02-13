
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
const supabaseKey = getEnv('SUPABASE_KEY') || 'sb_publishable_k2LcWsVFNPuPYiedU2xBfw_tEET8eip';
// ------------------------------------------------------------------

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials missing in services/supabaseClient.ts");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
