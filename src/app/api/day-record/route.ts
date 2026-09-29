import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import dayjs from 'dayjs';
import { errorResponse } from '@/lib/apiErrors';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || dayjs().format('YYYY-MM-DD');

  // Get or create day record
  const { data: existing } = await db
    .from('day_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ record: existing });
  }

  // Get user preferences for default goals
  const { data: prefs } = await db
    .from('user_preferences')
    .select('focus_goal_hours, sleep_goal_hours')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: created, error } = await db
    .from('day_records')
    .insert({
      user_id: userId,
      date,
      focus_goal: prefs?.focus_goal_hours ?? 6,
      sleep_goal: prefs?.sleep_goal_hours ?? 7,
    })
    .select()
    .single();

  if (error) {
    // Might be a race condition — try to fetch again
    const { data: retry } = await db
      .from('day_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();
    return NextResponse.json({ record: retry });
  }

  return NextResponse.json({ record: created });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  const { date, ...fields } = body;
  const recordDate = date || dayjs().format('YYYY-MM-DD');

  // Map camelCase keys to snake_case for the RPC
  const rpcParams: Record<string, unknown> = {
    p_user_id: userId,
    p_date: recordDate,
  };

  const fieldMap: Record<string, string> = {
    focusHours: 'p_focus_hours',
    noReels: 'p_no_reels',
    noMasturbation: 'p_no_masturbation',
    lowSugar: 'p_low_sugar',
    noMusic: 'p_no_music',
    noYapping: 'p_no_yapping',
    fajr: 'p_fajr',
    dhuhr: 'p_dhuhr',
    asr: 'p_asr',
    maghrib: 'p_maghrib',
    isha: 'p_isha',
    quran: 'p_quran',
    dhikrMorning: 'p_dhikr_morning',
    dhikrEvening: 'p_dhikr_evening',
    nightPrayer: 'p_night_prayer',
    sunnahPrayer: 'p_sunnah_prayer',
    sleepHours: 'p_sleep_hours',
    focusGoal: 'p_focus_goal',
    sleepGoal: 'p_sleep_goal',
    tasksDone: 'p_tasks_done',
  };

  for (const [camel, rpc] of Object.entries(fieldMap)) {
    if (fields[camel] !== undefined) {
      rpcParams[rpc] = fields[camel];
    }
  }

  const { data, error } = await db.rpc('upsert_day_record', rpcParams);

  if (error) {
    return errorResponse(new Error(error.message), 'POST /api/day-record');
  }

  return NextResponse.json(data);
}
