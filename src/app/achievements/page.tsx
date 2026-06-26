'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import AchievementCard from '@/components/achievements/AchievementCard';
import AchievementToast from '@/components/achievements/AchievementToast';

const CATEGORIES = ['ALL', 'STREAK', 'SCORE', 'WORSHIP', 'FOCUS', 'DISCIPLINE', 'COMPOUND'];

type FilterMode = 'ALL' | 'UNLOCKED' | 'LOCKED';

export default function AchievementsPage() {
  const { achievements, isAchievementsLoading, fetchAchievements, userStats, fetchUserStats, markAchievementsSeen } = useStore();

  const [selectedCat, setSelectedCat] = useState('ALL');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));

  useEffect(() => {
    void fetchAchievements();
    void fetchUserStats();
    markAchievementsSeen();
  }, [fetchAchievements, fetchUserStats, markAchievementsSeen]);

  const filtered = achievements.filter(a => {
    if (selectedCat !== 'ALL' && a.cat !== selectedCat) return false;
    if (filterMode === 'UNLOCKED' && !a.unlocked) return false;
    if (filterMode === 'LOCKED' && a.unlocked) return false;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group by category
  const catGroups: Record<string, typeof achievements> = {};
  for (const a of filtered) {
    if (!catGroups[a.cat]) catGroups[a.cat] = [];
    catGroups[a.cat].push(a);
  }

  const CAT_ICONS: Record<string, string> = {
    STREAK:     'local_fire_department',
    SCORE:      'grade',
    WORSHIP:    'mosque',
    FOCUS:      'psychology',
    DISCIPLINE: 'shield',
    COMPOUND:   'military_tech',
  };

  return (
    <div className="space-y-6 animate-page-enter">
      <AchievementToast />

      {/* Header */}
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> system/achievements --unlock
        </h1>
        <p className="font-body text-on-surface-variant">
          Permanent milestones earned through consistent discipline.
        </p>
      </header>

      {/* Progress Banner */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-5">
        <div className="flex justify-between items-center mb-2">
          <div className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">&gt; UNLOCK_PROGRESS</div>
          <div className="font-headline text-2xl font-black text-primary">
            {unlockedCount}<span className="text-on-surface-variant text-lg font-normal">/{totalCount}</span>
          </div>
        </div>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 font-mono text-[10px] text-outline">
          {totalCount - unlockedCount} remaining · {progress.toFixed(1)}% complete
        </div>
      </div>

      {/* Stats bar */}
      {userStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'FOCUS_STREAK', value: `${userStats.focusStreak}d`, icon: 'psychology' },
            { label: 'PRAYER_STREAK', value: `${userStats.prayerStreak}d`, icon: 'mosque' },
            { label: 'NO_REELS', value: `${userStats.noReelsStreak}d`, icon: 'tv_off' },
            { label: 'TOTAL_SCORE', value: `${userStats.totalScore}`, icon: 'grade' },
          ].map(item => (
            <div key={item.label} className="bg-surface-container-low border border-outline-variant/15 rounded-md p-3 text-center">
              <span className="material-symbols-outlined text-primary text-[18px] block mb-1">{item.icon}</span>
              <div className="font-headline text-xl font-black text-primary">{item.value}</div>
              <div className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider border transition-all ${
                selectedCat === cat
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-surface-container-lowest border-outline-variant/15 text-on-surface-variant hover:border-primary/30'
              }`}
            >
              {cat === 'ALL' ? 'ALL' : `${CAT_ICONS[cat] ? '' : ''}${cat}`}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Locked/Unlocked filter */}
        <div className="flex gap-1">
          {(['ALL', 'UNLOCKED', 'LOCKED'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider border transition-all ${
                filterMode === mode
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-surface-container-lowest border-outline-variant/15 text-on-surface-variant hover:border-primary/30'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isAchievementsLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="animate-blink text-primary font-mono text-sm">▊</span>
          <span className="ml-2 font-mono text-sm text-on-surface-variant">Loading achievement records...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 block">lock</span>
          <p className="font-mono text-sm text-on-surface-variant">No achievements match current filter.</p>
        </div>
      ) : selectedCat !== 'ALL' ? (
        <div className="space-y-3">
          {filtered.map(({ key: achKey, ...rest }) => (
            <AchievementCard key={achKey} achievementKey={achKey} {...rest} />
          ))}
        </div>
      ) : (
        // Grouped by category with accordion
        <div className="space-y-4">
          {Object.entries(catGroups).map(([cat, items]) => {
            const unlockedInCat = items.filter(a => a.unlocked).length;
            const isExpanded = expandedCats.has(cat);
            return (
              <div key={cat} className="bg-surface-container-low border border-outline-variant/15 rounded-md overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {CAT_ICONS[cat] || 'category'}
                    </span>
                    <span className="font-headline text-sm font-bold uppercase tracking-wide text-on-surface">{cat}</span>
                    <span className={`px-2 py-0.5 rounded-[2px] font-mono text-[9px] ${
                      unlockedInCat === items.length
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {unlockedInCat}/{items.length}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${isExpanded ? '' : 'rotate-180'}`}>
                    expand_less
                  </span>
                </button>

                {/* Category body */}
                {isExpanded && (
                  <div className="p-3 pt-0 space-y-2 border-t border-outline-variant/10">
                    {items.map(({ key: achKey, ...rest }) => (
                      <AchievementCard key={achKey} achievementKey={achKey} {...rest} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
