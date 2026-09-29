import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { db, pool } from '@/lib/db';

export const SESSION_COOKIE = 'ht_session';
export const USERNAME_RE = /^[A-Za-z0-9_.-]{3,32}$/;
const SESSION_TTL_DAYS = 30;
const AUTH_ID_CACHE_TTL_MS = 15_000;
const AUTH_ID_CACHE_MAX_ENTRIES = 200;

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

// ─── Passwords ───────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

// Used when the email is unknown so login timing doesn't reveal which accounts exist.
const DUMMY_HASH = `scrypt$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(KEY_LENGTH).toString('base64')}`;

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const [scheme, saltB64, keyB64] = (stored || DUMMY_HASH).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return Boolean(stored) && timingSafeEqual(actual, expected);
}

// ─── Sessions ────────────────────────────────────────────────────────

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const authIdCache = new Map<string, { userId: string; expiresAt: number }>();

function pruneAuthIdCache(now: number) {
  for (const [key, entry] of authIdCache) {
    if (entry.expiresAt <= now) authIdCache.delete(key);
  }
  if (authIdCache.size <= AUTH_ID_CACHE_MAX_ENTRIES) return;
  const sorted = Array.from(authIdCache.entries()).sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  for (let i = 0; i < authIdCache.size - AUTH_ID_CACHE_MAX_ENTRIES; i++) {
    authIdCache.delete(sorted[i][0]);
  }
}

/** Creates a session row and sets the session cookie on the current response. */
export async function createSession(userId: string, secure: boolean) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), userId, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: expiresAt,
  });
}

/** Deletes the current session (if any) and clears the cookie. */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    authIdCache.delete(tokenHash);
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const now = Date.now();
  pruneAuthIdCache(now);
  const cached = authIdCache.get(tokenHash);
  if (cached && cached.expiresAt > now) return cached.userId;

  const { rows } = await pool.query<{ user_id: string }>(
    'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );
  const userId = rows[0]?.user_id ?? null;
  if (userId) authIdCache.set(tokenHash, { userId, expiresAt: now + AUTH_ID_CACHE_TTL_MS });
  return userId;
}

// ─── Users ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  statusMessage: string | null;
  createdAt: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data: profile, error } = await db
    .from('users')
    .select('id, email, username, status_message, created_at')
    .eq('id', userId)
    .maybeSingle();

  // A failed lookup is an error, not a signed-out user; let callers log it.
  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    statusMessage: profile.status_message,
    createdAt: profile.created_at,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/** The signed-in user's id, or null when there is no valid session. */
export async function getAuthUserId(): Promise<string | null> {
  return getSessionUserId();
}

export async function requireAuthId() {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/** True when the request arrived over HTTPS (directly or via a proxy). */
export function isSecureRequest(request: Request) {
  const forwarded = request.headers.get('x-forwarded-proto');
  return (forwarded ?? new URL(request.url).protocol.replace(':', '')) === 'https';
}
