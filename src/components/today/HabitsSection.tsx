'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

interface HabitsSectionProps {
  /** The date whose tasks are currently loaded in the store. */
  date: string;
}

type TimeGroup = 'morning' | 'daytime' | 'evening' | 'anytime';

const TIME_GROUPS: { key: TimeGroup; label: string; hours: [number, number] }[] = [
  { key: 'morning',  label: 'Morning',  hours: [5, 12] },
  { key: 'daytime',  label: 'Daytime',  hours: [12, 17] },
  { key: 'evening',  label: 'Evening',  hours: [17, 22] },
  { key: 'anytime',  label: 'Anytime',  hours: [0, 24] },
];

/** Naively assign habits to a time group by category keyword. */
function habitTimeGroup(category: string | null | undefined): TimeGroup {
  const c = (category ?? '').toLowerCase();
  if (c.includes('morning') || c.includes('fajr') || c.includes('dawn')) return 'morning';
  if (c.includes('evening') || c.includes('night') || c.includes('isha') || c.includes('maghrib')) return 'evening';
  if (c.includes('afternoon') || c.includes('dhuhr') || c.includes('asr')) return 'daytime';
  return 'anytime';
}

/** Which group is active right now based on clock hour. */
function currentGroup(): TimeGroup {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'daytime';
  if (h >= 17 && h < 22) return 'evening';
  return 'anytime';
}

export default function HabitsSection({ date }: HabitsSectionProps) {
  const {
    habits, fetchHabits, isHabitsLoading,
    tasks, completeTask, uncompleteTask, addActivityLog,
  } = useStore();

  const [openGroups, setOpenGroups] = useState<Set<TimeGroup>>(() => new Set([currentGroup()]));
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  const activeHabits = habits.filter(h => h.isActive);

  const taskForHabit = (habitId: string) =>
    tasks.find(t => t.habitId === habitId && t.date === date);

  const scheduled = activeHabits.filter(h => taskForHabit(h.id));
  const doneCount = scheduled.filter(h => taskForHabit(h.id)?.completed).length;

  const handleToggle = async (habitId: string, title: string) => {
    const task = taskForHabit(habitId);
    if (!task || busy) return;
    setBusy(habitId);
    try {
      if (task.completed) {
        await uncompleteTask(task.id);
        addActivityLog('HABITS', `'${title}' marked incomplete.`);
      } else {
        await completeTask(task.id);
        addActivityLog('HABITS', `'${title}' completed.`);
      }
    } finally {
      setBusy(null);
    }
  };

  const toggleGroup = (group: TimeGroup) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  // Group habits by time
  const grouped: Record<TimeGroup, typeof scheduled> = {
    morning: [],
    daytime: [],
    evening: [],
    anytime: [],
  };
  for (const h of scheduled) {
    grouped[habitTimeGroup(h.category)].push(h);
  }

  const nonEmptyGroups = TIME_GROUPS.filter(g => grouped[g.key].length > 0);

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
        <h2 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
          <span className="text-primary">&gt;</span> Habits Due Today
        </h2>
        <div className="flex items-center gap-3">
          {scheduled.length > 0 && (
            <span className="font-mono text-[10px] text-on-surface-variant">
              <span className="text-primary font-bold">{doneCount}</span>/{scheduled.length} done
            </span>
          )}
          <Link
            href="/habits"
            className="font-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            All habits
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 pt-2 space-y-2">
        {isHabitsLoading && activeHabits.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center font-mono text-xs text-on-surface-variant">
            <span className="animate-blink text-primary">▊</span> Loading habits...
          </div>
        ) : scheduled.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <span className="material-symbols-outlined text-[22px] text-outline">cached</span>
            <span className="font-body text-sm text-on-surface-variant">No habits due today.</span>
            <Link
              href="/habits"
              className="px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-[10px] text-primary transition-all"
            >
              Manage Habits
            </Link>
          </div>
        ) : nonEmptyGroups.length === 0 ? null : (
          <div className="space-y-1.5">
            {nonEmptyGroups.map(({ key, label }) => {
              const groupHabits = grouped[key];
              const groupDone = groupHabits.filter(h => taskForHabit(h.id)?.completed).length;
              const isOpen = openGroups.has(key);

              return (
                <div key={key}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(key)}
                    aria-expanded={isOpen}
                    aria-controls={`habit-group-${key}`}
                    className="flex items-center justify-between w-full py-1 text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">
                        {label}
                      </span>
                      <span className="font-mono text-[9px] text-on-surface-variant/60">
                        <span className={groupDone === groupHabits.length ? 'text-primary' : 'text-on-surface-variant'}>
                          {groupDone}
                        </span>/{groupHabits.length}
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div id={`habit-group-${key}`} className="space-y-1.5 mt-1 animate-fade-in">
                      {groupHabits.map(habit => {
                        const task = taskForHabit(habit.id);
                        const checked = Boolean(task?.completed);
                        return (
                          <button
                            key={habit.id}
                            onClick={() => handleToggle(habit.id, habit.title)}
                            disabled={busy === habit.id}
                            aria-pressed={checked}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all duration-150 text-left w-full min-h-[44px] ${
                              checked
                                ? 'border-primary/30 bg-primary/5 text-primary'
                                : 'border-outline-variant/15 bg-surface-container-lowest text-on-surface-variant hover:border-primary/20 hover:text-on-surface'
                            } ${busy === habit.id ? 'opacity-60' : 'cursor-pointer'}`}
                          >
                            <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center flex-shrink-0 transition-all ${
                              checked ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40 bg-transparent'
                            }`}>
                              {checked && (
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  check
                                </span>
                              )}
                            </span>
                            <span className={`font-body text-sm font-medium flex-1 ${checked ? 'line-through opacity-70' : ''}`}>
                              {habit.title}
                            </span>
                            {habit.category && (
                              <span className="font-mono text-[9px] text-on-surface-variant/60 px-1.5 py-0.5 bg-surface-container rounded-[2px]">
                                {habit.category}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
