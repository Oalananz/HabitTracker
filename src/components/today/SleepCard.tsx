'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DayRecord } from '@/lib/services/dayRecordService';

interface SleepCardProps {
  dayRecord: DayRecord;
  date: string;
}

export default function SleepCard({ dayRecord, date }: SleepCardProps) {
  const { updateDayRecord, addActivityLog } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const met = dayRecord.sleepHours >= dayRecord.sleepGoal;
  const logged = dayRecord.sleepHours > 0;
  const filled = Math.min(Math.round((dayRecord.sleepHours / dayRecord.sleepGoal) * 12), 12);
  const empty = 12 - filled;

  const setHours = async (hours: number, message: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDayRecord(date, { sleepHours: hours });
      addActivityLog('SLEEP', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelta = (delta: number) => {
    const next = Math.max(0, Math.min(dayRecord.sleepHours + delta, 24));
    void setHours(next, `Sleep set to ${next.toFixed(1)}h`);
  };

  const handleCustom = () => {
    const val = parseFloat(customHours);
    if (!isNaN(val) && val >= 0 && val <= 24) {
      void setHours(val, `Sleep set to ${val}h`);
      setCustomHours('');
      setShowCustom(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Sleep
        </h3>
        {met && (
          <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
            ✓ Target reached
          </span>
        )}
      </div>

      {!logged ? (
        <div className="flex flex-col items-center text-center gap-2 py-4">
          <span className="font-body text-sm text-on-surface-variant">No sleep logged yet.</span>
          <span className="font-body text-xs text-outline">Add your sleep hours to improve today&apos;s score.</span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-label uppercase tracking-widest text-on-surface-variant">Slept</span>
            <span className="font-mono text-xs font-bold text-primary">{dayRecord.sleepHours.toFixed(1)}h / {dayRecord.sleepGoal.toFixed(1)}h target</span>
          </div>
          <div className="font-mono text-sm text-primary tracking-[2px]">
            {'█'.repeat(filled)}<span className="text-surface-container-highest">{'░'.repeat(empty)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => handleDelta(-0.5)}
          disabled={isUpdating || dayRecord.sleepHours <= 0}
          className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-40"
        >
          -30m
        </button>
        <div className="font-mono text-lg font-bold text-on-surface min-w-[60px] text-center">
          {dayRecord.sleepHours.toFixed(1)}h
        </div>
        <button
          onClick={() => handleDelta(0.5)}
          disabled={isUpdating || dayRecord.sleepHours >= 24}
          className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-40"
        >
          +30m
        </button>
        <button
          onClick={() => setShowCustom(v => !v)}
          className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all"
        >
          Set Hours
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-1.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={customHours}
              onChange={e => setCustomHours(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCustom(); }}
              className="w-20 bg-transparent font-mono text-xs text-on-surface border-none p-0 focus:ring-0"
              placeholder="hours"
              autoFocus
            />
          </div>
          <button onClick={handleCustom} className="px-3 py-1.5 bg-primary text-on-primary font-label text-xs rounded-sm hover:opacity-90">
            Set
          </button>
        </div>
      )}
    </div>
  );
}
