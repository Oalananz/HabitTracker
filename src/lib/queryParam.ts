import { isLifeAreaId, type LifeAreaId } from '@/lib/lifeAreas';

/**
 * Reads a URL query parameter on the client (null during server rendering).
 * Meant for lazy useState initializers on pages rendered only after the
 * client-side auth check, so there is no server markup to mismatch.
 */
export function getQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** The `?area=` deep-link parameter, if it names a valid life area. */
export function getAreaQueryParam(): LifeAreaId | null {
  const area = getQueryParam('area');
  return area && isLifeAreaId(area) ? area : null;
}
