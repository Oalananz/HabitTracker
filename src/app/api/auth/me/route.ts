import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAuthId, USERNAME_RE } from '@/lib/auth';
import { pool } from '@/lib/db';
import { errorResponse } from '@/lib/apiErrors';

const MAX_STATUS_LENGTH = 120;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[/api/auth/me] error:', err);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json().catch(() => ({}));

    const username = typeof body.username === 'string' ? body.username.trim() : undefined;
    const statusMessage =
      body.statusMessage === null ? null
      : typeof body.statusMessage === 'string' ? body.statusMessage.trim() || null
      : undefined;

    if (username !== undefined && !USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-32 characters: letters, numbers, _ . -' },
        { status: 400 }
      );
    }
    if (statusMessage && statusMessage.length > MAX_STATUS_LENGTH) {
      return NextResponse.json(
        { error: `Status message must be at most ${MAX_STATUS_LENGTH} characters` },
        { status: 400 }
      );
    }

    try {
      await pool.query(
        `UPDATE users
            SET username = COALESCE($2, username),
                status_message = CASE WHEN $3::boolean THEN $4 ELSE status_message END
          WHERE id = $1`,
        [userId, username ?? null, statusMessage !== undefined, statusMessage ?? null]
      );
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'That username is already taken' }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ user: await getCurrentUser() });
  } catch (error) {
    return errorResponse(error, 'PUT /api/auth/me');
  }
}
