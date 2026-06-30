/**
 * PRIVACY FILTERING — single choke-point for everything sent to Gemini.
 *
 * Two layers of protection:
 *   1. Zod `.parse()` in schemas.ts strips any unknown keys from the request
 *      body (zod object schemas drop unrecognized properties by default), so
 *      stray fields like `email`, `token`, `userId` never survive parsing.
 *   2. The `buildSafe*` helpers below explicitly RECONSTRUCT the payload from a
 *      whitelist of planning-relevant fields and truncate free text. This is
 *      defense-in-depth: even if a field were added to a schema later, it would
 *      not reach Gemini unless it is listed here.
 *
 * Fields intentionally NEVER forwarded: email, password, tokens, auth objects,
 * full names, user/session IDs, raw notes, descriptions of recovery journeys,
 * and private URLs.
 */
import type {
  DailyPlannerInput, GoalBreakerInput, WeeklyReviewInput,
  RecoveryInsightInput, EveningReviewInput,
} from './schemas';

const MAX_TITLE = 120;
const MAX_TEXT = 2000;
const MAX_ITEMS = 50;

function clip(s: string | undefined, max = MAX_TITLE): string {
  return (s ?? '').toString().slice(0, max).trim();
}

/** Daily planner: keep only generic titles + planning metadata. */
export function buildSafeDailyPlanner(input: DailyPlannerInput) {
  return {
    date: clip(input.date, 10),
    lifeAreas: input.lifeAreas.slice(0, 6).map((a) => clip(a, 40)),
    dayStats: input.dayStats, // already numeric aggregates only
    tasks: input.tasks.slice(0, MAX_ITEMS).map((t) => ({
      title: clip(t.title),
      lifeArea: t.lifeArea ? clip(t.lifeArea, 40) : undefined,
      priority: t.priority,
      dueDate: t.dueDate ? clip(t.dueDate, 10) : undefined,
      status: t.status,
    })),
    habits: input.habits.slice(0, MAX_ITEMS).map((h) => ({
      title: clip(h.title),
      lifeArea: h.lifeArea ? clip(h.lifeArea, 40) : undefined,
      status: h.status,
      streak: h.streak,
    })),
    goals: input.goals.slice(0, MAX_ITEMS).map((g) => ({
      title: clip(g.title),
      lifeArea: g.lifeArea ? clip(g.lifeArea, 40) : undefined,
      progress: g.progress,
      dueDate: g.dueDate ? clip(g.dueDate, 10) : undefined,
    })),
    // Prayer-time labels (HH:mm) are non-identifying and already in the app.
    prayerTimes: input.preferences.usePrayerBlocks ? input.prayerTimes : undefined,
    preferences: input.preferences,
  };
}

/** Goal breaker: only the goal text the user intentionally submitted. */
export function buildSafeGoalBreaker(input: GoalBreakerInput) {
  return {
    goalTitle: clip(input.goalTitle, 200),
    goalDescription: clip(input.goalDescription, MAX_TEXT),
    lifeArea: input.lifeArea ? clip(input.lifeArea, 40) : undefined,
    deadline: input.deadline ? clip(input.deadline, 10) : undefined,
    difficulty: input.difficulty,
    timeAvailablePerDay: input.timeAvailablePerDay,
  };
}

/** Weekly review: aggregated stats + the user's own reflection text. */
export function buildSafeWeeklyReview(input: WeeklyReviewInput) {
  return {
    weekStartDate: clip(input.weekStartDate, 10),
    weekEndDate: clip(input.weekEndDate, 10),
    summaryStats: input.summaryStats, // numeric aggregates only
    lifeAreaStats: input.lifeAreaStats.slice(0, 6).map((s) => ({
      lifeArea: clip(s.lifeArea, 40),
      completedTasks: s.completedTasks,
      totalTasks: s.totalTasks,
      completedHabits: s.completedHabits,
      totalHabits: s.totalHabits,
      activeGoals: s.activeGoals,
      progressPercentage: s.progressPercentage,
    })),
    existingReflection: {
      wins: clip(input.existingReflection.wins, MAX_TEXT),
      problems: clip(input.existingReflection.problems, MAX_TEXT),
      lessons: clip(input.existingReflection.lessons, MAX_TEXT),
      nextWeekPriorities: clip(input.existingReflection.nextWeekPriorities, MAX_TEXT),
    },
  };
}

/**
 * Recovery insight: de-identified pattern signals ONLY. We deliberately drop
 * journey titles, descriptions, and any slip-trigger note text — the model
 * never learns what the user is recovering from, only numeric patterns.
 */
export function buildSafeRecoveryInsight(input: RecoveryInsightInput) {
  return {
    date: clip(input.date, 10),
    journeys: input.journeys.slice(0, MAX_ITEMS).map((j) => ({
      cleanDays: j.cleanDays,
      totalSlips: j.totalSlips,
      slippedToday: j.slippedToday,
      slipsLast7Days: j.slipsLast7Days,
    })),
    context: input.context, // numeric wellbeing aggregates only
  };
}

/** Evening review: the day's numeric stats + the user's own reflection text. */
export function buildSafeEveningReview(input: EveningReviewInput) {
  return {
    date: clip(input.date, 10),
    dayStats: input.dayStats, // numeric aggregates only
    priorities: input.priorities.slice(0, 5).map((p) => ({
      title: clip(p.title),
      completed: p.completed,
    })),
    userReflection: {
      wins: clip(input.userReflection.wins, MAX_TEXT),
      problems: clip(input.userReflection.problems, MAX_TEXT),
      tomorrowImprovement: clip(input.userReflection.tomorrowImprovement, MAX_TEXT),
    },
  };
}
