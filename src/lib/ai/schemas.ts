/**
 * Zod schemas for AI feature inputs and outputs.
 * Every incoming API request body is validated against an *Input schema,
 * and every Gemini response is validated against an *Output schema before
 * it is returned to the frontend.
 */
import { z } from 'zod';

// Display labels used in AI I/O (the model speaks in labels, not internal ids).
export const LIFE_AREA_LABELS = [
  'Health',
  'Money',
  'Work / Business',
  'Learning',
  'Family / Social',
  'Personal',
] as const;

// Output life areas are kept as a permissive string (the model may phrase an
// area slightly differently); structure matters more than exact spelling.
const lifeAreaOut = z.string().min(1).max(40);

// ─── Daily Planner ──────────────────────────────────────────────────
export const DailyPlannerInputSchema = z.object({
  date: z.string().min(1),
  lifeAreas: z.array(z.string()).default([]),
  dayStats: z.object({
    totalTasks: z.number().int().nonnegative().default(0),
    completedTasks: z.number().int().nonnegative().default(0),
    overdueTasks: z.number().int().nonnegative().default(0),
    activeGoals: z.number().int().nonnegative().default(0),
    activeHabits: z.number().int().nonnegative().default(0),
    habitCompletionRate: z.number().min(0).max(100).default(0),
  }),
  tasks: z.array(z.object({
    title: z.string().max(160),
    lifeArea: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.string().optional(),
  })).default([]),
  habits: z.array(z.object({
    title: z.string().max(160),
    lifeArea: z.string().optional(),
    status: z.string().optional(),
    streak: z.number().int().nonnegative().optional(),
  })).default([]),
  goals: z.array(z.object({
    title: z.string().max(160),
    lifeArea: z.string().optional(),
    progress: z.number().min(0).max(100).optional(),
    dueDate: z.string().optional(),
  })).default([]),
  prayerTimes: z.object({
    fajr: z.string(), dhuhr: z.string(), asr: z.string(), maghrib: z.string(), isha: z.string(),
  }).partial().optional(),
  preferences: z.object({
    usePrayerBlocks: z.boolean().default(true),
    maxTopPriorities: z.number().int().min(1).max(5).default(3),
    planningStyle: z.string().default('balanced'),
  }).default({ usePrayerBlocks: true, maxTopPriorities: 3, planningStyle: 'balanced' }),
});
export type DailyPlannerInput = z.infer<typeof DailyPlannerInputSchema>;

export const DailyPlannerOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  topPriorities: z.array(z.object({
    title: z.string(),
    reason: z.string(),
    lifeArea: lifeAreaOut.optional(),
  })).default([]),
  scheduleBlocks: z.array(z.object({
    label: z.string(),
    title: z.string(),
    description: z.string(),
    durationMinutes: z.number().int().positive().max(600),
    lifeArea: lifeAreaOut.optional(),
    relatedTaskTitle: z.string().optional(),
  })).default([]),
  habitFocus: z.array(z.object({
    title: z.string(),
    lifeArea: lifeAreaOut.optional(),
    suggestion: z.string(),
  })).default([]),
  warnings: z.array(z.string()).default([]),
  eveningReviewQuestions: z.array(z.string()).default([]),
});
export type DailyPlannerOutput = z.infer<typeof DailyPlannerOutputSchema>;

// ─── Goal Breaker ───────────────────────────────────────────────────
export const GoalBreakerInputSchema = z.object({
  goalTitle: z.string().min(1).max(200),
  goalDescription: z.string().max(2000).optional().default(''),
  lifeArea: z.string().optional(),
  deadline: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  timeAvailablePerDay: z.number().int().positive().max(600).default(30),
});
export type GoalBreakerInput = z.infer<typeof GoalBreakerInputSchema>;

export const GoalBreakerOutputSchema = z.object({
  goalTitle: z.string(),
  lifeArea: lifeAreaOut.optional(),
  estimatedDurationWeeks: z.number().int().positive().max(260),
  strategy: z.string(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().int(),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string(),
      estimatedMinutes: z.number().int().positive().max(600),
      priority: z.enum(['low', 'medium', 'high']),
    })).default([]),
  })).default([]),
  suggestedHabits: z.array(z.object({
    title: z.string(),
    frequency: z.enum(['daily', 'weekly']),
    lifeArea: lifeAreaOut.optional(),
    estimatedMinutes: z.number().int().positive().max(600),
  })).default([]),
  risks: z.array(z.object({
    risk: z.string(),
    solution: z.string(),
  })).default([]),
  firstThreeActions: z.array(z.string()).default([]),
});
export type GoalBreakerOutput = z.infer<typeof GoalBreakerOutputSchema>;

// ─── Weekly Review ──────────────────────────────────────────────────
export const WeeklyReviewInputSchema = z.object({
  weekStartDate: z.string().min(1),
  weekEndDate: z.string().min(1),
  summaryStats: z.object({
    completedTasks: z.number().int().nonnegative().default(0),
    totalTasks: z.number().int().nonnegative().default(0),
    overdueTasks: z.number().int().nonnegative().default(0),
    habitCompletionRate: z.number().min(0).max(100).default(0),
    activeGoals: z.number().int().nonnegative().default(0),
    completedGoals: z.number().int().nonnegative().default(0),
  }),
  lifeAreaStats: z.array(z.object({
    lifeArea: z.string(),
    completedTasks: z.number().int().nonnegative().default(0),
    totalTasks: z.number().int().nonnegative().default(0),
    completedHabits: z.number().int().nonnegative().default(0),
    totalHabits: z.number().int().nonnegative().default(0),
    activeGoals: z.number().int().nonnegative().default(0),
    progressPercentage: z.number().min(0).max(100).default(0),
  })).default([]),
  existingReflection: z.object({
    wins: z.string().max(4000).default(''),
    problems: z.string().max(4000).default(''),
    lessons: z.string().max(4000).default(''),
    nextWeekPriorities: z.string().max(4000).default(''),
  }).default({ wins: '', problems: '', lessons: '', nextWeekPriorities: '' }),
});
export type WeeklyReviewInput = z.infer<typeof WeeklyReviewInputSchema>;

export const WeeklyReviewOutputSchema = z.object({
  summary: z.string(),
  score: z.number().min(0).max(10),
  wins: z.array(z.string()).default([]),
  problems: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  bestLifeArea: z.object({ lifeArea: lifeAreaOut, reason: z.string() }).optional(),
  weakestLifeArea: z.object({ lifeArea: lifeAreaOut, reason: z.string() }).optional(),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    lifeArea: lifeAreaOut.optional(),
  })).default([]),
  nextWeekPriorities: z.array(z.object({
    title: z.string(),
    lifeArea: lifeAreaOut.optional(),
    reason: z.string(),
  })).default([]),
  suggestedWeeklyTheme: z.string(),
  reviewQuestions: z.array(z.string()).default([]),
});
export type WeeklyReviewOutput = z.infer<typeof WeeklyReviewOutputSchema>;
