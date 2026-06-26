'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DayRecord, DayRecordUpdate } from '@/lib/services/dayRecordService';
import dayjs from 'dayjs';

interface DisciplineCardProps {
  dayRecord: DayRecord;
  date: string;
  journeys: { id: string; title: string; startTime: string }[];
}

// ── helpers ────────────────────────────────────────────────────────────────────

function TerminalBar({ value, max, label }: { value: number; max: number; label: string }) {
  const filled = Math.min(Math.round((value / max) * 12), 12);
  const empty = 12 - filled;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{label}</span>
        <span className="font-mono text-xs font-bold text-primary">{value.toFixed(1)}/{max.toFixed(1)}h</span>
      </div>
      <div className="font-mono text-sm text-primary tracking-[2px]">
        {'█'.repeat(filled)}<span className="text-surface-container-highest">{'░'.repeat(empty)}</span>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  streak?: number | null;
  streakBroken?: boolean;
  disabled?: boolean;
}

function ToggleRow({ label, checked, onChange, streak, streakBroken, disabled }: ToggleRowProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all duration-150 text-left w-full group ${
        checked
          ? 'border-primary/30 bg-primary/5 text-primary'
          : 'border-outline-variant/15 bg-surface-container-lowest text-on-surface-variant hover:border-primary/20 hover:text-on-surface'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40 bg-transparent'
      }`}>
        {checked && <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wider font-bold flex-1">{label}</span>
      {streak !== undefined && streak !== null && streak > 0 && (
        <span className="font-mono text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-[2px]">
          🔥 {streak}d
        </span>
      )}
      {streakBroken && !checked && (
        <span className="font-mono text-[9px] text-outline px-1.5 py-0.5">
          streak broken
        </span>
      )}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DisciplineCard({ dayRecord, date, journeys }: DisciplineCardProps) {
  const { updateDayRecord, addActivityLog, userStats } = useStore();
  const [customFocus, setCustomFocus] = useState('');
  const [showCustomFocus, setShowCustomFocus] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isToday = date === dayjs().format('YYYY-MM-DD');

  // ── Update helper ──────────────────────────────────────────────────────────

  const update = async (fields: DayRecordUpdate, logCategory: string, logMessage: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDayRecord(date, fields);
      addActivityLog(logCategory, logMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // ── FOCUS LAYER ────────────────────────────────────────────────────────────

  const handleFocusAdd = async (hours: number) => {
    const next = Math.min(dayRecord.focusHours + hours, 24);
    await update({ focusHours: next }, 'FOCUS', `+${hours}h logged (${next.toFixed(1)}/${dayRecord.focusGoal}h)`);
  };

  const handleFocusSet = async (hours: number) => {
    await update({ focusHours: hours }, 'FOCUS', `Focus set to ${hours}h`);
  };

  const handleCustomFocus = async () => {
    const val = parseFloat(customFocus);
    if (!isNaN(val) && val >= 0 && val <= 24) {
      await update({ focusHours: val }, 'FOCUS', `Focus manually set to ${val}h`);
      setCustomFocus('');
      setShowCustomFocus(false);
    }
  };

  // ── WORSHIP LAYER ──────────────────────────────────────────────────────────

  const handlePrayer = async (prayer: keyof DayRecord, prayerName: string, checked: boolean) => {
    await update({ [prayer]: checked } as DayRecordUpdate, 'WORSHIP', `${prayerName} ${checked ? 'marked complete' : 'unmarked'}`);
  };

  const handleMarkAllPrayers = async () => {
    const allDone = dayRecord.fajr && dayRecord.dhuhr && dayRecord.asr && dayRecord.maghrib && dayRecord.isha;
    const val = !allDone;
    await update(
      { fajr: val, dhuhr: val, asr: val, maghrib: val, isha: val },
      'WORSHIP',
      val ? 'All 5 prayers marked complete ✓' : 'All prayers unmarked',
    );
  };

  const handleWorship = async (field: keyof DayRecord, label: string, checked: boolean) => {
    await update({ [field]: checked } as DayRecordUpdate, 'WORSHIP', `${label} ${checked ? 'completed ✓' : 'unchecked'}`);
  };

  // ── DISCIPLINE LAYER ───────────────────────────────────────────────────────

  const handleDiscipline = async (field: keyof DayRecord, label: string, checked: boolean) => {
    await update({ [field]: checked } as DayRecordUpdate, 'DISCIPLINE', `${label} ${checked ? 'confirmed ✓' : 'unchecked'}`);
  };

  const handleCleanDay = async () => {
    const allOn = dayRecord.noReels && dayRecord.noMasturbation && dayRecord.lowSugar && dayRecord.noMusic;
    const val = !allOn;
    await update(
      { noReels: val, noMasturbation: val, lowSugar: val, noMusic: val },
      'DISCIPLINE',
      val ? 'CLEAN DAY confirmed — all discipline active ✓' : 'Clean day undone',
    );
  };

  const handleNoReels = async (checked: boolean) => {
    await update({ noReels: checked }, 'DISCIPLINE', `NO_REELS ${checked ? 'confirmed ✓' : 'unchecked'}`);
  };

  // ── SLEEP LAYER ────────────────────────────────────────────────────────────

  const handleSleep = async (delta: number) => {
    const next = Math.max(0, Math.min(dayRecord.sleepHours + delta, 24));
    await update({ sleepHours: next }, 'SLEEP', `Sleep set to ${next.toFixed(1)}h`);
  };

  const allPrayersDone = dayRecord.fajr && dayRecord.dhuhr && dayRecord.asr && dayRecord.maghrib && dayRecord.isha;

  // ── Journey name lookup ────────────────────────────────────────────────────
  const getJourneyDays = (title: string) => {
    const j = journeys.find(x => x.title.toLowerCase().includes(title.toLowerCase()));
    if (!j) return null;
    return dayjs().diff(dayjs(j.startTime), 'day');
  };

  return (
    <div className="space-y-4">
      {/* ── FOCUS LAYER ─────────────────────────────────────────── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
        <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface">
          <span className="text-primary">&gt;</span> FOCUS_LAYER
        </h3>

        <TerminalBar value={dayRecord.focusHours} max={dayRecord.focusGoal} label="HOURS_LOGGED" />

        {/* Quick add buttons */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 4].map(h => (
            <button
              key={h}
              onClick={() => handleFocusAdd(h)}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-mono text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
            >
              +{h}h
            </button>
          ))}
          <button
            onClick={() => handleFocusSet(dayRecord.focusGoal)}
            disabled={isUpdating}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-mono text-xs text-primary transition-all disabled:opacity-50"
          >
            SET {dayRecord.focusGoal}h
          </button>
          <button
            onClick={() => setShowCustomFocus(v => !v)}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-mono text-xs text-on-surface-variant hover:text-primary transition-all"
          >
            custom
          </button>
        </div>

        {showCustomFocus && (
          <div className="flex gap-2 animate-fade-in">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-1.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
              <span className="text-primary font-mono text-sm">&gt;</span>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={customFocus}
                onChange={e => setCustomFocus(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustomFocus(); }}
                className="w-20 bg-transparent font-mono text-xs text-on-surface border-none p-0 focus:ring-0"
                placeholder="hours"
                autoFocus
              />
            </div>
            <button
              onClick={handleCustomFocus}
              className="px-3 py-1.5 bg-primary text-on-primary font-mono text-xs rounded-sm hover:opacity-90"
            >
              SET
            </button>
          </div>
        )}

        {isToday && (
          <div className="font-mono text-[10px] text-on-surface-variant">
            🔥 FOCUS_STREAK: <span className="text-primary font-bold">{userStats?.focusStreak ?? 0} days</span>
          </div>
        )}
      </div>

      {/* ── WORSHIP LAYER ───────────────────────────────────────── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface">
            <span className="text-primary">&gt;</span> WORSHIP_LAYER
          </h3>
          {allPrayersDone && (
            <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider animate-fade-in">
              ✓ ALL PRAYERS DONE
            </span>
          )}
        </div>

        {/* Prayers grid */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">PRAYERS</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                { field: 'fajr' as keyof DayRecord, label: 'FAJR' },
                { field: 'dhuhr' as keyof DayRecord, label: 'DHUHR' },
                { field: 'asr' as keyof DayRecord, label: 'ASR' },
                { field: 'maghrib' as keyof DayRecord, label: 'MAGHRIB' },
                { field: 'isha' as keyof DayRecord, label: 'ISHA' },
              ] as const
            ).map(({ field, label }) => (
              <ToggleRow
                key={field}
                label={label}
                checked={Boolean(dayRecord[field])}
                onChange={checked => handlePrayer(field, label, checked)}
                disabled={isUpdating}
              />
            ))}
          </div>

          <button
            onClick={handleMarkAllPrayers}
            disabled={isUpdating}
            className={`mt-2 w-full px-3 py-2 border rounded-sm font-mono text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 ${
              allPrayersDone
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30 hover:text-primary'
            }`}
          >
            {allPrayersDone ? '✓ ALL PRAYERS MARKED DONE' : '[MARK ALL PRAYERS DONE]'}
          </button>
        </div>

        {/* Worship extras */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">WORSHIP EXTRAS</div>
          <div className="space-y-1.5">
            {(
              [
                { field: 'quran' as keyof DayRecord, label: 'QURAN (reading/memorization)' },
                { field: 'dhikrMorning' as keyof DayRecord, label: "DHIKR_MORNING (Morning's athkar)" },
                { field: 'dhikrEvening' as keyof DayRecord, label: "DHIKR_EVENING (Evening's athkar)" },
                { field: 'nightPrayer' as keyof DayRecord, label: 'NIGHT_PRAYER' },
                { field: 'sunnahPrayer' as keyof DayRecord, label: '12 SUNNAH_RAKAHS' },
              ] as const
            ).map(({ field, label }) => (
              <ToggleRow
                key={field}
                label={label}
                checked={Boolean(dayRecord[field])}
                onChange={checked => handleWorship(field, label, checked)}
                disabled={isUpdating}
              />
            ))}
          </div>
        </div>

        <div className="font-mono text-[10px] text-on-surface-variant">
          🕌 PRAYER_STREAK: <span className="text-primary font-bold">{userStats?.prayerStreak ?? 0} days</span>
        </div>
      </div>

      {/* ── DISCIPLINE LAYER ─────────────────────────────────────── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
        <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface">
          <span className="text-primary">&gt;</span> DISCIPLINE_LAYER
        </h3>

        <div className="space-y-1.5">
          <ToggleRow
            label="NO_REELS"
            checked={dayRecord.noReels}
            onChange={handleNoReels}
            disabled={isUpdating}
            streak={getJourneyDays('Reels')}
          />
          <ToggleRow
            label="NO_MASTURBATION"
            checked={dayRecord.noMasturbation}
            onChange={checked => handleDiscipline('noMasturbation', 'NO_MASTURBATION', checked)}
            disabled={isUpdating}
            streak={userStats?.noMasturbationStreak ?? null}
          />
          <ToggleRow
            label="LOW_SUGAR"
            checked={dayRecord.lowSugar}
            onChange={checked => handleDiscipline('lowSugar', 'LOW_SUGAR', checked)}
            disabled={isUpdating}
            streak={getJourneyDays('Sugar')}
          />
          <ToggleRow
            label="NO_MUSIC"
            checked={dayRecord.noMusic}
            onChange={checked => handleDiscipline('noMusic', 'NO_MUSIC', checked)}
            disabled={isUpdating}
            streak={getJourneyDays('Music')}
          />
          <ToggleRow
            label="NO_YAPPING"
            checked={dayRecord.noYapping}
            onChange={checked => handleDiscipline('noYapping', 'NO_YAPPING', checked)}
            disabled={isUpdating}
            streak={getJourneyDays('Yapping')}
          />
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleNoReels(true)}
            disabled={isUpdating || dayRecord.noReels}
            className="px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary font-mono text-[10px] uppercase rounded-sm hover:bg-primary/10 transition-all disabled:opacity-40"
          >
            ✓ NO REELS TODAY
          </button>
          <button
            onClick={handleCleanDay}
            disabled={isUpdating}
            className={`px-3 py-1.5 border font-mono text-[10px] uppercase rounded-sm transition-all ${
              dayRecord.noReels && dayRecord.noMasturbation && dayRecord.lowSugar && dayRecord.noMusic
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-primary'
            }`}
          >
            ✓ CLEAN DAY
          </button>
        </div>

        <div className="font-mono text-[10px] text-on-surface-variant">
          💪 DISCIPLINE_STREAK: <span className="text-primary font-bold">{userStats?.fullDisciplineStreak ?? 0} days</span>
        </div>
      </div>

      {/* ── SLEEP LAYER ──────────────────────────────────────────── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
        <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface">
          <span className="text-primary">&gt;</span> SLEEP_LAYER
        </h3>

        <TerminalBar value={dayRecord.sleepHours} max={dayRecord.sleepGoal} label="SLEEP_HOURS" />

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSleep(-0.5)}
            disabled={isUpdating || dayRecord.sleepHours <= 0}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-mono text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-40"
          >
            -0.5
          </button>
          <div className="font-mono text-lg font-bold text-on-surface min-w-[60px] text-center">
            {dayRecord.sleepHours.toFixed(1)}h
          </div>
          <button
            onClick={() => handleSleep(0.5)}
            disabled={isUpdating || dayRecord.sleepHours >= 24}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-mono text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-40"
          >
            +0.5
          </button>
        </div>
      </div>
    </div>
  );
}
