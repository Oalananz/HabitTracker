import { NextRequest, NextResponse } from 'next/server';
import { createSession, isSecureRequest, verifyPassword } from '@/lib/auth';
import { pool } from '@/lib/db';
import { checkRateLimit } from '@/lib/ai/rateLimit';
import { errorResponse } from '@/lib/apiErrors';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Throttle per account and per client address to slow password guessing.
    // The address is only known behind a proxy; never share one bucket across all clients.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    const byEmail = checkRateLimit(email, 'login-email', MAX_ATTEMPTS, WINDOW_MS);
    const byIp = ip
      ? checkRateLimit(ip, 'login-ip', MAX_ATTEMPTS * 5, WINDOW_MS)
      : { ok: true, resetAt: 0 };
    if (!byEmail.ok || !byIp.ok) {
      const retryAfter = Math.ceil((Math.max(byEmail.resetAt, byIp.resetAt) - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { rows } = await pool.query<{ id: string; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE lower(email) = $1',
      [email]
    );
    const user = rows[0];
    const valid = await verifyPassword(password, user?.password_hash);
    if (!user || !valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await createSession(user.id, isSecureRequest(request));
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'POST /api/auth/login');
  }
}
