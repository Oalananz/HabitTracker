import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'dummy';

export const createClient = () =>
  createBrowserClient<Database>(
    supabaseUrl!,
    supabaseKey!
  );
