import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getLearningSummary } from '@/lib/services/learningService';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const summary = await getLearningSummary(userId);
    return NextResponse.json({ summary });
  } catch (error) {
    return errorResponse(error, 'GET /api/learning/summary');
  }
}
