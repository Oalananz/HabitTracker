/**
 * Builds the privacy-minimal daily-planner request payload from store data.
 * Shared by the AI Daily Plan card and the Top 3 Priorities "AI Suggest"
 * button so both send an identical, whitelisted shape.
 *
 * PRIVACY: only generic titles, life-area LABELS, statuses, priorities, due
 * dates and numeric stats — never descriptions, notes, ids, or auth data.
 */
import { LIFE_AREA_LABELS } from './schemas';
import { lifeAreaIdToLabel } from '@/lib/lifeAreas';

interface TaskLike { title: string; lifeArea?: string | null; priority: string; completed: boolean; sourceType?: string }
interface HabitLike { title: string; lifeArea?: string | null; isActive: boolean }
interface GoalLike {
  title: string; lifeArea?: string | null; isActive?: boolean; completed?: boolean;
  targetCount: number; currentCount: number; targetDate?: string | null;
}
interface PrayerLike { fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string }

export function buildDailyPlannerInput(
  date: string,
  tasks: TaskLike[],
  habits: HabitLike[],
  goals: GoalLike[],
  prayerTimes: PrayerLike | null | undefined,
) {
  const activeGoals = goals.filter((g) => g.isActive !== false && !g.completed);
  const activeHabits = habits.filter((h) => h.isActive);
  const completedTasks = tasks.filter((t) => t.completed).length;
  const habitTasks = tasks.filter((t) => t.sourceType === 'habit');
  const habitRate = habitTasks.length
    ? Math.round((habitTasks.filter((t) => t.completed).length / habitTasks.length) * 100)
    : 0;

  const pt = prayerTimes
    ? { fajr: prayerTimes.fajr, dhuhr: prayerTimes.dhuhr, asr: prayerTimes.asr, maghrib: prayerTimes.maghrib, isha: prayerTimes.isha }
    : undefined;

  return {
    date,
    lifeAreas: [...LIFE_AREA_LABELS],
    dayStats: {
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks: 0,
      activeGoals: activeGoals.length,
      activeHabits: activeHabits.length,
      habitCompletionRate: habitRate,
    },
    tasks: tasks.map((t) => ({
      title: t.title,
      lifeArea: lifeAreaIdToLabel(t.lifeArea) || undefined,
      priority: t.priority,
      status: t.completed ? 'completed' : 'pending',
    })),
    habits: activeHabits.map((h) => ({
      title: h.title,
      lifeArea: lifeAreaIdToLabel(h.lifeArea) || undefined,
      status: 'pending',
    })),
    goals: activeGoals.map((g) => ({
      title: g.title,
      lifeArea: lifeAreaIdToLabel(g.lifeArea) || undefined,
      progress: g.targetCount > 0 ? Math.round((g.currentCount / g.targetCount) * 100) : 0,
      dueDate: g.targetDate || undefined,
    })),
    prayerTimes: pt,
    preferences: { usePrayerBlocks: Boolean(pt), maxTopPriorities: 3, planningStyle: 'balanced' },
  };
}
