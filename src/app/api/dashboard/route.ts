import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { calculateMetrics } from '@/lib/services/dashboardService';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const metrics = await calculateMetrics(userId);
    const response = NextResponse.json({ metrics });
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=120');
    return response;
  } catch (error) {
    return errorResponse(error, 'GET /api/dashboard');
  }
}
