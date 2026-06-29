'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

const DISMISS_KEY = 'lifeAreasOnboardingDismissed';

/**
 * Non-blocking prompt nudging users to complete Life Areas onboarding.
 * Shown only when onboarding hasn't been completed and the user hasn't
 * dismissed it locally. Never blocks the app.
 */
export default function OnboardingPrompt() {
  const { userPreferences, fetchUserPreferences } = useStore();
  const [dismissed, setDismissed] = useState(true); // default hidden until we check

  useEffect(() => {
    void fetchUserPreferences();
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
    } catch {
      setDismissed(false);
    }
  }, [fetchUserPreferences]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* ignore */ }
    setDismissed(true);
  };

  // Hide if completed, dismissed, or prefs not loaded yet
  if (dismissed) return null;
  if (userPreferences?.onboardingCompleted) return null;

  return (
    <div className="bg-surface-container-low border border-primary/30 rounded-md p-4 flex items-center gap-4 animate-fade-in">
      <span className="material-symbols-outlined text-[24px] text-primary flex-shrink-0">grid_view</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline text-sm font-bold text-on-surface">Set up your Life Areas</h3>
        <p className="font-body text-xs text-on-surface-variant">Organize goals, habits, and tasks across the six areas of your life.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/onboarding"
          className="px-4 py-2 bg-scanline-gradient text-on-primary font-label text-[10px] uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity"
        >
          Start
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
