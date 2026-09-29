'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

const DISMISS_KEY = 'lifeAreasOnboardingDismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

// The flag only changes through this component, so there is nothing to subscribe to.
const subscribeNoop = () => () => {};

/**
 * Non-blocking prompt nudging users to complete Life Areas onboarding.
 * Shown only when onboarding hasn't been completed and the user hasn't
 * dismissed it locally. Never blocks the app.
 */
export default function OnboardingPrompt() {
  const { userPreferences, fetchUserPreferences } = useStore();
  // Hidden during server render; read from localStorage on the client.
  const storedDismissal = useSyncExternalStore(subscribeNoop, readDismissed, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = dismissedNow || storedDismissal;

  useEffect(() => {
    void fetchUserPreferences();
  }, [fetchUserPreferences]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* ignore */ }
    setDismissedNow(true);
  };

  // Hide if completed, dismissed, or prefs not loaded yet
  if (dismissed) return null;
  if (userPreferences?.onboardingCompleted) return null;

  return (
    <div className="bg-surface-container-low border border-primary/30 rounded-md p-4 flex items-center gap-4 animate-fade-in">
      <span aria-hidden="true" className="material-symbols-outlined text-[24px] text-primary flex-shrink-0">grid_view</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline text-sm font-bold text-on-surface">Set up your Life Areas</h3>
        <p className="font-body text-xs text-on-surface-variant">Organize your goals, habits, tasks, money, learning, and reviews across the six areas of your life.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/onboarding"
          className="px-4 py-2 bg-scanline-gradient text-on-primary font-label text-[10px] uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity"
        >
          Start Setup
        </Link>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
