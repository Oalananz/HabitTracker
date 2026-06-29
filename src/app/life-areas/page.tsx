'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { LIFE_AREAS } from '@/lib/lifeAreas';
import dayjs from 'dayjs';

export default function LifeAreasPage() {
  const {
    goals, fetchGoals,
    habits, fetchHabits,
    tasks, fetchTasks,
    selectedDate, setSelectedDate,
  } = useStore();

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!selectedDate) setSelectedDate(today);
    void fetchGoals();
    void fetchHabits();
    void fetchTasks(today);
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
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> Life Areas
        </h1>
        <p className="font-body text-on-surface-variant">
          The six structured areas of your life. Organize goals, habits, and tasks across each.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ area, goals: g, habits: h, tasks: t, progress }) => (
          <div
            key={area.id}
            className="bg-surface-container-low border rounded-md p-5 flex flex-col gap-4 transition-all hover:translate-y-[-2px]"
            style={{ borderColor: `${area.color}33` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="material-symbols-outlined text-[24px] flex-shrink-0"
                  style={{ color: area.color }}
                  aria-hidden="true"
                >
                  {area.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-headline text-base font-bold text-on-surface truncate">{area.label}</h3>
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: area.color }}>{area.badge}</span>
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-on-surface-variant leading-relaxed">{area.description}</p>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'GOALS', value: g },
                { label: 'HABITS', value: h },
                { label: 'TASKS', value: t },
              ].map((c) => (
                <div key={c.label} className="bg-surface-container-lowest rounded-sm py-2 border border-outline-variant/10">
                  <div className="font-headline text-lg font-bold text-on-surface">{c.value}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">PROGRESS</span>
                <span className="font-mono text-[10px] font-bold" style={{ color: area.color }}>{progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: area.color }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              <Link
                href={`/life-areas/${area.id}`}
                className="flex-1 text-center px-3 py-2 rounded-sm font-label text-[10px] uppercase tracking-wider font-bold text-on-primary hover:opacity-90 transition-opacity"
                style={{ backgroundColor: area.color }}
              >
                Open
              </Link>
              <Link
                href={`/life-areas/${area.id}`}
                className="px-3 py-2 rounded-sm font-label text-[10px] uppercase tracking-wider text-on-surface-variant border border-outline-variant/20 hover:text-on-surface transition-colors"
              >
                Add Goal
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
