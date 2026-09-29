import { NextRequest, NextResponse } from 'next/server';
import { currentSessionHash, hashPassword, MIN_PASSWORD_LENGTH, revokeSessions } from '@/lib/auth';
import { requirePasswordConfirmation } from '@/lib/accountGuard';
import { pool } from '@/lib/db';
import { errorResponse } from '@/lib/apiErrors';

// Changes the password and signs out every other device.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    const guard = await requirePasswordConfirmation(body.currentPassword);
    if ('response' in guard) return guard.response;

    await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [guard.userId, await hashPassword(newPassword)]);
    await revokeSessions(guard.userId, await currentSessionHash());
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'POST /api/auth/password');
  }
}
