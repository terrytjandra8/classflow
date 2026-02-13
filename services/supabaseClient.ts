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

// Use the NEXT_PUBLIC_ prefixed variables from your Vercel settings.
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://tfybjhgrwwbgyxqxraks.supabase.co';
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';
// ------------------------------------------------------------------

if (!supabaseUrl || !supabaseKey || supabaseKey === 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY') {
    console.error("FATAL: Supabase key is missing. Please check your Vercel Environment Variables and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.");
    alert("CRITICAL ERROR: Application is not configured. See the developer console for details.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
