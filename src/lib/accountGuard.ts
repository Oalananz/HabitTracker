import { NextResponse } from 'next/server';
import { requireAuthId, verifyUserPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/ai/rateLimit';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * For sensitive account changes: requires a signed-in user AND their current
 * password (rate-limited), so an unattended signed-in device can't be used to
 * take over or delete the account. Returns the user id, or an error response.
 */
export async function requirePasswordConfirmation(
  password: unknown
): Promise<{ userId: string } | { response: NextResponse }> {
  const userId = await requireAuthId();
  const limit = checkRateLimit(userId, 'account-password', MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.ok) {
    return { response: NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 }) };
  }
  if (typeof password !== 'string' || !(await verifyUserPassword(userId, password))) {
    return { response: NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 }) };
  }
  return { userId };
}
