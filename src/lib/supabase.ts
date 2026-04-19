import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use the service role key for server-side operations — this bypasses RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

export const supabase =
  globalForSupabase.supabase ?? createClient<Database>(supabaseUrl, supabaseServiceKey);

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase;
