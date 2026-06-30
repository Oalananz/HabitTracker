/**
 * Client-side sync bridge for the Today page's per-day extras
 * (Top 3 Priorities, Evening Review, saved AI Plan).
 *
 * These still write to localStorage for instant, offline-capable reads, but
 * are now mirrored to the `today_state` table so they sync across devices:
 *   • pullTodayState(date)  — on load, hydrate localStorage from the server.
 *   • pushTodayState(date)  — after any change, debounce-upload the snapshot,
 *                             and best-effort flush when the tab is closing.
 *
 * Everything degrades gracefully: if the API/table is unavailable (e.g. the
 * migration hasn't been run yet) the app keeps working on localStorage alone.
 */

export const TODAY_STATE_HYDRATED = 'todayState:hydrated';

const PUSH_DEBOUNCE_MS = 1200;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingDates = new Set<string>();
let flushListenerAttached = false;

function readKey<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function snapshot(date: string) {
  return {
    date,
    priorities: readKey<unknown[]>(`topPriorities:${date}`) ?? [],
    dailyReview: readKey<unknown>(`dailyReview:${date}`),
    aiPlan: readKey<unknown>(`aiDailyPlan:${date}`),
  };
}

function doPush(date: string, useBeacon = false) {
  const body = JSON.stringify(snapshot(date));
  try {
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      // Same-origin: Supabase auth cookies ride along, so the route can auth.
      navigator.sendBeacon('/api/today-state', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/today-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* offline — will resync on the next change */ });
  } catch {
    /* ignore */
  }
}

function ensureFlushListener() {
  if (flushListenerAttached || typeof window === 'undefined') return;
  flushListenerAttached = true;
  const flush = () => {
    for (const d of pendingDates) doPush(d, true);
    pendingDates.clear();
  };
  // pagehide covers tab close / navigation; visibilitychange covers mobile
  // backgrounding where pagehide may not fire reliably.
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

/** Queue a debounced upload of the date's snapshot, and arm the close-flush. */
export function pushTodayState(date: string) {
  if (typeof window === 'undefined') return;
  ensureFlushListener();
  pendingDates.add(date);
  const existing = timers.get(date);
  if (existing) clearTimeout(existing);
  timers.set(date, setTimeout(() => {
    timers.delete(date);
    pendingDates.delete(date);
    doPush(date);
  }, PUSH_DEBOUNCE_MS));
}

/**
 * Hydrate localStorage from the server for a date. Returns true when server
 * data was applied (callers can then notify components to re-read).
 */
export async function pullTodayState(date: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`/api/today-state?date=${date}`);
    if (!res.ok) return false;
    const { state } = await res.json();
    if (!state) return false;

    let changed = false;
    const write = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      try { localStorage.setItem(key, JSON.stringify(value)); changed = true; } catch { /* ignore */ }
    };

    if (Array.isArray(state.priorities) && state.priorities.length > 0) {
      write(`topPriorities:${date}`, state.priorities);
    }
    write(`dailyReview:${date}`, state.dailyReview);
    write(`aiDailyPlan:${date}`, state.aiPlan);
    return changed;
  } catch {
    return false;
  }
}
