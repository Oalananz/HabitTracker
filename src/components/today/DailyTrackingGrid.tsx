'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { DayRecord } from '@/lib/services/dayRecordService';
import WorshipCard from './WorshipCard';
import FocusTimeCard from './FocusTimeCard';
import RecoveryTodayCard from './RecoveryTodayCard';
import SleepCard from './SleepCard';
import dayjs from 'dayjs';

interface DailyTrackingGridProps {
  dayRecord: DayRecord;
  date: string;
}

type Section = 'worship' | 'focus' | 'recovery' | 'sleep' | null;

interface SummaryCardProps {
  id: string;
  icon: string;
  label: string;
  value: string;
  sub?: string;
  statusColor?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SummaryCard({
  id, icon, label, value, sub, statusColor = 'text-on-surface', isOpen, onToggle, children
}: SummaryCardProps) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-details`}
        className="w-full flex items-center justify-between px-4 py-3 text-left group hover:bg-surface-container-high/30 transition-colors min-h-[56px]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`material-symbols-outlined text-[20px] ${statusColor} flex-shrink-0`}>{icon}</span>
          <div className="min-w-0">
            <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</div>
            <div className={`font-headline text-sm font-bold ${statusColor} leading-tight`}>{value}</div>
            {sub && <div className="font-mono text-[10px] text-on-surface-variant/70 mt-0.5">{sub}</div>}
          </div>
        </div>
        <span
          className={`material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          id={`${id}-details`}
          className="border-t border-outline-variant/10 animate-fade-in"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function DailyTrackingGrid({ dayRecord, date }: DailyTrackingGridProps) {
  const [openSection, setOpenSection] = useState<Section>(null);
  const { journeys, failures, prayerTimes } = useStore();

  const toggle = (section: Section) =>
    setOpenSection(prev => (prev === section ? null : section));

  // ── Worship summary ──────────────────────────────────────────────────────
  const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  const prayersDone = prayerKeys.filter(k => dayRecord[k]).length;
  const allPrayersDone = prayersDone === 5;
  const worshipValue = `${prayersDone}/5 prayers`;
  const worshipStatusColor = allPrayersDone ? 'text-primary' : prayersDone >= 3 ? 'text-tertiary' : 'text-on-surface';

  // Next undone prayer name for sub-label
  const nextPrayerName = (() => {
    if (allPrayersDone) return 'All done ✓';
    const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const idx = prayerKeys.findIndex(k => !dayRecord[k]);
    if (idx === -1) return undefined;
    const prayerTime = prayerTimes?.[prayerKeys[idx]];
    return `Next: ${names[idx]}${prayerTime ? ` · ${prayerTime}` : ''}`;
  })();

  // ── Focus summary ────────────────────────────────────────────────────────
  const focusPct = dayRecord.focusGoal > 0
    ? Math.min(100, Math.round((dayRecord.focusHours / dayRecord.focusGoal) * 100))
    : 0;
  const focusMet = dayRecord.focusHours >= dayRecord.focusGoal;
  const focusHoursStr = dayRecord.focusHours === 0
    ? '0h logged'
    : dayRecord.focusHours < 1
    ? `${Math.round(dayRecord.focusHours * 60)}m logged`
    : `${dayRecord.focusHours.toFixed(1)}h logged`;
  const focusValue = focusHoursStr;
  const focusSub = `of ${dayRecord.focusGoal}h target · ${focusPct}%`;
  const focusStatusColor = focusMet ? 'text-primary' : focusPct >= 50 ? 'text-tertiary' : 'text-on-surface';

  // ── Recovery summary ─────────────────────────────────────────────────────
  const failedToday = (journeyId: string) =>
    failures.some(f => f.journeyId === journeyId && dayjs(f.timestamp).format('YYYY-MM-DD') === date);
  const cleanCount = journeys.filter(j => !failedToday(j.id)).length;
  const slipCount = journeys.length - cleanCount;
  const recoveryValue = journeys.length === 0
    ? 'No journeys'
    : slipCount === 0
    ? 'All clean ✓'
    : `${slipCount} slip${slipCount > 1 ? 's' : ''} today`;
  const recoverySub = journeys.length > 0 ? `${cleanCount}/${journeys.length} clean` : undefined;
  const recoveryStatusColor = journeys.length === 0
    ? 'text-on-surface-variant'
    : slipCount === 0
    ? 'text-primary'
    : 'text-error';

  // ── Sleep summary ────────────────────────────────────────────────────────
  const sleepLogged = dayRecord.sleepHours > 0;
  const sleepMet = dayRecord.sleepHours >= dayRecord.sleepGoal;
  const sleepValue = sleepLogged
    ? `${dayRecord.sleepHours.toFixed(1)}h slept`
    : 'Not logged';
  const sleepSub = sleepLogged
    ? `of ${dayRecord.sleepGoal}h goal${sleepMet ? ' · ✓ Target met' : ''}`
    : 'Tap to log sleep';
  const sleepStatusColor = !sleepLogged
    ? 'text-on-surface-variant'
    : sleepMet
    ? 'text-primary'
    : 'text-tertiary';

  // icon helpers
  const worshipIcon = allPrayersDone ? 'mosque' : 'mosque';
  const focusIcon = focusMet ? 'timer' : 'timer';
  const recoveryIcon = slipCount > 0 ? 'shield' : 'shield';
  const sleepIcon = 'bedtime';

  return (
    <div className="space-y-2" id="daily-tracking">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
          Daily Tracking
        </h2>
      </div>

      {/* 2×2 grid on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SummaryCard
          id="worship"
          icon={worshipIcon}
          label="Worship"
          value={worshipValue}
          sub={nextPrayerName}
          statusColor={worshipStatusColor}
          isOpen={openSection === 'worship'}
          onToggle={() => toggle('worship')}
        >
          <div className="p-1">
            <WorshipCard dayRecord={dayRecord} date={date} />
          </div>
        </SummaryCard>

        <SummaryCard
          id="focus"
          icon={focusIcon}
          label="Focus Time"
          value={focusValue}
          sub={focusSub}
          statusColor={focusStatusColor}
          isOpen={openSection === 'focus'}
          onToggle={() => toggle('focus')}
        >
          <div className="p-1">
            <FocusTimeCard dayRecord={dayRecord} date={date} />
          </div>
        </SummaryCard>

        <SummaryCard
          id="recovery"
          icon={recoveryIcon}
          label="Self-Control"
          value={recoveryValue}
          sub={recoverySub}
          statusColor={recoveryStatusColor}
          isOpen={openSection === 'recovery'}
          onToggle={() => toggle('recovery')}
        >
          <div className="p-1">
            <RecoveryTodayCard dayRecord={dayRecord} date={date} />
          </div>
        </SummaryCard>

        <SummaryCard
          id="sleep"
          icon={sleepIcon}
          label="Sleep"
          value={sleepValue}
          sub={sleepSub}
          statusColor={sleepStatusColor}
          isOpen={openSection === 'sleep'}
          onToggle={() => toggle('sleep')}
        >
          <div className="p-1">
            <SleepCard dayRecord={dayRecord} date={date} />
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}
