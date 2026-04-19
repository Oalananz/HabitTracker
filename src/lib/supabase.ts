import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
// Use the service role key for server-side operations — this bypasses RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

export const supabase =
  globalForSupabase.supabase ?? createClient<Database>(supabaseUrl, supabaseServiceKey);

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase;
