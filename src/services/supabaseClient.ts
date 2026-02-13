
import { createClient } from '@supabase/supabase-js';

// Access environment variables compatible with both Vite (import.meta.env) and Node (process.env)
const getEnv = (key: string, viteKey: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
};

// Vercel/Vite standard uses VITE_ prefix for public variables
const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY', 'VITE_SUPABASE_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
