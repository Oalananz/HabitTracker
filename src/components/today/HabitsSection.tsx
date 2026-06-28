'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

interface HabitsSectionProps {
  /** The date whose tasks are currently loaded in the store. */
  date: string;
}

export default function HabitsSection({ date }: HabitsSectionProps) {
  const {
    habits, fetchHabits, isHabitsLoading,
    tasks, completeTask, uncompleteTask, addActivityLog,
  } = useStore();

  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  const activeHabits = habits.filter(h => h.isActive);

  // Match each habit to its generated task for the loaded date.
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

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md">
      {/* Collapsible header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 group"
        aria-expanded={!collapsed}
      >
        <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
          <span className="text-primary">&gt;</span> HABITS_TRACKER
        </h3>
        <div className="flex items-center gap-3">
          {scheduled.length > 0 && (
            <span className="font-mono text-[10px] text-on-surface-variant">
              <span className="text-primary font-bold">{doneCount}</span>/{scheduled.length} done
            </span>
          )}
          <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${collapsed ? '' : 'rotate-180'}`}>
            expand_more
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 border-t border-outline-variant/10 animate-fade-in">
          {isHabitsLoading && activeHabits.length === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center font-mono text-xs text-on-surface-variant">
              <span className="animate-blink text-primary">▊</span> Loading habits...
            </div>
          ) : activeHabits.length === 0 ? (
            <Link
              href="/habits"
              className="flex flex-col items-center text-center gap-1 py-5 border border-dashed border-outline-variant/25 rounded-sm hover:border-primary/40 hover:text-primary transition-colors mt-2"
            >
              <span className="material-symbols-outlined text-[22px] text-outline">add_circle</span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                No active habits — define one in Habits
              </span>
            </Link>
          ) : (
            <div className="space-y-1.5 mt-2">
              {activeHabits.map(habit => {
                const task = taskForHabit(habit.id);
                const checked = Boolean(task?.completed);
                const unscheduled = !task;
                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggle(habit.id, habit.title)}
                    disabled={unscheduled || busy === habit.id}
                    title={unscheduled ? 'Not scheduled today' : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all duration-150 text-left w-full ${
                      checked
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-outline-variant/15 bg-surface-container-lowest text-on-surface-variant hover:border-primary/20 hover:text-on-surface'
                    } ${unscheduled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40 bg-transparent'
                    }`}>
                      {checked && <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                    </span>
                    <span className={`font-mono text-[11px] uppercase tracking-wider font-bold flex-1 ${checked ? 'line-through opacity-80' : ''}`}>
                      {habit.title}
                    </span>
                    {habit.category && (
                      <span className="font-mono text-[9px] text-on-surface-variant/70 px-1.5 py-0.5">
                        {habit.category}
                      </span>
                    )}
                    {unscheduled && (
                      <span className="font-mono text-[9px] text-outline px-1.5 py-0.5">off today</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
