'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DailyPlannerOutput } from '@/lib/ai/schemas';
import { lifeAreaLabelToId } from '@/lib/lifeAreas';
import { buildDailyPlannerInput } from '@/lib/ai/buildDailyPlannerInput';
import { pushTodayState, TODAY_STATE_HYDRATED } from '@/lib/todayState';
import { useToast } from '@/store/useToast';
import { AiGenerateButton, AiLoadingState, AiErrorState, AiResultCard } from './AiPrimitives';
import AiPlanPreview from './AiPlanPreview';
import dayjs from 'dayjs';

function planStorageKey(date: string) {
  return `aiDailyPlan:${date}`;
}

function loadSavedPlan(date: string): DailyPlannerOutput | null {
  try {
    const raw = localStorage.getItem(planStorageKey(date));
    return raw ? (JSON.parse(raw) as DailyPlannerOutput) : null;
  } catch {
    return null;
  }
}

export default function AiDailyPlanner({ date }: { date: string }) {
  const { tasks, habits, goals, fetchGoals, fetchHabits, prayerTimes } = useStore();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  // Restore a previously-saved plan for this date so it persists across reloads.
  const [plan, setPlan] = useState<DailyPlannerOutput | null>(() => loadSavedPlan(date));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<boolean>(() => loadSavedPlan(date) !== null);

  useEffect(() => {
    if (goals.length === 0) void fetchGoals();
    if (habits.length === 0) void fetchHabits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-read the saved plan when the server hydrates localStorage for this date.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ date?: string }>).detail;
      if (detail?.date && detail.date !== date) return;
      const restored = loadSavedPlan(date);
      if (restored) { setPlan(restored); setSaved(true); }
    };
    window.addEventListener(TODAY_STATE_HYDRATED, handler);
    return () => window.removeEventListener(TODAY_STATE_HYDRATED, handler);
  }, [date]);

  const buildInput = () => buildDailyPlannerInput(date, tasks, habits, goals, prayerTimes);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/daily-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput()),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'AI request failed.'); return; }
      setPlan(data.plan);
      setSaved(false); // freshly generated; not yet saved
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!plan) return;
    const text = [
      plan.title, plan.summary, '',
      'TOP PRIORITIES:', ...plan.topPriorities.map((p, i) => `${i + 1}. ${p.title} — ${p.reason}`), '',
      'SCHEDULE:', ...plan.scheduleBlocks.map((b) => `${b.label}: ${b.title} (${b.durationMinutes}m)`), '',
      'WARNINGS:', ...plan.warnings,
    ].join('\n');
    try { await navigator.clipboard.writeText(text); addToast('Plan copied', 'success', 1500); } catch { /* ignore */ }
  };

  const save = () => {
    if (!plan) return;
    setSaving(true);
    try {
      // Saved locally (no DB migration needed) — consistent createdAt/updatedAt.
      const now = new Date().toISOString();
      localStorage.setItem(planStorageKey(date), JSON.stringify({ id: `plan_${date}`, date, ...plan, createdAt: now, updatedAt: now }));
      setSaved(true);
      pushTodayState(date); // sync to DB (across devices)
      addToast('Plan saved for today', 'success', 2000);
    } catch { addToast('Could not save plan', 'error'); }
    finally { setSaving(false); }
  };

  const dismiss = () => {
    try { localStorage.removeItem(planStorageKey(date)); } catch { /* ignore */ }
    setPlan(null);
    setError(null);
    setSaved(false);
    pushTodayState(date); // sync removal to DB
  };

  // Push the plan's top priorities into the Today "Top 3 Priorities" card.
  // Writes the same localStorage shape that card uses, then notifies it.
  const useAsPriorities = () => {
    if (!plan || plan.topPriorities.length === 0) return;
    try {
      const items = plan.topPriorities.slice(0, 3).map((p, i) => ({
        id: `pr_ai_${date}_${i}`,
        title: p.title,
        lifeArea: lifeAreaLabelToId(p.lifeArea) || undefined,
        completed: false,
      }));
      localStorage.setItem(`topPriorities:${date}`, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('topPriorities:updated', { detail: { date } }));
      pushTodayState(date); // sync to DB
      addToast('Set as your Top 3 Priorities', 'success', 2000);
    } catch { addToast('Could not set priorities', 'error'); }
  };

  return (
    <div className="space-y-3">
      {!plan && !loading && (
        <AiGenerateButton label="Generate Today's Plan" loadingLabel="Generating plan…" loading={loading} onClick={generate} />
      )}
      {loading && <AiLoadingState message="Generating plan…" />}
      {error && !loading && <AiErrorState message={error} onRetry={generate} />}
      {plan && !loading && (
        <AiResultCard
          title={plan.title || "Today's AI Plan"}
          onSave={save} saving={saving}
          onCopy={copy}
          onRegenerate={generate}
          onDismiss={dismiss}
          saveLabel={saved ? 'Update Saved Plan' : 'Save Plan'}
        >
          {saved && (
            <div className="mb-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-[2px]">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Saved on this device
            </div>
          )}
          {plan.topPriorities.length > 0 && (
            <button
              onClick={useAsPriorities}
              className="mb-4 inline-flex items-center gap-1.5 px-4 py-2 bg-scanline-gradient text-on-primary font-label text-[10px] uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">flag</span>
              Use as Top 3 Priorities
            </button>
          )}
          <AiPlanPreview plan={plan} />
          <div className="font-mono text-[9px] text-outline mt-4">{dayjs(date).format('ddd, MMM D, YYYY')}</div>
        </AiResultCard>
      )}
    </div>
  );
}
