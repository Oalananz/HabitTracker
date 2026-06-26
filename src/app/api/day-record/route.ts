import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Get or create day record
  const { data: existing } = await supabase
    .from('day_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ record: existing });
  }

  // Get user preferences for default goals
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('focus_goal_hours, sleep_goal_hours')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from('day_records')
    .insert({
      user_id: user.id,
      date,
      focus_goal: prefs?.focus_goal_hours ?? 6,
      sleep_goal: prefs?.sleep_goal_hours ?? 7,
    })
    .select()
    .single();

  if (error) {
    // Might be a race condition — try to fetch again
    const { data: retry } = await supabase
      .from('day_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();
    return NextResponse.json({ record: retry });
  }

  return NextResponse.json({ record: created });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { date, ...fields } = body;
  const recordDate = date || new Date().toISOString().split('T')[0];

  // Map camelCase keys to snake_case for the RPC
  const rpcParams: Record<string, unknown> = {
    p_user_id: user.id,
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
  };

  for (const [camel, rpc] of Object.entries(fieldMap)) {
    if (fields[camel] !== undefined) {
      rpcParams[rpc] = fields[camel];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('upsert_day_record', rpcParams);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
