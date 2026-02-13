import { createClient } from '@supabase/supabase-js';

// Using the specific Supabase URL and the new key you provided to fix the login issue.
const supabaseUrl = 'https://tfybjhgrwwbgyxqxraks.supabase.co';
const supabaseKey = 'sb_publishable_k2LcWsVFNPuPYiedU2xBfw_tEET8eip';

// We will properly move this to environment variables after confirming the fix.

export const supabase = createClient(supabaseUrl, supabaseKey);
