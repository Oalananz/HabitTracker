import { createClient } from '@/utils/supabase/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

const AUTH_ID_CACHE_TTL_MS = 15_000;
const AUTH_ID_CACHE_MAX_ENTRIES = 200;

const authIdCache = new Map<string, { userId: string; expiresAt: number }>();

function buildAuthCookieCacheKey(allCookies: Array<{ name: string; value: string }>) {
  // Only keep Supabase auth cookies in cache key to keep key size bounded.
  return allCookies
    .filter((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .sort()
    .join(';');
}

function pruneAuthIdCache(now: number) {
  for (const [key, entry] of authIdCache) {
    if (entry.expiresAt <= now) {
      authIdCache.delete(key);
    }
  }

  if (authIdCache.size <= AUTH_ID_CACHE_MAX_ENTRIES) return;

  const sorted = Array.from(authIdCache.entries()).sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const removeCount = authIdCache.size - AUTH_ID_CACHE_MAX_ENTRIES;
  for (let i = 0; i < removeCount; i++) {
    authIdCache.delete(sorted[i][0]);
  }
}

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

export async function requireAuthId() {
  const now = Date.now();
  pruneAuthIdCache(now);

  const cookieStore = await cookies();
  const authCookieKey = buildAuthCookieCacheKey(cookieStore.getAll());
  if (authCookieKey) {
    const cached = authIdCache.get(authCookieKey);
    if (cached && cached.expiresAt > now) {
      return cached.userId;
    }
  }

  const supabaseServer = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (authCookieKey) {
    authIdCache.set(authCookieKey, {
      userId: user.id,
      expiresAt: now + AUTH_ID_CACHE_TTL_MS,
    });
  }

  return user.id;
}
