'use client';

import type { DayRecord } from '@/lib/services/dayRecordService';

interface ScoreDisplayProps {
  dayRecord: DayRecord | null;
  userStats?: {
    focusStreak: number;
    prayerStreak: number;
    noReelsStreak: number;
    fullDisciplineStreak: number;
  } | null;
}

interface ScoreRow {
  label: string;
  met: boolean;
  points: number;
  max: number;
}

function buildRows(r: DayRecord): ScoreRow[] {
  const focusMet = r.focusHours >= r.focusGoal;
  const allPrayers = r.fajr && r.dhuhr && r.asr && r.maghrib && r.isha;
  const quranDhikr = r.quran && (r.dhikrMorning || r.dhikrEvening);
  const nightSunnah = r.nightPrayer && r.sunnahPrayer;
  const discipline = r.noReels && r.noMasturbation && r.noMusic;
  const sleepMet = r.sleepHours >= r.sleepGoal;
  return [
    { label: 'Focus',                points: focusMet ? 2 : 0,      met: focusMet,        max: 2 },
    { label: 'Prayers',              points: allPrayers ? 2 : 0,    met: !!allPrayers,    max: 2 },
    { label: 'Quran / Dhikr',        points: quranDhikr ? 1 : 0,    met: !!quranDhikr,    max: 1 },
    { label: 'Night Prayer / Sunnah',points: nightSunnah ? 1 : 0,   met: !!nightSunnah,   max: 1 },
    { label: 'Self-Control',         points: discipline ? 2 : 0,    met: !!discipline,    max: 2 },
    { label: 'Sleep',                points: sleepMet ? 1 : 0,      met: sleepMet,        max: 1 },
    { label: 'Tasks',                points: r.tasksDone ? 1 : 0,   met: r.tasksDone,     max: 1 },
  ];
}

export default function ScoreDisplay({ dayRecord, userStats }: ScoreDisplayProps) {
  const score = dayRecord?.dailyScore ?? 0;
  const rows = dayRecord ? buildRows(dayRecord) : [];

  const scoreColor = score >= 8 ? 'text-primary' : score >= 4 ? 'text-tertiary' : 'text-on-surface-variant';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

      <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
        &gt; Daily Score
      </div>

      {/* Big score */}
      <div className={`font-headline text-6xl font-black tracking-tighter ${scoreColor} flex items-end gap-2 mb-1`}>
        {score}
        <span className="text-2xl text-on-surface-variant/40 font-normal mb-1">/ 10</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 8 ? 'bg-primary' : score >= 4 ? 'bg-tertiary' : 'bg-error/60'
          }`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>

      {/* Breakdown */}
      {rows.length > 0 && (
        <div className="space-y-1.5 border-t border-outline-variant/10 pt-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="font-body text-[11px] text-on-surface-variant">
                {row.label}
              </span>
              <span className={`font-mono text-[10px] font-bold ${row.met ? 'text-primary' : 'text-outline'}`}>
                {row.met ? `[✓ +${row.max}]` : `[✗ +0]`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Streaks */}
      {userStats && (
        <div className="mt-4 pt-3 border-t border-outline-variant/10 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-body text-[11px] text-on-surface-variant">🔥 Focus streak</span>
            <span className="font-mono text-[10px] text-primary font-bold">{userStats.focusStreak}d</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-body text-[11px] text-on-surface-variant">🕌 Prayer streak</span>
            <span className="font-mono text-[10px] text-primary font-bold">{userStats.prayerStreak}d</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-body text-[11px] text-on-surface-variant">🚫 No reels</span>
            <span className="font-mono text-[10px] text-primary font-bold">{userStats.noReelsStreak}d</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-body text-[11px] text-on-surface-variant">💪 Self-control</span>
            <span className="font-mono text-[10px] text-primary font-bold">{userStats.fullDisciplineStreak}d</span>
          </div>
        </div>
      )}
    </div>
  );
}
