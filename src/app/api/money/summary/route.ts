import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getMoneySummary } from '@/lib/services/moneyService';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const summary = await getMoneySummary(userId);
    return NextResponse.json({ summary });
  } catch (error) {
    return errorResponse(error, 'GET /api/money/summary');
  }
}
