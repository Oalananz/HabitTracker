'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DayRecord } from '@/lib/services/dayRecordService';
import dayjs from 'dayjs';

interface FocusTimeCardProps {
  dayRecord: DayRecord;
  date: string;
}

export default function FocusTimeCard({ dayRecord, date }: FocusTimeCardProps) {
  const { updateDayRecord, addActivityLog, userStats } = useStore();
  const [showControls, setShowControls] = useState(false);
  const [customFocus, setCustomFocus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isToday = date === dayjs().format('YYYY-MM-DD');
  const met = dayRecord.focusHours >= dayRecord.focusGoal;
  const pct = dayRecord.focusGoal > 0
    ? Math.min(100, Math.round((dayRecord.focusHours / dayRecord.focusGoal) * 100))
    : 0;

  const update = async (hours: number, message: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDayRecord(date, { focusHours: hours });
      addActivityLog('FOCUS', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdd = (h: number) => {
    const next = Math.min(dayRecord.focusHours + h, 24);
    void update(next, `+${h}h logged (${next.toFixed(1)}/${dayRecord.focusGoal}h)`);
  };

  const handleSet = (h: number) => void update(h, `Focus set to ${h}h`);

  const handleCustom = () => {
    const val = parseFloat(customFocus);
    if (!isNaN(val) && val >= 0 && val <= 24) {
      void update(val, `Focus manually set to ${val}h`);
      setCustomFocus('');
      setShowControls(false);
    }
  };

  const handleReset = () => {
    void update(0, 'Focus time reset for today');
    setShowControls(false);
  };

  // Human-readable focus time display
  const focusDisplay = dayRecord.focusHours === 0
    ? '0h'
    : dayRecord.focusHours < 1
    ? `${Math.round(dayRecord.focusHours * 60)}m`
    : `${dayRecord.focusHours.toFixed(1)}h`;

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Focus Time
        </h3>
        {met && (
          <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
            ✓ Target reached
          </span>
        )}
      </div>

      {/* Compact summary */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-primary">{focusDisplay}</span>
          <span className="font-mono text-xs text-on-surface-variant">
            of {dayRecord.focusGoal.toFixed(1)}h · {pct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-primary' : pct >= 50 ? 'bg-tertiary' : 'bg-primary/40'}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Focus progress"
          />
        </div>
      </div>

      {/* Log time button / controls toggle */}
      {!showControls ? (
        <button
          onClick={() => setShowControls(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Log focus time
        </button>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {/* Quick add buttons */}
          <div className="flex flex-wrap gap-2">
            {[0.5, 1, 2].map(h => (
              <button
                key={h}
                onClick={() => handleAdd(h)}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
              >
                +{h === 0.5 ? '30m' : `${h}h`}
              </button>
            ))}
            <button
              onClick={() => handleSet(dayRecord.focusGoal)}
              disabled={isUpdating || met}
              className="px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-xs text-primary transition-all disabled:opacity-40"
            >
              Set {dayRecord.focusGoal}h
            </button>
          </div>
          {/* Custom input */}
          <div className="flex gap-2">
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-1.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={customFocus}
                onChange={e => setCustomFocus(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustom(); }}
                className="w-full bg-transparent font-mono text-xs text-on-surface border-none p-0 focus:ring-0"
                placeholder="Custom hours"
                aria-label="Custom focus hours"
                autoFocus
              />
            </div>
            <button
              onClick={handleCustom}
              className="px-3 py-1.5 bg-primary text-on-primary font-label text-xs rounded-sm hover:opacity-90"
            >
              Set
            </button>
            <button
              onClick={handleReset}
              disabled={isUpdating || dayRecord.focusHours === 0}
              className="px-3 py-1.5 bg-surface-container-lowest border border-error/20 hover:border-error/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-error transition-all disabled:opacity-30"
              title="Reset focus time to 0"
            >
              Reset
            </button>
            <button
              onClick={() => setShowControls(false)}
              aria-label="Close focus controls"
              className="px-2 py-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {isToday && (
        <div className="font-mono text-[10px] text-on-surface-variant border-t border-outline-variant/10 pt-2">
          🔥 Focus streak: <span className="text-primary font-bold">{userStats?.focusStreak ?? 0} days</span>
        </div>
      )}
    </div>
  );
}
