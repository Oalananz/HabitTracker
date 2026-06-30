import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

// The today_state table is added by a migration that may post-date the
// generated database types, so we access it through an untyped handle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

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
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/today-state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/today-state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
