import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { calculateMetrics } from '@/lib/services/dashboardService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const metrics = await calculateMetrics(userId);
    const response = NextResponse.json({ metrics });
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=120');
    return response;
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
