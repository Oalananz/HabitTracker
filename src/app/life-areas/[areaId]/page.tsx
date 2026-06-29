'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getLifeArea, type LifeAreaId } from '@/lib/lifeAreas';
import dayjs from 'dayjs';

export default function LifeAreaDetailPage() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId as LifeAreaId;
  const area = getLifeArea(areaId);

  const {
    goals, fetchGoals, createGoal, toggleGoalComplete,
    habits, fetchHabits,
    tasks, fetchTasks, completeTask, uncompleteTask,
    selectedDate, setSelectedDate,
  } = useStore();

  const today = dayjs().format('YYYY-MM-DD');
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (!selectedDate) setSelectedDate(today);
    void fetchGoals();
    void fetchHabits();
    void fetchTasks(today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const areaGoals = useMemo(() => goals.filter((g) => g.lifeArea === areaId), [goals, areaId]);
  const areaHabits = useMemo(() => habits.filter((h) => h.isActive && h.lifeArea === areaId), [habits, areaId]);
  const areaTasks = useMemo(() => tasks.filter((t) => t.lifeArea === areaId), [tasks, areaId]);

  const activeGoals = areaGoals.filter((g) => !g.completed);
  const recentCompletions = [
    ...areaGoals.filter((g) => g.completed).map((g) => ({ id: g.id, label: g.title, kind: 'Goal' })),
    ...areaTasks.filter((t) => t.completed).map((t) => ({ id: t.id, label: t.title, kind: 'Task' })),
  ].slice(0, 6);

  const trackable = [...areaGoals.map((g) => g.completed), ...areaTasks.map((t) => t.completed)];
  const progress = trackable.length > 0 ? Math.round((trackable.filter(Boolean).length / trackable.length) * 100) : 0;

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;
    await createGoal({ title: newGoal.trim(), goalType: 'open', lifeArea: areaId });
    setNewGoal('');
  };

  if (!area) {
    return (
      <div className="space-y-6 animate-page-enter">
        <p className="font-mono text-sm text-on-surface-variant">Unknown life area.</p>
        <Link href="/life-areas" className="text-primary font-mono text-sm">&larr; Back to Life Areas</Link>
      </div>
    );
  }

  const sectionTitle = (text: string) => (
    <h2 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
      <span style={{ color: area.color }}>&gt;</span> {text}
    </h2>
  );

  const emptyState = (text: string) => (
    <p className="font-mono text-[11px] text-outline py-3 text-center border border-dashed border-outline-variant/20 rounded-sm">{text}</p>
  );

  return (
    <div className="space-y-6 animate-page-enter">
      <Link href="/life-areas" className="inline-flex items-center gap-1 font-mono text-[11px] text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[14px]">arrow_back</span> Life Areas
      </Link>

      {/* Header */}
      <header className="flex items-start gap-4">
        <span className="material-symbols-outlined text-[32px]" style={{ color: area.color }} aria-hidden="true">{area.icon}</span>
        <div className="flex-1">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter text-on-surface">{area.label}</h1>
          <p className="font-body text-on-surface-variant mt-1">{area.description}</p>
        </div>
      </header>

      {/* Progress summary */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'GOALS', value: areaGoals.length },
          { label: 'HABITS', value: areaHabits.length },
          { label: 'TODAY_TASKS', value: areaTasks.length },
          { label: 'PROGRESS', value: `${progress}%` },
        ].map((s) => (
          <div key={s.label}>
            <div className="font-headline text-2xl font-black" style={{ color: area.color }}>{s.value}</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Goals */}
          <section className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4">
            {sectionTitle('Active Goals')}
            {/* Quick add */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal(); }}
                placeholder="Add a goal in this area..."
                className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary/50 focus:ring-0"
              />
              <button onClick={handleAddGoal} disabled={!newGoal.trim()} className="px-3 py-2 rounded-sm text-on-primary font-label text-[10px] uppercase font-bold disabled:opacity-40" style={{ backgroundColor: area.color }}>
                Add
              </button>
            </div>
            {activeGoals.length === 0 ? emptyState('No active goals in this area.') : (
              <div className="space-y-2">
                {activeGoals.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-sm px-3 py-2 border border-outline-variant/10">
                    <button
                      onClick={() => toggleGoalComplete(g.id)}
                      className="w-4 h-4 rounded-[2px] border-2 border-outline-variant/40 hover:border-primary flex-shrink-0"
                      aria-label="Complete goal"
                    />
                    <span className="font-body text-sm text-on-surface flex-1 truncate">{g.title}</span>
                    {g.targetCount > 1 && (
                      <span className="font-mono text-[10px] text-on-surface-variant">{g.currentCount}/{g.targetCount}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Today's Tasks */}
          <section className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4">
            {sectionTitle("Today's Tasks")}
            {areaTasks.length === 0 ? emptyState('No tasks tagged to this area today.') : (
              <div className="space-y-2">
                {areaTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => (t.completed ? uncompleteTask(t.id) : completeTask(t.id))}
                    className="w-full flex items-center gap-3 bg-surface-container-lowest rounded-sm px-3 py-2 border border-outline-variant/10 text-left"
                  >
                    <span className={`w-4 h-4 rounded-[2px] border-2 flex items-center justify-center flex-shrink-0 ${t.completed ? 'border-primary bg-primary/20' : 'border-outline-variant/40'}`}>
                      {t.completed && <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                    </span>
                    <span className={`font-body text-sm flex-1 truncate ${t.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{t.title}</span>
                  </button>
                ))}
              </div>
            )}
            <Link href="/today" className="inline-block mt-3 font-mono text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider">+ Add task in Today</Link>
          </section>

          {/* Habits */}
          <section className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4">
            {sectionTitle('Habits')}
            {areaHabits.length === 0 ? emptyState('No habits in this area.') : (
              <div className="space-y-2">
                {areaHabits.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-sm px-3 py-2 border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">cached</span>
                    <span className="font-body text-sm text-on-surface flex-1 truncate">{h.title}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/habits" className="inline-block mt-3 font-mono text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider">+ Add habit</Link>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weekly Progress */}
          <section className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4">
            {sectionTitle('Weekly Progress')}
            <div className="flex items-end gap-2">
              <span className="font-headline text-4xl font-black" style={{ color: area.color }}>{progress}%</span>
              <span className="font-mono text-[10px] text-on-surface-variant mb-1">completed</span>
            </div>
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: area.color }} />
            </div>
          </section>

          {/* Recent completions */}
          <section className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4">
            {sectionTitle('Recent Completions')}
            {recentCompletions.length === 0 ? emptyState('Nothing completed yet.') : (
              <div className="space-y-1.5">
                {recentCompletions.map((c) => (
                  <div key={`${c.kind}-${c.id}`} className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="truncate flex-1">{c.label}</span>
                    <span className="text-outline">{c.kind}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notes / Reflections placeholder */}
          <section className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4">
            {sectionTitle('Notes / Reflections')}
            <p className="font-mono text-[11px] text-outline">
              Capture reflections for this area in the{' '}
              <Link href="/weekly-review" className="text-primary hover:underline">Weekly Review</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
