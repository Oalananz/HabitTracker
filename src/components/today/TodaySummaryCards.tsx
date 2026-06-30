'use client';

import { useStore } from '@/store/useStore';
import dayjs from 'dayjs';
import TodaySummaryCard from './TodaySummaryCard';
import { getNextPrayer } from '@/lib/prayerSchedule';
import type { DayRecord } from '@/lib/services/dayRecordService';

interface TodaySummaryCardsProps {
  dayRecord: DayRecord | null;
  date: string;
}

export default function TodaySummaryCards({ dayRecord, date }: TodaySummaryCardsProps) {
  const { tasks, habits, journeys, failures, updateDayRecord, addActivityLog, prayerTimes } = useStore();

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  const activeHabits = habits.filter(h => h.isActive);
  const dueHabits = activeHabits.filter(h => tasks.some(t => t.habitId === h.id && t.date === date));
  const doneHabits = dueHabits.filter(h => tasks.find(t => t.habitId === h.id && t.date === date)?.completed);

  const failedToday = (journeyId: string) =>
    failures.some(f => f.journeyId === journeyId && dayjs(f.timestamp).format('YYYY-MM-DD') === date);
  const cleanJourneys = journeys.filter(j => !failedToday(j.id)).length;
  const slipsToday = journeys.length - cleanJourneys;

  const nextPrayer = dayRecord ? getNextPrayer(prayerTimes, dayRecord) : null;

  const markPrayerDone = async () => {
    if (!nextPrayer || nextPrayer.done) return;
    await updateDayRecord(date, { [nextPrayer.key]: true } as Partial<DayRecord>);
    addActivityLog('WORSHIP', `${nextPrayer.label} marked complete`);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <TodaySummaryCard
        icon="bolt"
        label="Daily Score"
        value={`${dayRecord?.dailyScore ?? 0}/10`}
      />

      <TodaySummaryCard
        icon="mosque"
        label="Next Prayer"
        value={nextPrayer ? nextPrayer.label : '—'}
        sub={nextPrayer?.time ? nextPrayer.time : undefined}
      >
        {nextPrayer && !nextPrayer.done && (
          <button
            onClick={markPrayerDone}
            className="mt-1 self-start px-2.5 py-1 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-[10px] text-primary transition-all"
          >
            Mark Done
          </button>
        )}
      </TodaySummaryCard>

      <TodaySummaryCard
        icon="task_alt"
        label="Tasks"
        value={`${completedTasks}/${totalTasks}`}
        sub="completed today"
      />

      <TodaySummaryCard
        icon="cached"
        label="Habits"
        value={`${doneHabits.length}/${dueHabits.length}`}
        sub="due today"
      />

      <TodaySummaryCard
        icon="shield"
        label="Recovery"
        value={journeys.length === 0 ? '—' : slipsToday === 0 ? 'Clean today' : `${slipsToday} slip${slipsToday > 1 ? 's' : ''} logged`}
        sub={journeys.length > 0 ? `${journeys.length} active journey${journeys.length > 1 ? 's' : ''}` : 'no journeys yet'}
      />
    </div>
  );
}
