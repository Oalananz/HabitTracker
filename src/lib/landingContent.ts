import { z } from 'zod';

// Editable landing-page copy. Shared by the page (server), the admin API and the
// admin editor (client), so this module must stay free of server-only imports.
// Product truth (the scoring rules, the dashboard demo, the product previews) is
// deliberately not editable here.

const line = (max: number) => z.string().trim().min(1).max(max);
const text = (max: number) => z.string().trim().max(max);

const itemSchema = z.object({ title: line(60), detail: text(240) });

export const landingContentSchema = z.object({
  hero: z.object({
    eyebrow: line(40),
    titleLine1: line(60),
    titleLine2: line(60),
    subtitle: text(300),
    meta: text(120),
  }),
  cta: z.object({
    primary: line(30),
    secondary: line(20),
  }),
  scoring: z.object({
    visible: z.boolean(),
    eyebrow: line(40),
    title: line(80),
    statement: text(240),
  }),
  features: z.object({
    visible: z.boolean(),
    eyebrow: line(40),
    title: line(80),
    intro: text(300),
  }),
  pillars: z.object({
    visible: z.boolean(),
    eyebrow: line(40),
    title: line(80),
    items: z.array(itemSchema).max(6),
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
    eyebrow: 'Personal daily operating system',
    titleLine1: 'Turn your day into a score.',
    titleLine2: 'Build better habits, one day at a time.',
    subtitle: 'Track focus, prayer, Quran, sleep, self-control, and daily tasks in one focused daily dashboard.',
    meta: 'Free • Open source • Privacy-focused',
  },
  cta: {
    primary: 'Create your account',
    secondary: 'Sign in',
  },
  scoring: {
    visible: true,
    eyebrow: 'How scoring works',
    title: 'What is a 10 made of?',
    statement: 'Your daily score is built from the things you already want to accomplish.',
  },
  features: {
    visible: true,
    eyebrow: 'Features',
    title: 'Designed around your real day.',
    intro: 'Your day is organized around meaningful time blocks — the five prayers — not an endless task list.',
  },
  pillars: {
    visible: true,
    eyebrow: 'Why HabitTerminal',
    title: 'Built for how you actually live.',
    items: [
      { title: 'Daily scoring', detail: 'Know how your day actually went.' },
      { title: 'Prayer-based planning', detail: 'Build your schedule around meaningful blocks.' },
      { title: 'Consistency', detail: 'See patterns in how you spend your days.' },
      { title: 'Achievements', detail: 'Turn consistent actions into milestones.' },
    ],
  },
  closing: {
    visible: true,
    eyebrow: 'Fajr • 05:00',
    title: 'Tomorrow starts at Fajr.',
    subtitle: 'Start your first scored day.',
  },
};

type Section = keyof LandingContent;

/**
 * Stored content merged over the defaults, one section at a time: a section
 * that is missing or fails validation falls back to its default, so a bad or
 * partial document (including one saved for an older page layout) can never
 * break the page.
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
