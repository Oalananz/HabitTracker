'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import { useStore } from '@/store/useStore';
import { getNextPrayer } from '@/lib/prayerSchedule';
import type { DayRecord } from '@/lib/services/dayRecordService';

interface NextActionCardProps {
  dayRecord: DayRecord | null;
  date: string;
}

/**
 * Surfaces the single most relevant action for right now.
 * Priority order:
 *   1. Next prayer (if not yet done and within 60 min, or the first undone prayer)
 *   2. Highest-priority incomplete manual task
 *   3. Suggest planning when day is empty
 */
export default function NextActionCard({ dayRecord, date }: NextActionCardProps) {
  const { tasks, prayerTimes, updateDayRecord, addActivityLog } = useStore();

  const nextPrayer = dayRecord ? getNextPrayer(prayerTimes, dayRecord) : null;

  // Manual (non-habit) pending tasks, sorted by priority
  const priorityOrder = ['critical', 'nominal', 'low'];
  const pendingManualTasks = tasks
    .filter(t => t.sourceType !== 'habit' && !t.completed)
    .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

  const topTask = pendingManualTasks[0] ?? null;
  const noContent = !nextPrayer && !topTask;

  const markPrayerDone = async () => {
    if (!nextPrayer || nextPrayer.done || !dayRecord) return;
    await updateDayRecord(date, { [nextPrayer.key]: true } as Partial<DayRecord>);
    addActivityLog('WORSHIP', `${nextPrayer.label} marked complete`);
  };

  // Minutes until prayer
  const minutesUntilPrayer = (() => {
    if (!nextPrayer?.time || nextPrayer.done) return null;
    const [h, m] = nextPrayer.time.split(':').map(Number);
    const prayerMin = (h || 0) * 60 + (m || 0);
    const nowMin = dayjs().hour() * 60 + dayjs().minute();
    const diff = prayerMin - nowMin;
    return diff > 0 && diff <= 120 ? diff : null;
  })();

  const priorityBadge = (priority: string) => {
    if (priority === 'critical') return { label: 'Critical', cls: 'text-error bg-error/10 border-error/30' };
    if (priority === 'nominal') return { label: 'Nominal', cls: 'text-tertiary bg-tertiary/10 border-tertiary/30' };
    return { label: 'Low', cls: 'text-on-surface-variant bg-surface-container border-outline-variant/20' };
  };

  return (
    <div
      className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4"
      aria-label="Next Action"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
        <h2 className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
          Next Action
        </h2>
      </div>

      {noContent ? (
        /* Empty state: day is clear or loading */
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-headline text-sm font-bold text-on-surface">Your day looks clear</p>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">Add priorities or generate a daily plan to get started.</p>
          </div>
          <Link
            href="/ai-coach"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-xs text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Plan Day
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Prayer action */}
          {nextPrayer && !nextPrayer.done && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0">mosque</span>
                <div className="min-w-0">
                  <p className="font-headline text-sm font-bold text-on-surface">
                    {nextPrayer.label}
                    {nextPrayer.time && (
                      <span className="font-mono text-xs text-on-surface-variant font-normal ml-2">
                        {nextPrayer.time}
                      </span>
                    )}
                  </p>
                  {minutesUntilPrayer !== null ? (
                    <p className="font-body text-xs text-tertiary">
                      In {minutesUntilPrayer} min
                    </p>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant">Prayer time</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={markPrayerDone}
                  className="px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-xs text-primary transition-all"
                >
                  Mark Done
                </button>
                <Link
                  href="/today#worship"
                  className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all"
                >
                  Details
                </Link>
              </div>
            </div>
          )}

          {/* Top task action */}
          {topTask && (
            <div
              className={`flex items-center justify-between gap-3 ${nextPrayer && !nextPrayer.done ? 'border-t border-outline-variant/10 pt-3' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0">task_alt</span>
                <div className="min-w-0">
                  <p className="font-headline text-sm font-bold text-on-surface truncate">{topTask.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(() => {
                      const badge = priorityBadge(topTask.priority);
                      return (
                        <span className={`font-label text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                    {topTask.category && (
                      <span className="font-mono text-[10px] text-on-surface-variant/60">{topTask.category}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  {pendingManualTasks.length - 1 > 0 ? `+${pendingManualTasks.length - 1} more` : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
