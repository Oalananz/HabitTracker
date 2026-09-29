import { NextRequest, NextResponse } from 'next/server';
import { createSession, EMAIL_RE, hashPassword, isSecureRequest, MIN_PASSWORD_LENGTH, USERNAME_RE } from '@/lib/auth';
import { pool } from '@/lib/db';
import { errorResponse } from '@/lib/apiErrors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-32 characters: letters, numbers, _ . -' },
        { status: 400 }
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    let userId: string;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: string }>(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [email, username, passwordHash]
      );
      userId = rows[0].id;
      await client.query('INSERT INTO recovery_states (user_id, start_time) VALUES ($1, NOW())', [userId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      if ((err as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'That email or username is already registered' }, { status: 409 });
      }
      throw err;
    } finally {
      client.release();
    }

    await createSession(userId, isSecureRequest(request));
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'POST /api/auth/register');
  }
}
