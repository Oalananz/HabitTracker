import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: prefs } = await db
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({ 
    preferences: prefs || {
      user_id: userId,
      focus_goal_hours: 6,
      sleep_goal_hours: 7,
      achievement_alerts: true,
      discipline_reminder: '22:00',
      onboarding_completed: false,
      focus_areas: [],
    }
  });
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  const { focus_goal_hours, sleep_goal_hours, achievement_alerts, discipline_reminder, onboarding_completed, focus_areas } = body;

  type PrefsUpdate = {
    user_id: string;
    focus_goal_hours?: number;
    sleep_goal_hours?: number;
    achievement_alerts?: boolean;
    discipline_reminder?: string | null;
    onboarding_completed?: boolean;
    focus_areas?: string[];
    updated_at?: string;
  };

  const updateData: PrefsUpdate = { user_id: userId, updated_at: new Date().toISOString() };
  if (focus_goal_hours !== undefined) updateData.focus_goal_hours = focus_goal_hours;
  if (sleep_goal_hours !== undefined) updateData.sleep_goal_hours = sleep_goal_hours;
  if (achievement_alerts !== undefined) updateData.achievement_alerts = achievement_alerts;
  if (discipline_reminder !== undefined) updateData.discipline_reminder = discipline_reminder;
  if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed;
  if (focus_areas !== undefined) updateData.focus_areas = focus_areas;

  const { data, error } = await db
    .from('user_preferences')
    .upsert(updateData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return errorResponse(new Error(error.message), 'PUT /api/user-preferences');
  return NextResponse.json({ preferences: data });
}
