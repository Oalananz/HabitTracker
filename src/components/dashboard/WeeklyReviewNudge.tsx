'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';

/**
 * Dismissible nudge shown on the Dashboard when the current week has no
 * saved Weekly Review yet. Dismissal is remembered per-week, so it
 * returns automatically next week. Never blocks anything.
 */
export default function WeeklyReviewNudge() {
  const [show, setShow] = useState(false);
  const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
  const dismissKey = `weeklyReviewNudgeDismissed:${weekStart}`;

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(dismissKey) === 'true'; } catch { /* ignore */ }
    if (dismissed) return;
    (async () => {
      try {
        const res = await fetch(`/api/weekly-review?weekStart=${weekStart}`);
        const data = await res.json();
        if (res.ok && !data.review) setShow(true);
      } catch { /* offline — stay hidden */ }
    })();
  }, [dismissKey, weekStart]);

  const dismiss = () => {
    try { localStorage.setItem(dismissKey, 'true'); } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-surface-container-low border border-tertiary/30 rounded-md p-4 flex items-center gap-4 animate-fade-in">
      <span className="material-symbols-outlined text-[24px] text-tertiary flex-shrink-0">fact_check</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline text-sm font-bold text-on-surface">Weekly review due</h3>
        <p className="font-body text-xs text-on-surface-variant">You haven&apos;t reviewed this week yet — reflect across your six life areas.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/weekly-review" className="px-4 py-2 bg-tertiary text-on-tertiary font-label text-[10px] uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity">
          Review
        </Link>
        <button onClick={dismiss} className="px-3 py-2 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}
