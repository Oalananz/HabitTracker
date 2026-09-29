import { pool } from '@/lib/db';
import { DEFAULT_LANDING_CONTENT, resolveLandingContent, type LandingContent } from '@/lib/landingContent';

const LANDING_KEY = 'landing';

/**
 * Landing copy for rendering. Falls back to the built-in defaults when there
 * is no stored copy or no database (e.g. during `next build` in Docker).
 */
export async function getLandingContent(): Promise<LandingContent> {
  try {
    const { rows } = await pool.query<{ value: unknown }>('SELECT value FROM site_content WHERE key = $1', [LANDING_KEY]);
    return resolveLandingContent(rows[0]?.value);
  } catch (err) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('Landing content unavailable, using defaults:', (err as Error).message);
    }
    return structuredClone(DEFAULT_LANDING_CONTENT);
  }
}

/** The stored record for the editor: resolved content plus save metadata. */
export async function getLandingRecord() {
  const { rows } = await pool.query<{ value: unknown; updated_at: string }>(
    'SELECT value, updated_at FROM site_content WHERE key = $1',
    [LANDING_KEY]
  );
  return {
    content: resolveLandingContent(rows[0]?.value),
    customized: rows.length > 0,
    updatedAt: rows[0]?.updated_at ?? null,
  };
}

export async function saveLandingContent(content: LandingContent, userId: string) {
  await pool.query(
    `INSERT INTO site_content (key, value, updated_at, updated_by)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
    [LANDING_KEY, JSON.stringify(content), userId]
  );
}

export async function resetLandingContent() {
  await pool.query('DELETE FROM site_content WHERE key = $1', [LANDING_KEY]);
}
