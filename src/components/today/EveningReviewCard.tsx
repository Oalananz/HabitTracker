'use client';

import { useState } from 'react';
import { useToast } from '@/store/useToast';

interface DailyReview {
  id: string;
  date: string;
  wins: string;
  problems: string;
  tomorrowImprovement: string;
  createdAt: string;
  updatedAt: string;
}

function storageKey(date: string) {
  return `dailyReview:${date}`;
}

function load(date: string): DailyReview | null {
  try {
    const raw = localStorage.getItem(storageKey(date));
    return raw ? (JSON.parse(raw) as DailyReview) : null;
  } catch {
    return null;
  }
}

export default function EveningReviewCard({ date }: { date: string }) {
  const { addToast } = useToast();
  const [wins, setWins] = useState(() => load(date)?.wins ?? '');
  const [problems, setProblems] = useState(() => load(date)?.problems ?? '');
  const [improvement, setImprovement] = useState(() => load(date)?.tomorrowImprovement ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(() => load(date)?.updatedAt ?? null);

  const save = () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const existing = load(date);
      const review: DailyReview = {
        id: existing?.id ?? `review_${date}`,
        date,
        wins: wins.trim(),
        problems: problems.trim(),
        tomorrowImprovement: improvement.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      localStorage.setItem(storageKey(date), JSON.stringify(review));
      setSavedAt(now);
      addToast('Evening review saved', 'success', 2000);
    } catch {
      addToast('Could not save review', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Evening Review
        </h3>
        {savedAt && (
          <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider">✓ Saved</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="font-label text-xs text-on-surface-variant">What went well today?</label>
          <textarea
            value={wins}
            onChange={e => setWins(e.target.value)}
            rows={2}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-sm p-2 text-sm font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 resize-none"
            placeholder="Wins, progress, things you're proud of…"
          />
        </div>
        <div className="space-y-1">
          <label className="font-label text-xs text-on-surface-variant">What did I avoid or delay?</label>
          <textarea
            value={problems}
            onChange={e => setProblems(e.target.value)}
            rows={2}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-sm p-2 text-sm font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 resize-none"
            placeholder="Things you put off or avoided…"
          />
        </div>
        <div className="space-y-1">
          <label className="font-label text-xs text-on-surface-variant">What should I improve tomorrow?</label>
          <textarea
            value={improvement}
            onChange={e => setImprovement(e.target.value)}
            rows={2}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-sm p-2 text-sm font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 resize-none"
            placeholder="One thing to do differently tomorrow…"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving || (!wins.trim() && !problems.trim() && !improvement.trim())}
        className="px-4 py-2 bg-scanline-gradient text-on-primary font-label text-xs uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save Review'}
      </button>
    </div>
  );
}
