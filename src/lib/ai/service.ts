/**
 * AI service layer — the only place feature logic meets the model.
 * Each function: privacy-minimizes the validated input, builds a prompt,
 * then returns a schema-validated result.
 */
import { generateStructured } from './geminiClient';
import {
  buildSafeDailyPlanner, buildSafeGoalBreaker, buildSafeWeeklyReview,
  buildSafeRecoveryInsight, buildSafeEveningReview,
} from './privacy';
import {
  buildDailyPlannerPrompt, buildGoalBreakerPrompt, buildWeeklyReviewPrompt,
  buildRecoveryInsightPrompt, buildEveningReviewPrompt,
} from './prompts';
import {
  DailyPlannerOutputSchema, GoalBreakerOutputSchema, WeeklyReviewOutputSchema,
  RecoveryInsightOutputSchema, EveningReviewOutputSchema,
  type DailyPlannerInput, type GoalBreakerInput, type WeeklyReviewInput,
  type RecoveryInsightInput, type EveningReviewInput,
} from './schemas';

export async function generateDailyPlan(input: DailyPlannerInput) {
  const safe = buildSafeDailyPlanner(input); // ← privacy filtering
  return generateStructured({
    prompt: buildDailyPlannerPrompt(safe),
    schema: DailyPlannerOutputSchema,
    temperature: 0.3,
  });
}

export async function breakGoalIntoPlan(input: GoalBreakerInput) {
  const safe = buildSafeGoalBreaker(input); // ← privacy filtering
  return generateStructured({
    prompt: buildGoalBreakerPrompt(safe),
    schema: GoalBreakerOutputSchema,
    temperature: 0.35,
  });
}

export async function generateWeeklyReview(input: WeeklyReviewInput) {
  const safe = buildSafeWeeklyReview(input); // ← privacy filtering
  return generateStructured({
    prompt: buildWeeklyReviewPrompt(safe),
    schema: WeeklyReviewOutputSchema,
    temperature: 0.3,
  });
}

export async function generateRecoveryInsight(input: RecoveryInsightInput) {
  const safe = buildSafeRecoveryInsight(input); // ← privacy filtering (de-identified)
  return generateStructured({
    prompt: buildRecoveryInsightPrompt(safe),
    schema: RecoveryInsightOutputSchema,
    temperature: 0.4,
  });
}

export async function generateEveningReflection(input: EveningReviewInput) {
  const safe = buildSafeEveningReview(input); // ← privacy filtering
  return generateStructured({
    prompt: buildEveningReviewPrompt(safe),
    schema: EveningReviewOutputSchema,
    temperature: 0.4,
  });
}
