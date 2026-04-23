import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { calculateMetrics } from '@/lib/services/dashboardService';

export async function GET() {
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const metrics = await calculateMetrics(userId);
    return NextResponse.json({ metrics });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/dashboard] took ${(t1 - t0).toFixed(2)}ms`);
  }
}
