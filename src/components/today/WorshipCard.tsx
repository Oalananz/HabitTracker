'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DayRecord } from '@/lib/services/dayRecordService';
import { PRAYERS, PRAYER_SUGGESTIONS, prayerTaskCategory, type PrayerKey } from '@/lib/prayerSchedule';

interface WorshipCardProps {
  dayRecord: DayRecord;
  date: string;
}

function ToggleRow({
  label, checked, onChange, streak, disabled,
}: { label: string; checked: boolean; onChange: (c: boolean) => void; streak?: number | null; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all duration-150 text-left w-full ${
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
      <span className="font-label text-xs font-bold flex-1">{label}</span>
      {streak !== undefined && streak !== null && streak > 0 && (
        <span className="font-mono text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-[2px]">🔥 {streak}d</span>
      )}
    </button>
  );
}

export default function WorshipCard({ dayRecord, date }: WorshipCardProps) {
  const { updateDayRecord, addActivityLog, userStats, tasks, createTask, completeTask, uncompleteTask } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [openBlock, setOpenBlock] = useState<PrayerKey | null>(null);
  const [customPlan, setCustomPlan] = useState('');

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

  const handleMarkAll = () => {
    const val = !allPrayersDone;
    update(
      { fajr: val, dhuhr: val, asr: val, maghrib: val, isha: val },
      val ? 'All 5 prayers marked complete ✓' : 'All prayers unmarked',
    );
  };

  const worshipExtras: { field: keyof DayRecord; label: string }[] = [
    { field: 'quran', label: 'Quran' },
    { field: 'dhikrMorning', label: 'Morning Dhikr' },
    { field: 'dhikrEvening', label: 'Evening Dhikr' },
    { field: 'nightPrayer', label: 'Night Prayer' },
    { field: 'sunnahPrayer', label: '12 Sunnah Rakahs' },
  ];

  const plansFor = (key: PrayerKey) => tasks.filter(t => t.category === prayerTaskCategory(key));

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
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Worship
        </h3>
        {allPrayersDone && (
          <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px] uppercase tracking-wider animate-fade-in">
            ✓ All prayers done
          </span>
        )}
      </div>

      {/* Prayers with per-block plans */}
      <div className="space-y-2">
        {PRAYERS.map(({ key, label }) => {
          const plans = plansFor(key);
          const isOpen = openBlock === key;
          return (
            <div key={key} className="space-y-1.5">
              <ToggleRow
                label={label}
                checked={Boolean(dayRecord[key])}
                onChange={checked => handlePrayer(key, label, checked)}
                disabled={isUpdating}
              />
              <div className="pl-2">
                {plans.length === 0 ? (
                  <button
                    onClick={() => setOpenBlock(isOpen ? null : key)}
                    className="font-body text-xs text-outline hover:text-primary transition-colors"
                  >
                    No plan yet. <span className="underline">Add Plan</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    {plans.map(t => (
                      <button
                        key={t.id}
                        onClick={() => (t.completed ? uncompleteTask(t.id) : completeTask(t.id))}
                        className="flex items-center gap-2 text-left w-full"
                      >
                        <span className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center flex-shrink-0 ${t.completed ? 'border-primary bg-primary' : 'border-outline-variant/40'}`}>
                          {t.completed && <span className="material-symbols-outlined text-[10px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                        </span>
                        <span className={`font-body text-xs ${t.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{t.title}</span>
                      </button>
                    ))}
                    <button onClick={() => setOpenBlock(isOpen ? null : key)} className="font-body text-[11px] text-outline hover:text-primary transition-colors">
                      + add another
                    </button>
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="pl-2 flex flex-wrap gap-2 items-center animate-fade-in">
                  {PRAYER_SUGGESTIONS[key].filter(s => !plans.some(p => p.title === s)).map(s => (
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
                    onKeyDown={e => { if (e.key === 'Enter') { addPlan(key, label, customPlan); setOpenBlock(null); } }}
                    placeholder="Custom plan…"
                    className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1 text-[11px] font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 w-32"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleMarkAll}
        disabled={isUpdating}
        className={`w-full px-3 py-2 border rounded-sm font-label text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
          allPrayersDone
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30 hover:text-primary'
        }`}
      >
        {allPrayersDone ? '✓ All prayers marked done' : 'Mark all prayers done'}
      </button>

      {/* Worship extras */}
      <div>
        <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Quran &amp; Dhikr</div>
        <div className="space-y-1.5">
          {worshipExtras.map(({ field, label }) => (
            <ToggleRow
              key={field}
              label={label}
              checked={Boolean(dayRecord[field])}
              onChange={checked => update({ [field]: checked } as Partial<DayRecord>, `${label} ${checked ? 'completed ✓' : 'unchecked'}`)}
              disabled={isUpdating}
            />
          ))}
        </div>
      </div>

      <div className="font-mono text-[10px] text-on-surface-variant">
        🕌 Prayer streak: <span className="text-primary font-bold">{userStats?.prayerStreak ?? 0} days</span>
      </div>
    </div>
  );
}
