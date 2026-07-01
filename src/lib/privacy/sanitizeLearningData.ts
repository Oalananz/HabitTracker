export interface SafeLearningAiInput {
  courseTitle: string;
  progressPercentage: number;
  targetCompletionDate: string | null;
  timeAvailablePerDay: number | null;
  skillLevel: string | null;
}

// Never send tokens, credentials, account ids, URLs, provider names, or any
// other private profile data to any AI provider — only the fields below.
export function sanitizeLearningDataForAi(input: {
  title: string;
  progressPercentage: number;
  targetCompletionDate?: string | null;
  timeAvailablePerDayMinutes?: number | null;
  skillLevel?: string | null;
}): SafeLearningAiInput {
  return {
    courseTitle: input.title,
    progressPercentage: input.progressPercentage,
    targetCompletionDate: input.targetCompletionDate ?? null,
    timeAvailablePerDay: input.timeAvailablePerDayMinutes ?? null,
    skillLevel: input.skillLevel ?? null,
  };
}
