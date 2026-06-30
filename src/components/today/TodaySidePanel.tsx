'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useStore } from '@/store/useStore';
import type { DayRecord } from '@/lib/services/dayRecordService';
import ScoreDisplay from './ScoreDisplay';
import ActivityLog from './ActivityLog';
import { getNextPrayer } from '@/lib/prayerSchedule';

interface TodaySidePanelProps {
  dayRecord: DayRecord | null;
  date: string;
}

function loadPriorityCount(date: string): number {
  try {
    const raw = localStorage.getItem(`topPriorities:${date}`);
    return raw ? (JSON.parse(raw) as unknown[]).length : 0;
  } catch {
    return 0;
  }
}

export default function TodaySidePanel({ dayRecord, date }: TodaySidePanelProps) {
  const { tasks, habits, journeys, prayerTimes, userStats, activityLog } = useStore();
  const [logExpanded, setLogExpanded] = useState(false);

  // Count manual tasks only — habits are reported separately below.
  const manualTasks = tasks.filter(t => t.sourceType !== 'habit');
  const completedTasks = manualTasks.filter(t => t.completed).length;
  const totalTasks = manualTasks.length;
  const activeHabits = habits.filter(h => h.isActive);
  const dueHabits = activeHabits.filter(h => tasks.some(t => t.habitId === h.id && t.date === date));
  const doneHabits = dueHabits.filter(h => tasks.find(t => t.habitId === h.id && t.date === date)?.completed);
  const prayersDone = dayRecord ? ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(k => dayRecord[k as keyof DayRecord]).length : 0;

  const nextPrayer = dayRecord ? getNextPrayer(prayerTimes, dayRecord) : null;

  const warnings: string[] = [];
  if (loadPriorityCount(date) === 0) warnings.push('No priorities selected');
  if (totalTasks === 0) warnings.push('No tasks planned');
  if (dayRecord && dayRecord.sleepHours === 0) warnings.push('No sleep logged');
  if (journeys.length === 0) warnings.push('No recovery journeys set up');
  const weekday = dayjs(date).day();
  if (weekday === 0) warnings.push('Weekly review pending');

  const logEntries = activityLog.slice().reverse().slice(0, 50);

  return (
    <div className="flex flex-col gap-4">
      <ScoreDisplay dayRecord={dayRecord} userStats={userStats} />

      {/* Next Prayer mini */}
      {nextPrayer && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-4">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Next Prayer</span>
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="font-headline text-xl font-bold text-on-surface">{nextPrayer.label}</div>
              {nextPrayer.time && <div className="font-mono text-xs text-on-surface-variant">{nextPrayer.time}</div>}
            </div>
            {nextPrayer.done && <span className="font-label text-[10px] text-primary uppercase">✓ Done</span>}
          </div>
        </div>
      )}

      {/* Today Progress */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-4 space-y-2">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Today&apos;s Progress</span>
        <div className="space-y-1.5 mt-1">
          <div className="flex justify-between font-body text-xs text-on-surface-variant">
            <span>Tasks</span><span className="text-on-surface font-bold">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="flex justify-between font-body text-xs text-on-surface-variant">
            <span>Habits</span><span className="text-on-surface font-bold">{doneHabits.length}/{dueHabits.length}</span>
          </div>
          <div className="flex justify-between font-body text-xs text-on-surface-variant">
            <span>Prayers</span><span className="text-on-surface font-bold">{prayersDone}/5</span>
          </div>
          <div className="flex justify-between font-body text-xs text-on-surface-variant">
            <span>Focus time</span><span className="text-on-surface font-bold">{(dayRecord?.focusHours ?? 0).toFixed(1)}h</span>
          </div>
          <div className="flex justify-between font-body text-xs text-on-surface-variant">
            <span>Sleep</span><span className="text-on-surface font-bold">{(dayRecord?.sleepHours ?? 0).toFixed(1)}h</span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-tertiary/5 border border-tertiary/20 rounded-md p-4 space-y-1.5">
          <span className="font-label text-[10px] uppercase tracking-widest text-tertiary">⚠ Warnings</span>
          <ul className="space-y-1 mt-1">
            {warnings.map(w => (
              <li key={w} className="font-body text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px] text-tertiary">priority_high</span>{w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Activity Log — collapsed by default */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md overflow-hidden">
        <button
          onClick={() => setLogExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="font-label text-xs font-bold text-on-surface">View Activity Log</span>
          <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${logExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>
        {logExpanded && (
          <div className="border-t border-outline-variant/10 animate-fade-in">
            <ActivityLog entries={logEntries} />
          </div>
        )}
      </div>
    </div>
  );
}
