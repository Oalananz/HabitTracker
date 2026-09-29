import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { db } from '@/lib/db';
import dayjs from 'dayjs';
import { errorResponse } from '@/lib/apiErrors';


export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const date = new URL(request.url).searchParams.get('date') || dayjs().format('YYYY-MM-DD');

    const { data, error } = await db
      .from('today_state')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      state: data
        ? {
            date: data.date,
            priorities: data.priorities ?? [],
            dailyReview: data.daily_review ?? null,
            aiPlan: data.ai_plan ?? null,
            updatedAt: data.updated_at,
          }
        : null,
    });
  } catch (error) {
    return errorResponse(error, 'GET /api/today-state');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const date: string | undefined = body.date;
    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const row = {
      user_id: userId,
      date,
      priorities: Array.isArray(body.priorities) ? body.priorities : [],
      daily_review: body.dailyReview ?? null,
      ai_plan: body.aiPlan ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from('today_state').upsert(row, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'POST /api/today-state');
  }
}
