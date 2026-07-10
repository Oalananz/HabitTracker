'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DayRecord } from '@/lib/services/dayRecordService';
import { PRAYERS, PRAYER_SUGGESTIONS, prayerTaskCategory, type PrayerKey } from '@/lib/prayerSchedule';

interface WorshipCardProps {
  dayRecord: DayRecord;
  date: string;
}

/** Status of a single prayer based on current time and prayer time */
type PrayerStatus = 'completed' | 'upcoming' | 'available' | 'missed';

function getPrayerStatus(checked: boolean, prayerTime: string | null | undefined, now = new Date()): PrayerStatus {
  if (checked) return 'completed';
  if (!prayerTime) return 'available';
  const [h, m] = prayerTime.split(':').map(Number);
  const prayerMin = (h || 0) * 60 + (m || 0);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (prayerMin > nowMin + 30) return 'upcoming';
  if (prayerMin < nowMin - 60) return 'missed';
  return 'available';
}

const statusStyles: Record<PrayerStatus, { row: string; checkbox: string; label: string; badge?: string }> = {
  completed: {
    row: 'border-primary/30 bg-primary/5',
    checkbox: 'border-primary bg-primary text-on-primary',
    label: 'text-primary',
  },
  upcoming: {
    row: 'border-outline-variant/15 bg-surface-container-lowest',
    checkbox: 'border-outline-variant/40 bg-transparent',
    label: 'text-on-surface-variant',
    badge: 'bg-surface-container-highest text-on-surface-variant/60',
  },
  available: {
    row: 'border-outline-variant/15 bg-surface-container-lowest hover:border-primary/20 hover:text-on-surface',
    checkbox: 'border-outline-variant/40 bg-transparent',
    label: 'text-on-surface',
  },
  missed: {
    row: 'border-error/20 bg-error/5',
    checkbox: 'border-error/40 bg-transparent',
    label: 'text-error/80',
    badge: 'bg-error/10 text-error',
  },
};

