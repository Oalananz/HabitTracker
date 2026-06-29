/**
 * Life Areas — the six structured areas the app organizes life around.
 * Shared constants + helpers used across goals, habits, tasks, plans,
 * the Life Areas pages, the Weekly Review, and onboarding.
 *
 * Colors are kept subtle and applied via inline styles so they don't
 * depend on Tailwind palette config; structure still uses theme tokens.
 */

export type LifeAreaId =
  | 'health'
  | 'money'
  | 'work_business'
  | 'learning'
  | 'family_social'
  | 'personal';

export interface LifeArea {
  id: LifeAreaId;
  label: string;
  shortLabel: string;
  /** Compact badge text shown on cards. */
  badge: string;
  description: string;
  /** Subtle accent hex used for badges/borders/progress. */
  color: string;
  /** Material Symbols icon name (matches the rest of the app). */
  icon: string;
}

export const LIFE_AREAS: LifeArea[] = [
  {
    id: 'health',
    label: 'Health',
    shortLabel: 'Health',
    badge: 'HEALTH',
    description: 'Sleep, exercise, nutrition, mental health, and recovery.',
    color: '#6cdd81',
    icon: 'monitor_heart',
  },
  {
    id: 'money',
    label: 'Money',
    shortLabel: 'Money',
    badge: 'MONEY',
    description: 'Income, expenses, savings, debt, and financial discipline.',
    color: '#5b9dff',
    icon: 'account_balance_wallet',
  },
  {
    id: 'work_business',
    label: 'Work / Business',
    shortLabel: 'Work',
    badge: 'WORK',
    description: 'Career, projects, customers, productivity, and business growth.',
    color: '#b18cff',
    icon: 'work',
  },
  {
    id: 'learning',
    label: 'Learning',
    shortLabel: 'Learning',
    badge: 'LEARNING',
    description: 'Courses, skills, books, practice, and self-development.',
    color: '#fabc45',
    icon: 'menu_book',
  },
  {
    id: 'family_social',
    label: 'Family / Social',
    shortLabel: 'Family',
    badge: 'FAMILY',
    description: 'Family, friends, relationships, networking, and social duties.',
    color: '#ff9ec4',
    icon: 'groups',
  },
  {
    id: 'personal',
    label: 'Personal',
    shortLabel: 'Personal',
    badge: 'PERSONAL',
    description: 'Home, routines, values, faith, hobbies, and life management.',
    color: '#5fd6c9',
    icon: 'self_improvement',
  },
];

export const LIFE_AREA_IDS: LifeAreaId[] = LIFE_AREAS.map((a) => a.id);

const LIFE_AREA_MAP: Record<string, LifeArea> = Object.fromEntries(
  LIFE_AREAS.map((a) => [a.id, a]),
);

/** True if the given value is a valid LifeAreaId. */
export function isLifeAreaId(value: unknown): value is LifeAreaId {
  return typeof value === 'string' && value in LIFE_AREA_MAP;
}

/** Look up a life area by id (returns undefined for null/unknown). */
export function getLifeArea(id: string | null | undefined): LifeArea | undefined {
  if (!id) return undefined;
  return LIFE_AREA_MAP[id];
}

export function lifeAreaLabel(id: string | null | undefined): string {
  return getLifeArea(id)?.label ?? 'Unassigned';
}

export function lifeAreaBadge(id: string | null | undefined): string | null {
  return getLifeArea(id)?.badge ?? null;
}

export function lifeAreaColor(id: string | null | undefined): string {
  return getLifeArea(id)?.color ?? '#8a8f98';
}

export function lifeAreaIcon(id: string | null | undefined): string {
  return getLifeArea(id)?.icon ?? 'category';
}
