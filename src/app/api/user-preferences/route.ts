import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ 
    preferences: prefs || {
      user_id: user.id,
      focus_goal_hours: 6,
      sleep_goal_hours: 7,
      achievement_alerts: true,
      discipline_reminder: '22:00',
    }
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { focus_goal_hours, sleep_goal_hours, achievement_alerts, discipline_reminder } = body;

  type PrefsUpdate = {
    user_id: string;
    focus_goal_hours?: number;
    sleep_goal_hours?: number;
    achievement_alerts?: boolean;
    discipline_reminder?: string | null;
    updated_at?: string;
  };

  const updateData: PrefsUpdate = { user_id: user.id, updated_at: new Date().toISOString() };
  if (focus_goal_hours !== undefined) updateData.focus_goal_hours = focus_goal_hours;
  if (sleep_goal_hours !== undefined) updateData.sleep_goal_hours = sleep_goal_hours;
  if (achievement_alerts !== undefined) updateData.achievement_alerts = achievement_alerts;
  if (discipline_reminder !== undefined) updateData.discipline_reminder = discipline_reminder;

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(updateData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
