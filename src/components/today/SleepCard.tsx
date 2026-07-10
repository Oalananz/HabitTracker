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
  const [showEntry, setShowEntry] = useState(false);
  const [inputHours, setInputHours] = useState('');

  const logged = dayRecord.sleepHours > 0;
  const met = dayRecord.sleepHours >= dayRecord.sleepGoal;
  const pct = dayRecord.sleepGoal > 0
    ? Math.min(100, Math.round((dayRecord.sleepHours / dayRecord.sleepGoal) * 100))
    : 0;

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

  const handleSave = () => {
    const val = parseFloat(inputHours);
    if (!isNaN(val) && val >= 0 && val <= 24) {
      void setHours(val, `Sleep set to ${val}h`);
      setShowEntry(false);
      setInputHours('');
    }
  };

  const sleepDisplay = logged
    ? dayRecord.sleepHours < 1
      ? `${Math.round(dayRecord.sleepHours * 60)}m`
      : `${dayRecord.sleepHours.toFixed(1)}h`
    : null;

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Sleep
        </h3>
        {met && logged && (
          <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
            ✓ Target reached
          </span>
        )}
      </div>

      {/* Compact status */}
      {!showEntry ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {logged ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-primary">{sleepDisplay}</span>
                  <span className="font-mono text-xs text-on-surface-variant">of {dayRecord.sleepGoal}h</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-1.5 w-32">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-primary' : pct >= 70 ? 'bg-tertiary' : 'bg-primary/40'}`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Sleep progress"
                  />
                </div>
              </>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">No sleep logged</p>
            )}
          </div>
          <button
            onClick={() => { setShowEntry(true); setInputHours(logged ? String(dayRecord.sleepHours) : ''); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all min-h-[36px]"
          >
            <span className="material-symbols-outlined text-[14px]">{logged ? 'edit' : 'add'}</span>
            {logged ? 'Edit' : 'Log sleep'}
          </button>
        </div>
      ) : (
        /* Entry form */
        <div className="space-y-2 animate-fade-in">
          <label className="font-label text-xs text-on-surface-variant" htmlFor="sleep-hours-input">
            Hours slept
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-1.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
              <input
                id="sleep-hours-input"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={inputHours}
                onChange={e => setInputHours(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowEntry(false); }}
                className="w-full bg-transparent font-mono text-sm text-on-surface border-none p-0 focus:ring-0"
                placeholder="e.g. 7.5"
                autoFocus
              />
              <span className="font-mono text-xs text-on-surface-variant flex-shrink-0">hours</span>
            </div>
            {/* Quick presets */}
            {[6, 7, 8].map(h => (
              <button
                key={h}
                onClick={() => { void setHours(h, `Sleep set to ${h}h`); setShowEntry(false); }}
                disabled={isUpdating}
                className="px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
              >
                {h}h
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowEntry(false)}
              className="px-3 py-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating || !inputHours}
              className="px-4 py-1.5 bg-primary text-on-primary font-label text-xs rounded-sm hover:opacity-90 disabled:opacity-50"
            >
              {isUpdating ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
