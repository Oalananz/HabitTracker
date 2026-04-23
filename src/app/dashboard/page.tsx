'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/ui/StatCard';
import ContributionHeatmap from '@/components/dashboard/ContributionHeatmap';
import ChartWidgets from '@/components/dashboard/ChartWidgets';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const {
    metrics, isMetricsLoading, fetchMetrics,
    journeys, fetchJourneys,
    goalsSummary, fetchGoalsSummary,
  } = useStore();

  useEffect(() => {
    fetchMetrics();
    fetchJourneys();
    fetchGoalsSummary();
  }, [fetchMetrics, fetchJourneys, fetchGoalsSummary]);

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            <span className="text-primary">&gt;</span> system/analytics --verbose
          </h1>
          <p className="font-body text-on-surface-variant">
            Diagnostic overview of habit adherence, goals, and recovery journeys.
          </p>
        </header>

        {isMetricsLoading || !metrics ? (
          <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
            <span className="animate-blink text-primary">▊</span> Computing analytics...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="CURRENT STREAK"
                value={metrics.currentStreak}
                unit="DAYS"
                subtitle="+3% vs prev. cycle"
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
                    const days = Math.floor(
                      (Date.now() - new Date(j.startTime).getTime()) / (1000 * 60 * 60 * 24)
                    );
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
          </div>
        )}
      </div>
  );
}
