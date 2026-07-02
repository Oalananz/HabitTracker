'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import ContributionHeatmap from '@/components/dashboard/ContributionHeatmap';
import ChartWidgets from '@/components/dashboard/ChartWidgets';
import StreakMatrix from '@/components/dashboard/StreakMatrix';
import SevenDayReport from '@/components/dashboard/SevenDayReport';
import WeeklyReviewNudge from '@/components/dashboard/WeeklyReviewNudge';
import Link from 'next/link';
import dayjs from 'dayjs';
import { LIFE_AREAS } from '@/lib/lifeAreas';

export default function DashboardPage() {
  const {
    metrics, isMetricsLoading, fetchMetrics,
    journeys, fetchJourneys,
    goalsSummary, fetchGoalsSummary,
    userStats, fetchUserStats,
    achievements, fetchAchievements,
    goals, fetchGoals,
    habits, fetchHabits,
  } = useStore();

  useEffect(() => {
    fetchMetrics();
    fetchJourneys();
    fetchGoalsSummary();
    void fetchUserStats();
    void fetchAchievements();
    void fetchGoals();
    void fetchHabits();
  }, [fetchMetrics, fetchJourneys, fetchGoalsSummary, fetchUserStats, fetchAchievements, fetchGoals, fetchHabits]);

  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Optional Money/Learning cards — fetched defensively so a failure never
  // breaks the rest of the dashboard (per "do not break existing dashboard").
  const [moneyCard, setMoneyCard] = useState<{ value: number; currency: string } | null>(null);
  const [studyTimeCard, setStudyTimeCard] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/money/summary');
        if (res.ok) {
          const data = await res.json();
          setMoneyCard({ value: data.summary?.netBalance ?? 0, currency: data.summary?.currency ?? 'JOD' });
        }
      } catch { /* ignore — card simply won't render */ }
      try {
        const res = await fetch('/api/learning/summary');
        if (res.ok) {
          const data = await res.json();
          setStudyTimeCard(data.summary?.studyTimeThisWeekMinutes ?? 0);
        }
      } catch { /* ignore — card simply won't render */ }
    })();
  }, []);

  return (
    <div className="space-y-8 animate-page-enter">
        <PageHeader
          title="system/analytics --verbose"
          description="Diagnostic overview of habit adherence, goals, and recovery journeys."
        />

        <WeeklyReviewNudge />

        {isMetricsLoading || !metrics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface-container-low rounded-md p-5 border border-outline-variant/15 space-y-3">
                  <div className="h-2.5 w-24 animate-shimmer rounded-md" />
                  <div className="h-10 w-20 animate-shimmer rounded-md" />
                  <div className="h-2.5 w-32 animate-shimmer rounded-md" />
                </div>
              ))}
            </div>
            <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 h-40 animate-shimmer" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 h-64 animate-shimmer" />
              <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 h-64 animate-shimmer" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="CURRENT STREAK"
                value={metrics.currentStreak}
                unit="DAYS"
                icon="local_fire_department"
                variant="primary"
              />
              <StatCard
                label="LONGEST STREAK"
                value={metrics.longestStreak}
                unit="DAYS"
                subtitle="Historical max"
                icon="emoji_events"
              />
              <StatCard
                label="TOTAL COMPLETED"
                value={metrics.totalCompleted.toLocaleString()}
                unit="TASKS"
                subtitle="Since sys.init()"
                icon="task_alt"
              />
              <StatCard
                label="COMPLETION RATE"
                value={metrics.completionRate}
                unit="%"
                subtitle="Trailing 30 days"
                icon="donut_large"
              />
              {moneyCard && (
                <StatCard
                  label="MONEY BALANCE"
                  value={moneyCard.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  unit={moneyCard.currency}
                  subtitle="Net this month"
                  icon="account_balance_wallet"
                />
              )}
              {studyTimeCard != null && (
                <StatCard
                  label="STUDY TIME"
                  value={Math.round((studyTimeCard / 60) * 10) / 10}
                  unit="HRS"
                  subtitle="This week"
                  icon="menu_book"
                />
              )}
            </div>

            {/* Life Areas snapshot */}
            <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
                  <span className="text-primary">&gt;</span> LIFE_AREAS
                </h3>
                <Link href="/life-areas" className="font-mono text-[10px] text-primary hover:underline uppercase tracking-wider">VIEW ALL →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {LIFE_AREAS.map((area) => {
                  const g = goals.filter((x) => x.lifeArea === area.id).length;
                  const h = habits.filter((x) => x.isActive && x.lifeArea === area.id).length;
                  return (
                    <Link
                      key={area.id}
                      href={`/life-areas/${area.id}`}
                      className="rounded-sm p-3 border transition-all hover:translate-y-[-2px]"
                      style={{ borderColor: `${area.color}33` }}
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ color: area.color }}>{area.icon}</span>
                      <div className="font-headline text-xs font-bold text-on-surface mt-1 truncate">{area.shortLabel}</div>
                      <div className="font-mono text-[9px] text-on-surface-variant">{g}g · {h}h</div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Heatmap */}
            <ContributionHeatmap data={metrics.heatmapData} />

            {/* Charts + Goals + Recovery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartWidgets weeklyTrend={metrics.weeklyTrend} />

              {/* Goals Summary */}
              {goalsSummary && (
                <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
                  <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-4">
                    <span className="text-primary">&gt;</span> GOALS_STATUS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-on-surface-variant">Active Goals</span>
                      <span className="font-headline text-lg font-bold text-primary">{goalsSummary.totalActive}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-on-surface-variant">Completed</span>
                      <span className="font-headline text-lg font-bold text-secondary">{goalsSummary.totalCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-on-surface-variant">Weekly Done</span>
                      <span className="font-headline text-lg font-bold text-tertiary">{goalsSummary.weeklyCompleted}</span>
                    </div>
                    {goalsSummary.dueSoon > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-sm text-on-surface-variant">Due Soon</span>
                        <span className="font-headline text-lg font-bold text-tertiary">{goalsSummary.dueSoon}</span>
                      </div>
                    )}
                    {goalsSummary.overdue > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-sm text-on-surface-variant">Overdue</span>
                        <span className="font-headline text-lg font-bold text-error">{goalsSummary.overdue}</span>
                      </div>
                    )}
                    <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-scanline-gradient rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(goalsSummary.completionRate, 100)}%` }}
                      />
                    </div>
                    <div className="font-mono text-[10px] text-outline text-right">
                      GOAL_COMPLETION: {goalsSummary.completionRate}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recovery Journeys Overview */}
            {journeys.length > 0 && (
              <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
                <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-4">
                  <span className="text-primary">&gt;</span> RECOVERY_JOURNEYS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {journeys.map((j) => {
                    const days = now.diff(dayjs(j.startTime), 'day');
                    return (
                      <div
                        key={j.id}
                        className="p-4 rounded-md border border-outline-variant/15 bg-surface-container-lowest"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                            healing
                          </span>
                          <span className="font-headline text-sm font-bold text-on-surface truncate">{j.title}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="font-headline text-3xl font-black text-primary tracking-tighter">
                              {days}
                            </div>
                            <div className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">days clean</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs text-error">{j.failureCount} fails</div>
                            <div className="font-mono text-[10px] text-outline mt-0.5">
                              since {dayjs(j.createdAt).format('MMM D')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legacy Recovery Summary (if no journeys) */}
            {journeys.length === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
                  <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-4">
                    <span className="text-primary">&gt;</span> RECOVERY_STATUS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-on-surface-variant">Current Recovery</span>
                      <span className="font-headline text-lg font-bold text-primary">{metrics.recovery.currentDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-on-surface-variant">Total Failures</span>
                      <span className="font-headline text-lg font-bold text-error">{metrics.recovery.totalFailures}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-on-surface-variant">Weekly Rate</span>
                      <span className="font-headline text-lg font-bold text-secondary">{metrics.weeklyRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── New v2 Widgets ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StreakMatrix userStats={userStats} />
              <SevenDayReport
                days={(metrics.heatmapData || []).map(d => ({
                  date: d.date,
                  score: (d as { score?: number }).score ?? 0,
                }))}
              />
            </div>

            {/* Achievements Preview */}
            {achievements.filter(a => a.unlocked).length > 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    &gt; RECENT_ACHIEVEMENTS
                  </div>
                  <Link href="/achievements" className="font-mono text-[10px] text-primary hover:underline uppercase tracking-wider">
                    VIEW ALL →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {achievements
                    .filter(a => a.unlocked)
                    .sort((a, b) => new Date(b.unlockedAt || '').getTime() - new Date(a.unlockedAt || '').getTime())
                    .slice(0, 3)
                    .map(a => (
                      <div key={a.key} className="bg-surface-container-low border border-outline-variant/15 rounded-sm p-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        <div className="min-w-0">
                          <div className="font-headline text-xs font-bold text-on-surface truncate uppercase">{a.name}</div>
                          <div className="font-mono text-[9px] text-on-surface-variant">{a.rarity}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
