import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const t0 = performance.now();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[/api/auth/me] error:', err);
    return NextResponse.json({ user: null }, { status: 401 });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/auth/me] took ${(t1 - t0).toFixed(2)}ms`);
  }
}
