import { createClient } from '@/utils/supabase/server';
import { supabase } from '@/lib/supabase';

export async function getCurrentUser() {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
  
  if (authError || !user) return null;

  // Fetch the public user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, username, status_message, created_at')
    .eq('id', user.id)
    .maybeSingle();

  // If profile exists, return it
  if (profile) {
    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      statusMessage: profile.status_message,
      createdAt: profile.created_at,
    };
  }

  // Profile doesn't exist yet — auto-create it from the auth user data
  const username = user.user_metadata?.username
    || user.user_metadata?.full_name
    || user.email?.split('@')[0]
    || 'user';

  const { data: newProfile } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email!,
      username,
    })
    .select('id, email, username, status_message, created_at')
    .single();

  // Also create initial recovery state
  await supabase
    .from('recovery_states')
    .insert({ user_id: user.id, start_time: new Date().toISOString() })
    .select()
    .maybeSingle();

  if (newProfile) {
    return {
      id: newProfile.id,
      email: newProfile.email,
      username: newProfile.username,
      statusMessage: newProfile.status_message,
      createdAt: newProfile.created_at,
    };
  }

  // Last resort fallback — return from auth data directly
  return {
    id: user.id,
    email: user.email!,
    username,
    statusMessage: 'Compiling habits...',
    createdAt: user.created_at,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
