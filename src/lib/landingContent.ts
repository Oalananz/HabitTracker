import { z } from 'zod';

// Editable landing-page copy. Shared by the page (server), the admin API and the
// admin editor (client), so this module must stay free of server-only imports.
// Product truth (the scoring rules, the day replay, the live product panels) is
// deliberately not editable here.

const line = (max: number) => z.string().trim().min(1).max(max);
const text = (max: number) => z.string().trim().max(max);

const itemSchema = z.object({ title: line(60), detail: text(240) });

export const landingContentSchema = z.object({
  hero: z.object({
    eyebrow: line(40),
    titleLine1: line(60),
    titleLine2: line(40),
    subtitle: text(400),
    meta: text(120),
  }),
  cta: z.object({
    primary: line(30),
    secondary: line(20),
  }),
  score: z.object({
    visible: z.boolean(),
    eyebrow: line(40),
    title: line(80),
    intro: text(400),
    note: text(200),
  }),
  system: z.object({
    visible: z.boolean(),
    eyebrow: line(40),
    title: line(80),
    intro: text(400),
    extras: z.array(itemSchema).max(8),
  }),
  selfHost: z.object({
    visible: z.boolean(),
    eyebrow: line(40),
    title: line(80),
    intro: text(400),
    facts: z.array(itemSchema).max(8),
  }),
  closing: z.object({
    visible: z.boolean(),
    eyebrow: text(40),
    title: line(80),
    subtitle: text(240),
  }),
});

export type LandingContent = z.infer<typeof landingContentSchema>;
export type LandingItem = z.infer<typeof itemSchema>;

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    eyebrow: 'habitterminal today',
    titleLine1: 'Every day gets a score.',
    titleLine2: 'Secure yours',
    subtitle:
      'HabitTerminal scores each day out of 10: focus, the five prayers, Quran and dhikr, self-control, sleep, and the tasks you set. Log as you go and you always know where today stands.',
    meta: 'Free · Open source · Works offline · Installs like an app',
  },
  cta: {
    primary: 'Create your account',
    secondary: 'Sign in',
  },
  score: {
    visible: true,
    eyebrow: 'how scoring works',
    title: 'What a 10 is made of.',
    intro:
      'Seven parts, updated the moment you log something. Reach 8 and the day is secured. Miss a part and the breakdown shows you exactly which one.',
    note: 'Your focus and sleep goals are yours to set in Settings.',
  },
  system: {
    visible: true,
    eyebrow: 'the system',
    title: 'Built around how a day actually runs.',
    intro:
      'Prayer times anchor the plan, streaks keep you honest, and a year of scored days becomes a pattern you can read.',
    extras: [
      { title: 'Life areas', detail: 'Health, money, work, learning, family and personal. Goals and habits sorted by what they serve.' },
      { title: 'Money', detail: 'Income and expenses, budgets, savings goals, debts and subscriptions.' },
      { title: 'Learning', detail: 'Courses, study sessions, skills and certificates in one place.' },
      { title: 'Weekly review', detail: 'Wins, problems and lessons, with a look across all six areas.' },
      {
        title: 'AI planner',
        detail:
          'Optional. Drafts your day, breaks down goals and reviews your week with Google Gemini. Only what you ask it about is sent, never your email or account.',
      },
    ],
  },
  selfHost: {
    visible: true,
    eyebrow: 'self-host',
    title: 'Or run it yourself.',
    intro:
      'HabitTerminal is open source. Run your own copy as two containers, the app and a Postgres database that belongs to you, and one command starts both.',
    facts: [
      { title: 'Your data, your database', detail: 'Everything lives in a Postgres database you control.' },
      { title: 'No trackers', detail: 'No analytics or third-party tracking scripts, hosted or self-hosted.' },
      { title: 'Updates in one command', detail: 'New database migrations apply automatically on the next make up.' },
      { title: 'MIT licensed', detail: 'Read the code, change it, keep it.' },
    ],
  },
  closing: {
    visible: true,
    eyebrow: 'Fajr · 05:08',
    title: 'Tomorrow starts at Fajr.',
    subtitle: 'Create your account tonight and score your first day tomorrow.',
  },
};

type Section = keyof LandingContent;

/**
 * Stored content merged over the defaults, one section at a time: a section
 * that is missing or fails validation falls back to its default, so a bad or
 * partial document can never break the page.
 */
export function resolveLandingContent(stored: unknown): LandingContent {
  const result = structuredClone(DEFAULT_LANDING_CONTENT);
  if (!stored || typeof stored !== 'object') return result;
  const shape = landingContentSchema.shape;
  for (const key of Object.keys(shape) as Section[]) {
    const parsed = shape[key].safeParse((stored as Record<string, unknown>)[key]);
    if (parsed.success) (result as Record<Section, unknown>)[key] = parsed.data;
  }
  return result;
}
