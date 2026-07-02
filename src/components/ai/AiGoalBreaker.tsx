'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import type { GoalBreakerOutput } from '@/lib/ai/schemas';
import { LIFE_AREAS, lifeAreaLabelToId, type LifeAreaId } from '@/lib/lifeAreas';
import { AiGenerateButton, AiLoadingState, AiErrorState, AiResultCard } from './AiPrimitives';
import AiGoalBreakdownPreview from './AiGoalBreakdownPreview';
import { useConfirm } from '@/components/ui/useConfirm';
import dayjs from 'dayjs';

const PRIORITY_MAP: Record<string, string> = { high: 'critical', medium: 'nominal', low: 'low' };

export default function AiGoalBreaker({
  initialTitle = '', initialDescription = '', initialLifeArea = null,
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialLifeArea?: LifeAreaId | null;
}) {
  const { createTask, createHabit } = useStore();
  const { addToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [lifeArea, setLifeArea] = useState<LifeAreaId | ''>(initialLifeArea || '');
  const [deadline, setDeadline] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timePerDay, setTimePerDay] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GoalBreakerOutput | null>(null);
  const [addingTasks, setAddingTasks] = useState(false);
  const [addingHabits, setAddingHabits] = useState(false);

  const generate = async () => {
    if (!title.trim()) { addToast('Enter a goal title first', 'error'); return; }
    setLoading(true);
    setError(null);
    try {
      // PRIVACY: only the goal text the user intentionally typed is sent.
      const res = await fetch('/api/ai/goal-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: title.trim(),
          goalDescription: description.trim(),
          lifeArea: lifeArea || undefined,
          deadline: deadline || undefined,
          difficulty,
          timeAvailablePerDay: timePerDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'AI request failed.'); return; }
      setResult(data.breakdown);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirmed creation only — nothing is created until the user clicks these.
  const addTasks = async () => {
    if (!result) return;
    if (!(await confirm({ message: "Add all milestone tasks to today's task list?", danger: false, confirmLabel: 'Add' }))) return;
    setAddingTasks(true);
    try {
      const areaId = lifeAreaLabelToId(result.lifeArea) || (lifeArea || null);
      const today = dayjs().format('YYYY-MM-DD');
      let count = 0;
      for (const m of result.milestones) {
        for (const t of m.tasks) {
          await createTask({
            title: t.title,
            description: t.description || undefined,
            category: 'General',
            priority: PRIORITY_MAP[t.priority] || 'nominal',
            date: today,
            lifeArea: areaId,
          });
          count++;
        }
      }
      addToast(`Added ${count} tasks`, 'success', 2000);
    } finally { setAddingTasks(false); }
  };

  const addHabits = async () => {
    if (!result) return;
    if (!(await confirm({ message: 'Add the suggested habits?', danger: false, confirmLabel: 'Add' }))) return;
    setAddingHabits(true);
    try {
      let count = 0;
      for (const h of result.suggestedHabits) {
        const areaId = lifeAreaLabelToId(h.lifeArea) || lifeAreaLabelToId(result.lifeArea) || (lifeArea || null);
        await createHabit({
          title: h.title,
          category: 'General',
          repeatRule: h.frequency === 'weekly' ? { type: 'custom', days: [1] } : { type: 'daily' },
          lifeArea: areaId,
        });
        count++;
      }
      addToast(`Added ${count} habits`, 'success', 2000);
    } finally { setAddingHabits(false); }
  };

  const copy = async () => {
    if (!result) return;
    const text = [
      `Goal: ${result.goalTitle} (~${result.estimatedDurationWeeks} weeks)`,
      result.strategy, '',
      'First actions:', ...result.firstThreeActions.map((a, i) => `${i + 1}. ${a}`), '',
      ...result.milestones.flatMap((m) => [`M${m.order}: ${m.title}`, ...m.tasks.map((t) => `  - ${t.title} (${t.estimatedMinutes}m)`)]),
    ].join('\n');
    try { await navigator.clipboard.writeText(text); addToast('Plan copied', 'success', 1500); } catch { /* ignore */ }
  };

  const inputCls = 'w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary/50 focus:ring-0';
  const labelCls = 'font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1';

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-5 space-y-4">
      {ConfirmDialog}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
        <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wide">AI Goal Breaker</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className={labelCls}>&gt; GOAL_TITLE</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Finish a course, Build a project" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>&gt; DESCRIPTION (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Any detail you want the AI to consider" />
        </div>
        <div>
          <label className={labelCls}>&gt; LIFE_AREA</label>
          <select value={lifeArea} onChange={(e) => setLifeArea(e.target.value as LifeAreaId | '')} className={inputCls}>
            <option value="">Unassigned</option>
            {LIFE_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>&gt; DEADLINE (optional)</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>&gt; DIFFICULTY</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className={inputCls}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>&gt; TIME_PER_DAY</label>
          <select value={timePerDay} onChange={(e) => setTimePerDay(parseInt(e.target.value))} className={inputCls}>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>

      {!loading && <AiGenerateButton label="Break Goal with AI" loadingLabel="Breaking goal into steps…" loading={loading} onClick={generate} />}
      {loading && <AiLoadingState message="Breaking goal into steps…" />}
      {error && !loading && <AiErrorState message={error} onRetry={generate} />}

      {result && !loading && (
        <AiResultCard
          title={result.goalTitle}
          onCopy={copy}
          onRegenerate={generate}
          onDismiss={() => setResult(null)}
        >
          <AiGoalBreakdownPreview
            breakdown={result}
            onAddTasks={addTasks}
            onAddHabits={addHabits}
            addingTasks={addingTasks}
            addingHabits={addingHabits}
          />
        </AiResultCard>
      )}
    </div>
  );
}
