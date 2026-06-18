import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Only warn if they are using the placeholder
if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL not configured. Please set VITE_SUPABASE_URL in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
