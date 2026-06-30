'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import type { DayRecord } from '@/lib/services/dayRecordService';
import type { EveningReviewOutput } from '@/lib/ai/schemas';
import { AiLoadingState, AiErrorState } from '@/components/ai/AiPrimitives';
import { pushTodayState, TODAY_STATE_HYDRATED } from '@/lib/todayState';
import dayjs from 'dayjs';

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

function loadPriorities(date: string): { title: string; completed: boolean }[] {
  try {
    const raw = localStorage.getItem(`topPriorities:${date}`);
    if (!raw) return [];
    return (JSON.parse(raw) as { title: string; completed: boolean }[])
      .map(p => ({ title: p.title, completed: Boolean(p.completed) }));
  } catch {
    return [];
  }
}

export default function EveningReviewCard({ date }: { date: string }) {
  const { addToast } = useToast();
  const { dayRecord, tasks, habits, journeys, failures } = useStore();
  const [wins, setWins] = useState(() => load(date)?.wins ?? '');
  const [problems, setProblems] = useState(() => load(date)?.problems ?? '');
  const [improvement, setImprovement] = useState(() => load(date)?.tomorrowImprovement ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(() => load(date)?.updatedAt ?? null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [reflection, setReflection] = useState<EveningReviewOutput | null>(null);

  // When the server hydrates localStorage for this date, reload the saved
  // review (only fills fields the user hasn't started editing).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ date?: string }>).detail;
      if (detail?.date && detail.date !== date) return;
      const existing = load(date);
      if (!existing) return;
      setWins(prev => (prev.trim() ? prev : existing.wins));
      setProblems(prev => (prev.trim() ? prev : existing.problems));
      setImprovement(prev => (prev.trim() ? prev : existing.tomorrowImprovement));
      setSavedAt(existing.updatedAt);
    };
    window.addEventListener(TODAY_STATE_HYDRATED, handler);
    return () => window.removeEventListener(TODAY_STATE_HYDRATED, handler);
  }, [date]);

  const generateAi = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const dueHabits = habits.filter(h => h.isActive && tasks.some(t => t.habitId === h.id && t.date === date));
      const doneHabits = dueHabits.filter(h => tasks.find(t => t.habitId === h.id && t.date === date)?.completed);
      const prayersDone = dayRecord
        ? (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).filter(k => dayRecord[k as keyof DayRecord]).length
        : 0;
      const slipsToday = failures.filter(f => f.journeyId && dayjs(f.timestamp).format('YYYY-MM-DD') === date && journeys.some(j => j.id === f.journeyId)).length;

      const body = {
        date,
        dayStats: {
          dailyScore: dayRecord?.dailyScore ?? 0,
          tasksCompleted: tasks.filter(t => t.completed).length,
          tasksTotal: tasks.length,
          habitsDone: doneHabits.length,
          habitsDue: dueHabits.length,
          prayersDone,
          focusHours: dayRecord?.focusHours ?? 0,
          focusGoal: dayRecord?.focusGoal ?? 6,
          sleepHours: dayRecord?.sleepHours ?? 0,
          sleepGoal: dayRecord?.sleepGoal ?? 7,
          slipsToday,
        },
        priorities: loadPriorities(date),
        userReflection: { wins, problems, tomorrowImprovement: improvement },
      };

      const res = await fetch('/api/ai/evening-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'AI request failed.'); return; }
      setReflection(data.reflection);
    } catch {
      setAiError('Network error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Fill empty fields from the AI draft; never overwrite what the user typed.
  const applyAi = () => {
    if (!reflection) return;
    if (!wins.trim() && reflection.wins.length) setWins(reflection.wins.join('\n'));
    if (!problems.trim() && reflection.improvements.length) setProblems(reflection.improvements.join('\n'));
    if (!improvement.trim() && reflection.tomorrowFocus.length) setImprovement(reflection.tomorrowFocus.join('\n'));
    addToast('AI reflection applied to empty fields', 'success', 2000);
  };

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
      pushTodayState(date); // sync to DB (across devices)
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={saving || (!wins.trim() && !problems.trim() && !improvement.trim())}
          className="px-4 py-2 bg-scanline-gradient text-on-primary font-label text-xs uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Review'}
        </button>
        <button
          onClick={generateAi}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary/40 bg-primary/10 text-primary font-label text-xs uppercase tracking-wider font-bold rounded-sm hover:bg-primary/15 transition-all disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${aiLoading ? 'animate-spin' : ''}`}>
            {aiLoading ? 'progress_activity' : 'auto_awesome'}
          </span>
          {aiLoading ? 'Reflecting…' : 'Generate AI Reflection'}
        </button>
      </div>

      {aiLoading && <AiLoadingState message="Reflecting on your day…" />}
      {aiError && !aiLoading && <AiErrorState message={aiError} onRetry={generateAi} />}

      {reflection && !aiLoading && (
        <div className="bg-surface-container-lowest border border-primary/25 rounded-md p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
              <span className="font-label text-xs font-bold text-on-surface uppercase tracking-wide">AI Reflection</span>
            </div>
            <button onClick={() => setReflection(null)} className="text-on-surface-variant hover:text-on-surface transition-colors" title="Dismiss">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {reflection.summary && <p className="font-body text-sm text-on-surface">{reflection.summary}</p>}

          {reflection.wins.length > 0 && (
            <div>
              <div className="font-label text-[10px] uppercase tracking-widest text-primary mb-1">Wins</div>
              <ul className="space-y-0.5">
                {reflection.wins.map((w, i) => <li key={i} className="font-body text-xs text-on-surface-variant">• {w}</li>)}
              </ul>
            </div>
          )}

          {reflection.improvements.length > 0 && (
            <div>
              <div className="font-label text-[10px] uppercase tracking-widest text-tertiary mb-1">Improve</div>
              <ul className="space-y-0.5">
                {reflection.improvements.map((w, i) => <li key={i} className="font-body text-xs text-on-surface-variant">• {w}</li>)}
              </ul>
            </div>
          )}

          {reflection.tomorrowFocus.length > 0 && (
            <div>
              <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Tomorrow</div>
              <ul className="space-y-0.5">
                {reflection.tomorrowFocus.map((w, i) => <li key={i} className="font-body text-xs text-on-surface flex gap-1.5"><span className="material-symbols-outlined text-[13px] text-primary">arrow_right</span>{w}</li>)}
              </ul>
            </div>
          )}

          {reflection.encouragement && (
            <p className="font-body text-xs text-primary/90 italic">{reflection.encouragement}</p>
          )}

          <button
            onClick={applyAi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-scanline-gradient text-on-primary font-label text-[10px] uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            Apply to empty fields
          </button>
        </div>
      )}
    </div>
  );
}
