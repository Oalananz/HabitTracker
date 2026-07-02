'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { LIFE_AREAS } from '@/lib/lifeAreas';
import PageHeader from '@/components/ui/PageHeader';
import SkeletonPulse from '@/components/ui/SkeletonPulse';
import dayjs from 'dayjs';

interface QuickStats {
  money: { netBalance: number; currency: string } | null;
  learning: { currentStreak: number } | null;
}

export default function LifeAreasPage() {
  const {
    goals, fetchGoals, isGoalsLoading,
    habits, fetchHabits, isHabitsLoading,
    tasks, fetchTasks, isTasksLoading,
    selectedDate, setSelectedDate,
  } = useStore();

  const initialLoading = (isGoalsLoading || isHabitsLoading || isTasksLoading) &&
    goals.length === 0 && habits.length === 0 && tasks.length === 0;

  const [quickStats, setQuickStats] = useState<QuickStats>({ money: null, learning: null });

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!selectedDate) setSelectedDate(today);
    void fetchGoals();
    void fetchHabits();
    void fetchTasks(today);

    // Best-effort extra stats for the Money/Learning cards — guarded so a
    // failed fetch (e.g. tables not migrated yet) never breaks this page.
    (async () => {
      try {
        const res = await fetch('/api/money/summary');
        if (res.ok) {
          const data = await res.json();
          setQuickStats((s) => ({ ...s, money: { netBalance: data.summary?.netBalance ?? 0, currency: data.summary?.currency ?? 'JOD' } }));
        }
      } catch { /* ignore */ }
      try {
        const res = await fetch('/api/learning/summary');
        if (res.ok) {
          const data = await res.json();
          setQuickStats((s) => ({ ...s, learning: { currentStreak: data.summary?.currentStreak ?? 0 } }));
        }
      } catch { /* ignore */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    return LIFE_AREAS.map((area) => {
      const areaGoals = goals.filter((g) => g.lifeArea === area.id);
      const areaHabits = habits.filter((h) => h.isActive && h.lifeArea === area.id);
      const areaTasks = tasks.filter((t) => t.lifeArea === area.id);

      // Progress = completed (goals + today's tasks) / total trackable in area
      const trackable = [
        ...areaGoals.map((g) => g.completed),
        ...areaTasks.map((t) => t.completed),
      ];
      const done = trackable.filter(Boolean).length;
      const progress = trackable.length > 0 ? Math.round((done / trackable.length) * 100) : 0;

      return {
        area,
        goals: areaGoals.length,
        habits: areaHabits.length,
        tasks: areaTasks.length,
        progress,
      };
    });
  }, [goals, habits, tasks]);

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        title="Life Areas"
        description="The six structured areas of your life. Organize goals, habits, and tasks across each."
      />

      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} variant="card" className="h-56" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {stats.map(({ area, goals: g, habits: h, tasks: t, progress }) => (
          <div
            key={area.id}
            className="h-full bg-surface-container-low border border-outline-variant/15 rounded-md p-5 flex flex-col gap-4 transition-all hover:translate-y-[-2px]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="material-symbols-outlined text-[22px] flex-shrink-0 rounded-sm p-1.5"
                style={{ color: area.color, backgroundColor: `${area.color}14` }}
                aria-hidden="true"
              >
                {area.icon}
              </span>
              <div className="min-w-0">
                <h3 className="font-headline text-base font-semibold text-on-surface truncate">{area.label}</h3>
                <span className="text-xs text-on-surface-variant/70">{area.badge}</span>
              </div>
            </div>

            <p className="font-body text-sm text-on-surface-variant leading-relaxed">{area.description}</p>

            {/* Quick stat for Money / Learning */}
            {area.id === 'money' && quickStats.money && (
              <div className="bg-surface-container-lowest rounded-sm py-2 px-3 border border-outline-variant/10 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/80">Net balance</span>
                <span className="font-headline text-sm font-semibold text-on-surface">
                  {quickStats.money.netBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quickStats.money.currency}
                </span>
              </div>
            )}
            {area.id === 'learning' && quickStats.learning && (
              <div className="bg-surface-container-lowest rounded-sm py-2 px-3 border border-outline-variant/10 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/80">Study streak</span>
                <span className="font-headline text-sm font-semibold text-on-surface">
                  {quickStats.learning.currentStreak} days
                </span>
              </div>
            )}

            {/* Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Goals', value: g },
                { label: 'Habits', value: h },
                { label: 'Tasks', value: t },
              ].map((c) => (
                <div key={c.label} className="bg-surface-container-lowest rounded-sm py-2 border border-outline-variant/10">
                  <div className="font-headline text-lg font-bold text-on-surface">{c.value}</div>
                  <div className="text-xs text-on-surface-variant/70">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="mt-auto">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-on-surface-variant/70">Progress</span>
                <span className="text-xs font-semibold text-on-surface">{progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: area.color }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={area.id === 'money' ? '/money' : area.id === 'learning' ? '/learning' : `/life-areas/${area.id}`}
                className="flex-1 text-center px-3 py-2 rounded-sm font-label text-sm font-semibold border transition-colors"
                style={{ color: area.color, backgroundColor: `${area.color}14`, borderColor: `${area.color}40` }}
              >
                Open
              </Link>
              <Link
                href={`/goals?area=${area.id}`}
                className="px-3 py-2 rounded-sm font-label text-sm text-on-surface-variant border border-outline-variant/20 hover:text-on-surface transition-colors"
              >
                Add goal
              </Link>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
