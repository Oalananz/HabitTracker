import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// snake_case row -> camelCase
function mapReview(r: Record<string, unknown>) {
  return {
    id: r.id,
    weekStartDate: r.week_start_date,
    weekEndDate: r.week_end_date,
    wins: r.wins ?? '',
    problems: r.problems ?? '',
    lessons: r.lessons ?? '',
    nextWeekPriorities: r.next_week_priorities ?? '',
    healthReview: r.health_review ?? '',
    moneyReview: r.money_review ?? '',
    workBusinessReview: r.work_business_review ?? '',
    learningReview: r.learning_review ?? '',
    familySocialReview: r.family_social_review ?? '',
    personalReview: r.personal_review ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('weekStart');

  if (weekStart) {
    const { data } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart)
      .maybeSingle();
    return NextResponse.json({ review: data ? mapReview(data) : null });
  }

  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: (data || []).map(mapReview) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await request.json();
  if (!b.weekStartDate || !b.weekEndDate) {
    return NextResponse.json({ error: 'weekStartDate and weekEndDate are required' }, { status: 400 });
  }

  const row = {
    user_id: user.id,
    week_start_date: b.weekStartDate,
    week_end_date: b.weekEndDate,
    wins: b.wins ?? null,
    problems: b.problems ?? null,
    lessons: b.lessons ?? null,
    next_week_priorities: b.nextWeekPriorities ?? null,
    health_review: b.healthReview ?? null,
    money_review: b.moneyReview ?? null,
    work_business_review: b.workBusinessReview ?? null,
    learning_review: b.learningReview ?? null,
    family_social_review: b.familySocialReview ?? null,
    personal_review: b.personalReview ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('weekly_reviews')
    .upsert(row, { onConflict: 'user_id,week_start_date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: mapReview(data) });
}