function PrayerRow({
  label, checked, onChange, disabled, prayerTime,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  disabled?: boolean;
  prayerTime?: string | null;
}) {
  const status = getPrayerStatus(checked, prayerTime);
  const s = statusStyles[status];

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all duration-150 text-left w-full min-h-[44px] ${s.row} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center flex-shrink-0 transition-all ${s.checkbox}`}>
        {checked && (
          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check
          </span>
        )}
      </span>
      <span className={`font-label text-xs font-bold flex-1 ${s.label}`}>{label}</span>
      {prayerTime && (
        <span className="font-mono text-[10px] text-on-surface-variant/60">{prayerTime}</span>
      )}
      {status === 'upcoming' && s.badge && (
        <span className={`font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] ${s.badge}`}>
          Upcoming
        </span>
      )}
      {status === 'missed' && s.badge && (
        <span className={`font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] ${s.badge}`}>
          Missed
        </span>
      )}
    </button>
  );
}

export default function WorshipCard({ dayRecord, date }: WorshipCardProps) {
  const { updateDayRecord, addActivityLog, userStats, tasks, createTask, completeTask, uncompleteTask, prayerTimes } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [openBlock, setOpenBlock] = useState<PrayerKey | null>(null);
  const [customPlan, setCustomPlan] = useState('');
  const [showSunnah, setShowSunnah] = useState(false);
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);

  const update = async (fields: Partial<DayRecord>, message: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDayRecord(date, fields);
      addActivityLog('WORSHIP', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrayer = (key: PrayerKey, label: string, checked: boolean) =>
    update({ [key]: checked } as Partial<DayRecord>, `${label} ${checked ? 'marked complete' : 'unmarked'}`);

  const allPrayersDone = PRAYERS.every(p => dayRecord[p.key]);
  const prayersDone = PRAYERS.filter(p => dayRecord[p.key]).length;

  const handleMarkAll = () => {
    if (confirmMarkAll) {
      const val = !allPrayersDone;
      void update(
        { fajr: val, dhuhr: val, asr: val, maghrib: val, isha: val },
        val ? 'All 5 prayers marked complete ✓' : 'All prayers unmarked',
      );
      setConfirmMarkAll(false);
    } else {
      setConfirmMarkAll(true);
    }
  };

  const worshipExtras: { field: keyof DayRecord; label: string }[] = [
    { field: 'quran', label: 'Quran' },
    { field: 'dhikrMorning', label: 'Morning Dhikr' },
    { field: 'dhikrEvening', label: 'Evening Dhikr' },
    { field: 'nightPrayer', label: 'Night Prayer' },
    { field: 'sunnahPrayer', label: '12 Sunnah Rakahs' },
  ];

  const plansFor = (key: PrayerKey) =>
    tasks.filter(t => t.category === prayerTaskCategory(key));

  const addPlan = async (key: PrayerKey, label: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask({
      title: trimmed,
      category: prayerTaskCategory(key),
      priority: 'nominal',
      date,
    });
    addActivityLog('WORSHIP', `Plan '${trimmed}' added after ${label}.`);
    setCustomPlan('');
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Worship
        </h3>
        <div className="flex items-center gap-2">
          {allPrayersDone && (
            <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider animate-fade-in">
              ✓ All prayers done
            </span>
          )}
          {!allPrayersDone && (
            <span className="font-mono text-[10px] text-on-surface-variant">
              <span className="text-primary font-bold">{prayersDone}</span>/5
            </span>
          )}
        </div>
      </div>

      {/* Prayers with per-block plans */}
      <div className="space-y-1.5">
        {PRAYERS.map(({ key, label }) => {
          const plans = plansFor(key);
          const isOpen = openBlock === key;
          const prayerTime = prayerTimes?.[key] ?? null;
          return (
            <div key={key} className="space-y-1">
              <PrayerRow
                label={label}
                checked={Boolean(dayRecord[key])}
                onChange={checked => handlePrayer(key, label, checked)}
                disabled={isUpdating}
                prayerTime={prayerTime}
              />

              {/* Plans under prayer */}
              <div className="pl-7">
                {plans.length > 0 && (
                  <div className="space-y-1">
                    {plans.map(t => (
                      <button
                        key={t.id}
                        onClick={() => (t.completed ? uncompleteTask(t.id) : completeTask(t.id))}
                        className="flex items-center gap-2 text-left w-full py-0.5"
                      >
                        <span className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center flex-shrink-0 ${t.completed ? 'border-primary bg-primary' : 'border-outline-variant/40'}`}>
                          {t.completed && (
                            <span className="material-symbols-outlined text-[10px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          )}
                        </span>
                        <span className={`font-body text-xs ${t.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setOpenBlock(isOpen ? null : key)}
                  className="font-body text-[11px] text-outline hover:text-primary transition-colors mt-0.5"
                >
                  {plans.length === 0 ? (
                    <><span className="underline">Add plan</span></>
                  ) : (
                    '+ add another'
                  )}
                </button>
              </div>

              {isOpen && (
                <div className="pl-7 flex flex-wrap gap-2 items-center animate-fade-in">
                  {PRAYER_SUGGESTIONS[key]
                    .filter(s => !plans.some(p => p.title === s))
                    .map(s => (
                      <button
                        key={s}
                        onClick={() => addPlan(key, label, s)}
                        className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-[10px] text-on-surface-variant hover:text-primary transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                  <input
                    type="text"
                    value={customPlan}
                    onChange={e => setCustomPlan(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        addPlan(key, label, customPlan);
                        setOpenBlock(null);
                      }
                    }}
                    placeholder="Custom plan…"
                    aria-label={`Custom plan after ${label}`}
                    className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1 text-[11px] font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 w-32"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mark all — secondary action with confirmation */}
      <div className="space-y-2">
        {confirmMarkAll ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="font-body text-xs text-on-surface-variant flex-1">
              Mark all 5 prayers as {allPrayersDone ? 'incomplete' : 'complete'}?
            </span>
            <button
              onClick={handleMarkAll}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-primary text-on-primary font-label text-xs rounded-sm hover:opacity-90 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmMarkAll(false)}
              className="px-3 py-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmMarkAll(true)}
            disabled={isUpdating}
            className={`w-full px-3 py-2 border rounded-sm font-label text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
              allPrayersDone
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30 hover:text-primary'
            }`}
          >
            {allPrayersDone ? '✓ All prayers marked done' : 'Mark all prayers done'}
          </button>
        )}
      </div>

      {/* Optional / Sunnah prayers — secondary accordion */}
      <div>
        <button
          onClick={() => setShowSunnah(v => !v)}
          aria-expanded={showSunnah}
          aria-controls="sunnah-section"
          className="flex items-center gap-2 w-full text-left group"
        >
          <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${showSunnah ? 'rotate-180' : ''}`}>
            expand_more
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">
            Optional / Sunnah
          </span>
          {(() => {
            const done = worshipExtras.filter(e => dayRecord[e.field]).length;
            return done > 0 ? (
              <span className="font-mono text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-[2px]">
                {done}/{worshipExtras.length}
              </span>
            ) : null;
          })()}
        </button>

        {showSunnah && (
          <div id="sunnah-section" className="mt-2 space-y-1.5 animate-fade-in">
            {worshipExtras.map(({ field, label }) => (
              <button
                key={field}
                onClick={() => !isUpdating && update(
                  { [field]: !dayRecord[field] } as Partial<DayRecord>,
                  `${label} ${!dayRecord[field] ? 'completed ✓' : 'unchecked'}`
                )}
                disabled={isUpdating}
                aria-pressed={Boolean(dayRecord[field])}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all duration-150 text-left w-full min-h-[40px] ${
                  dayRecord[field]
                    ? 'border-primary/30 bg-primary/5 text-primary'
                    : 'border-outline-variant/15 bg-surface-container-lowest text-on-surface-variant hover:border-primary/20 hover:text-on-surface'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center flex-shrink-0 transition-all ${
                  dayRecord[field] ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40 bg-transparent'
                }`}>
                  {dayRecord[field] && (
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  )}
                </span>
                <span className="font-label text-xs font-bold flex-1">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prayer streak footer */}
      <div className="font-mono text-[10px] text-on-surface-variant border-t border-outline-variant/10 pt-2">
        🕌 Prayer streak: <span className="text-primary font-bold">{userStats?.prayerStreak ?? 0} days</span>
      </div>
    </div>
  );
}
