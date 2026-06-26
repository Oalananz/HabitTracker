'use client';

interface StreakMatrixProps {
  userStats: {
    focusStreak: number;
    prayerStreak: number;
    noReelsStreak: number;
    fullDisciplineStreak: number;
    bestFocusStreak: number;
    bestPrayerStreak: number;
    bestNoReelsStreak: number;
    bestFullDisciplineStreak: number;
  } | null;
}

interface StreakEntry {
  label: string;
  icon: string;
  current: number;
  best: number;
}

export default function StreakMatrix({ userStats }: StreakMatrixProps) {
  const rows: StreakEntry[] = [
    { label: 'FOCUS',      icon: 'psychology',      current: userStats?.focusStreak ?? 0,           best: userStats?.bestFocusStreak ?? 0 },
    { label: 'PRAYER',     icon: 'mosque',           current: userStats?.prayerStreak ?? 0,          best: userStats?.bestPrayerStreak ?? 0 },
    { label: 'NO_REELS',   icon: 'tv_off',           current: userStats?.noReelsStreak ?? 0,         best: userStats?.bestNoReelsStreak ?? 0 },
    { label: 'DISCIPLINE', icon: 'shield',           current: userStats?.fullDisciplineStreak ?? 0,  best: userStats?.bestFullDisciplineStreak ?? 0 },
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-5">
      <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
        &gt; STREAK_MATRIX
      </div>
      <div className="space-y-3">
        {rows.map(row => {
          const progress = row.best > 0 ? (row.current / row.best) * 100 : row.current > 0 ? 100 : 0;
          return (
            <div key={row.label} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant">{row.icon}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-on-surface-variant">{row.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-outline">BEST: {row.best}d</span>
                  <span className="font-headline text-base font-black text-primary leading-none">{row.current}d</span>
                </div>
              </div>
              <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
