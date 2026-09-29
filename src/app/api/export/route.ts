import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { requireAuthId } from '@/lib/auth';
import { pool } from '@/lib/db';
import { errorResponse } from '@/lib/apiErrors';

// Every table holding the user's own data, and the column that ties it to them.
// Secrets are never exported: sessions, the password hash, OAuth tokens and
// invite tokens (which would let someone join a journey as you).
const USER_TABLES: [table: string, column: string][] = [
  ['day_records', 'user_id'],
  ['task_instances', 'user_id'],
  ['habits', 'user_id'],
  ['goals', 'user_id'],
  ['plans', 'user_id'],
  ['prayer_times', 'user_id'],
  ['today_state', 'user_id'],
  ['weekly_reviews', 'user_id'],
  ['user_preferences', 'user_id'],
  ['user_stats', 'user_id'],
  ['achievements', 'user_id'],
  ['recovery_states', 'user_id'],
  ['recovery_journeys', 'user_id'],
  ['failure_logs', 'user_id'],
  ['competitive_journeys', 'owner_id'],
  ['journey_participants', 'user_id'],
  ['journey_failures', 'user_id'],
  ['journey_check_ins', 'user_id'],
  ['journey_reactions', 'from_user_id'],
  ['money_categories', 'user_id'],
  ['money_transactions', 'user_id'],
  ['money_budgets', 'user_id'],
  ['savings_goals', 'user_id'],
  ['debts', 'user_id'],
  ['subscriptions', 'user_id'],
  ['learning_courses', 'user_id'],
  ['learning_modules', 'user_id'],
  ['learning_lessons', 'user_id'],
  ['skills', 'user_id'],
  ['study_sessions', 'user_id'],
  ['certificates', 'user_id'],
  ['learning_resources', 'user_id'],
  ['connected_learning_accounts', 'user_id'],
  ['external_learning_courses', 'user_id'],
];

const SECRET_COLUMNS = new Set(['password_hash', 'token_hash', 'token', 'access_token_encrypted', 'refresh_token_encrypted']);

const withoutSecrets = (rows: Record<string, unknown>[]) =>
  rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => !SECRET_COLUMNS.has(key))));

/** Downloads everything the signed-in user has stored, as one JSON file. */
export async function GET() {
  try {
    const userId = await requireAuthId();

    const { rows: users } = await pool.query(
      'SELECT id, email, username, status_message, created_at FROM users WHERE id = $1',
      [userId]
    );
    const data: Record<string, unknown> = {};
    for (const [table, column] of USER_TABLES) {
      // Identifiers come from the fixed list above, never from the request.
      const { rows } = await pool.query(`SELECT * FROM "${table}" WHERE "${column}" = $1`, [userId]);
      data[table] = withoutSecrets(rows);
    }

    const body = JSON.stringify(
      { format: 'habitterminal-export', version: 1, exportedAt: new Date().toISOString(), account: users[0] ?? null, data },
      null,
      2
    );
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="habitterminal-export-${dayjs().format('YYYY-MM-DD')}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return errorResponse(error, 'GET /api/export');
  }
}
