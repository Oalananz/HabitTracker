/**
 * Auth Persistence — stores and retrieves authentication
 * session data locally for offline access.
 *
 * On native (Capacitor), uses @capacitor/preferences (Keychain on iOS).
 * On web, falls back to localStorage.
 */

interface StoredSession {
  user: {
    id: string;
    email: string;
    username: string;
    statusMessage?: string;
    createdAt?: string;
  };
  storedAt: string;
}

const SESSION_KEY = 'ht_auth_session';
const SESSION_MAX_AGE_DAYS = 30;

// ─── Storage abstraction ────────────────────────────────────────────

async function isCapacitorAvailable(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function nativeSet(key: string, value: string): Promise<void> {
  const { Preferences } = await import('@capacitor/preferences');
  await Preferences.set({ key, value });
}

async function nativeGet(key: string): Promise<string | null> {
  const { Preferences } = await import('@capacitor/preferences');
  const { value } = await Preferences.get({ key });
  return value;
}

async function nativeRemove(key: string): Promise<void> {
  const { Preferences } = await import('@capacitor/preferences');
  await Preferences.remove({ key });
}

async function storageSet(key: string, value: string): Promise<void> {
  if (await isCapacitorAvailable()) {
    return nativeSet(key, value);
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage might be full or unavailable
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (await isCapacitorAvailable()) {
    return nativeGet(key);
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageRemove(key: string): Promise<void> {
  if (await isCapacitorAvailable()) {
    return nativeRemove(key);
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/** Store the authenticated user session locally */
export async function persistSession(user: {
  id: string;
  email: string;
  username: string;
  statusMessage?: string;
  createdAt?: string;
}): Promise<void> {
  const session: StoredSession = {
    user,
    storedAt: new Date().toISOString(),
  };
  await storageSet(SESSION_KEY, JSON.stringify(session));
}

/** Retrieve the stored session. Returns null if expired or absent. */
export async function getPersistedSession(): Promise<StoredSession['user'] | null> {
  const raw = await storageGet(SESSION_KEY);
  if (!raw) return null;

  try {
    const session: StoredSession = JSON.parse(raw);

    // Check if session is too old
    const storedAt = new Date(session.storedAt).getTime();
    const maxAge = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - storedAt > maxAge) {
      await clearPersistedSession();
      return null;
    }

    return session.user;
  } catch {
    await clearPersistedSession();
    return null;
  }
}

/** Clear the stored session (used on logout) */
export async function clearPersistedSession(): Promise<void> {
  await storageRemove(SESSION_KEY);
}

/** Check if a valid session exists locally */
export async function hasPersistedSession(): Promise<boolean> {
  const user = await getPersistedSession();
  return user !== null;
}
