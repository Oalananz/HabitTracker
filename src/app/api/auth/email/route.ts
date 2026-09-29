import { NextRequest, NextResponse } from 'next/server';
import { EMAIL_RE, getCurrentUser } from '@/lib/auth';
import { requirePasswordConfirmation } from '@/lib/accountGuard';
import { pool } from '@/lib/db';
import { errorResponse } from '@/lib/apiErrors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const guard = await requirePasswordConfirmation(body.password);
    if ('response' in guard) return guard.response;

    try {
      await pool.query('UPDATE users SET email = $2 WHERE id = $1', [guard.userId, email]);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'That email is already registered' }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json({ user: await getCurrentUser() });
  } catch (error) {
    return errorResponse(error, 'POST /api/auth/email');
  }
}
