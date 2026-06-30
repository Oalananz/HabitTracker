/**
 * System instruction + per-feature generation prompts.
 * All prompts force valid JSON only (no markdown), forbid inventing private
 * data, and ask for concise, practical, action-focused output.
 */

export const SYSTEM_INSTRUCTION = `You are an AI planning assistant inside a life organization app. You help users organize goals, habits, tasks, and weekly reviews across six life areas: Health, Money, Work / Business, Learning, Family / Social, and Personal.

Rules:
- Return ONLY valid JSON matching the required schema. No markdown, no code fences, no commentary.
- Do not invent private personal information. Only use the data provided.
- Do not ask for or reference secrets, passwords, emails, tokens, or credentials.
- Be practical, concise, and action-focused.
- Always use one of the six exact life area labels when a life area is required.`;

const LIFE_AREAS_LINE =
  'Allowed life area labels: "Health", "Money", "Work / Business", "Learning", "Family / Social", "Personal".';

export function buildDailyPlannerPrompt(safeInput: unknown): string {
  return `Create a focused plan for TODAY only using the data below.

Guidelines:
- Use prayer times as optional anchors only if provided (e.g. "After Dhuhr").
- Do not overload the user. Choose at most the requested number of top priorities (default 3).
- Keep the schedule realistic and time-boxed.
- Assign a life area to each item. ${LIFE_AREAS_LINE}
- Only reference task/habit/goal titles that appear in the input. Do not invent items.

Return JSON with EXACTLY this shape:
{
  "title": string,
  "summary": string,
  "topPriorities": [{ "title": string, "reason": string, "lifeArea": string }],
  "scheduleBlocks": [{ "label": string, "title": string, "description": string, "durationMinutes": number, "lifeArea": string, "relatedTaskTitle": string }],
  "habitFocus": [{ "title": string, "lifeArea": string, "suggestion": string }],
  "warnings": [string],
  "eveningReviewQuestions": [string]
}

DATA:
${JSON.stringify(safeInput)}`;
}

export function buildGoalBreakerPrompt(safeInput: unknown): string {
  return `Break the user's goal into an actionable plan.

Guidelines:
- Break into milestones, then small actionable tasks under each milestone.
- Match task sizes to the available time per day.
- Suggest a few supporting daily/weekly habits.
- List realistic risks with practical solutions.
- Provide exactly three concrete first actions.
- ${LIFE_AREAS_LINE}

Return JSON with EXACTLY this shape:
{
  "goalTitle": string,
  "lifeArea": string,
  "estimatedDurationWeeks": number,
  "strategy": string,
  "milestones": [{ "title": string, "description": string, "order": number, "tasks": [{ "title": string, "description": string, "estimatedMinutes": number, "priority": "low" | "medium" | "high" }] }],
  "suggestedHabits": [{ "title": string, "frequency": "daily" | "weekly", "lifeArea": string, "estimatedMinutes": number }],
  "risks": [{ "risk": string, "solution": string }],
  "firstThreeActions": [string, string, string]
}

DATA:
${JSON.stringify(safeInput)}`;
}

export function buildWeeklyReviewPrompt(safeInput: unknown): string {
  return `Analyze the user's week using ONLY the stats and reflection provided.

Guidelines:
- Do not pretend to know more than the data shows.
- If there is not enough data for a field, set it to "No enough data".
- "score" is an integer 0-10 reflecting overall week quality.
- Identify the best and weakest life areas from the lifeAreaStats.
- Give practical, specific recommendations.
- ${LIFE_AREAS_LINE}

Return JSON with EXACTLY this shape:
{
  "summary": string,
  "score": number,
  "wins": [string],
  "problems": [string],
  "patterns": [string],
  "bestLifeArea": { "lifeArea": string, "reason": string },
  "weakestLifeArea": { "lifeArea": string, "reason": string },
  "recommendations": [{ "title": string, "description": string, "lifeArea": string }],
  "nextWeekPriorities": [{ "title": string, "lifeArea": string, "reason": string }],
  "suggestedWeeklyTheme": string,
  "reviewQuestions": [string]
}

DATA:
${JSON.stringify(safeInput)}`;
}

export function buildRecoveryInsightPrompt(safeInput: unknown): string {
  return `You are a supportive recovery coach. Assess the user's relapse risk for TODAY using ONLY the de-identified pattern data below. You do NOT know what the user is recovering from — never guess or name a specific behavior, addiction, or substance.

Guidelines:
- Be compassionate, non-judgmental, and practical. Never shaming.
- Base "riskLevel" on the signals: recent slips, a slip already today, low sleep, low daily score, and few completed tasks raise risk; long clean streaks, good sleep, and an on-track day lower it.
- riskFactors / protectiveFactors must be grounded in the data provided (e.g. "Only slept below your goal", "Already 12 clean days"). Do not invent specifics.
- recommendations: 3-5 small, concrete actions for the next few hours.
- ifUrgeArises: 3-4 short, in-the-moment coping steps.
- Keep every string to one short sentence.

Return JSON with EXACTLY this shape:
{
  "riskLevel": "low" | "moderate" | "high",
  "summary": string,
  "riskFactors": [string],
  "protectiveFactors": [string],
  "recommendations": [string],
  "ifUrgeArises": [string]
}

DATA:
${JSON.stringify(safeInput)}`;
}

export function buildEveningReviewPrompt(safeInput: unknown): string {
  return `Write a short, encouraging end-of-day reflection using ONLY the data below. Build on the user's own notes if they provided any; do not contradict or invent events.

Guidelines:
- "summary": 1-2 warm, honest sentences about how the day went based on the stats.
- "wins": 2-4 specific positives drawn from the stats/notes (e.g. completed tasks, prayers, focus, sleep).
- "improvements": 1-3 gentle, specific things to do differently — no shaming.
- "tomorrowFocus": 2-3 concrete focus suggestions for tomorrow.
- "encouragement": one short motivating closing line.
- Keep each string to one sentence. Be practical and specific to the numbers given.

Return JSON with EXACTLY this shape:
{
  "summary": string,
  "wins": [string],
  "improvements": [string],
  "tomorrowFocus": [string],
  "encouragement": string
}

DATA:
${JSON.stringify(safeInput)}`;
}

/** Appended on the single retry when the first response failed validation. */
export const CORRECTION_SUFFIX = `

IMPORTANT: Your previous response was not valid JSON matching the schema. Respond again with ONLY the JSON object, no markdown, no code fences, no extra text.`;
