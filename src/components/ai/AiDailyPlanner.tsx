'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { LIFE_AREA_LABELS } from '@/lib/ai/schemas';
import type { DailyPlannerOutput } from '@/lib/ai/schemas';
import { lifeAreaIdToLabel } from '@/lib/lifeAreas';
import { useToast } from '@/store/useToast';
import { AiGenerateButton, AiLoadingState, AiErrorState, AiResultCard } from './AiPrimitives';
import AiPlanPreview from './AiPlanPreview';
import dayjs from 'dayjs';

export default function AiDailyPlanner({ date }: { date: string }) {
  const { tasks, habits, goals, fetchGoals, fetchHabits, prayerTimes } = useStore();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DailyPlannerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goals.length === 0) void fetchGoals();
    if (habits.length === 0) void fetchHabits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * PRIVACY: this payload is intentionally minimal — only generic titles,
   * life-area LABELS, statuses, priorities, due dates and numeric stats.
   * No descriptions, notes, ids, emails, or auth data are ever included.
   */
  function buildInput() {
    const activeGoals = goals.filter((g) => g.isActive !== false && !g.completed);
    const activeHabits = habits.filter((h) => h.isActive);
    const completedTasks = tasks.filter((t) => t.completed).length;
    const habitTasks = tasks.filter((t) => t.sourceType === 'habit');
    const habitRate = habitTasks.length
      ? Math.round((habitTasks.filter((t) => t.completed).length / habitTasks.length) * 100)
      : 0;

    const pt = prayerTimes
      ? { fajr: prayerTimes.fajr, dhuhr: prayerTimes.dhuhr, asr: prayerTimes.asr, maghrib: prayerTimes.maghrib, isha: prayerTimes.isha }
      : undefined;

    return {
      date,
      lifeAreas: [...LIFE_AREA_LABELS],
      dayStats: {
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks: 0,
        activeGoals: activeGoals.length,
        activeHabits: activeHabits.length,
        habitCompletionRate: habitRate,
      },
      tasks: tasks.map((t) => ({
        title: t.title,
        lifeArea: lifeAreaIdToLabel(t.lifeArea) || undefined,
        priority: t.priority,
        status: t.completed ? 'completed' : 'pending',
      })),
      habits: activeHabits.map((h) => ({
        title: h.title,
        lifeArea: lifeAreaIdToLabel(h.lifeArea) || undefined,
        status: 'pending',
      })),
      goals: activeGoals.map((g) => ({
        title: g.title,
        lifeArea: lifeAreaIdToLabel(g.lifeArea) || undefined,
        progress: g.targetCount > 0 ? Math.round((g.currentCount / g.targetCount) * 100) : 0,
        dueDate: g.targetDate || undefined,
      })),
      prayerTimes: pt,
      preferences: { usePrayerBlocks: Boolean(pt), maxTopPriorities: 3, planningStyle: 'balanced' },
    };
  }

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
      localStorage.setItem(`aiDailyPlan:${date}`, JSON.stringify({ id: `plan_${date}`, date, ...plan, createdAt: now, updatedAt: now }));
      addToast('Plan saved for today', 'success', 2000);
    } catch { addToast('Could not save plan', 'error'); }
    finally { setSaving(false); }
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
          onDismiss={() => { setPlan(null); setError(null); }}
          saveLabel="Save Plan"
        >
          <AiPlanPreview plan={plan} />
          <div className="font-mono text-[9px] text-outline mt-4">{dayjs(date).format('ddd, MMM D, YYYY')}</div>
        </AiResultCard>
      )}
    </div>
  );
}
