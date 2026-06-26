import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// All 42 achievement definitions with metadata
export const ACHIEVEMENT_DEFINITIONS = [
  // STREAK
  { key: 'streak_focus_3',       name: 'Lock In',              desc: 'Focus streak: 3 consecutive days',    cat: 'STREAK',      rarity: 'COMMON',     condition: 'focus_streak >= 3' },
  { key: 'streak_focus_7',       name: 'Week Warrior',         desc: 'Focus streak: 7 consecutive days',    cat: 'STREAK',      rarity: 'COMMON',     condition: 'focus_streak >= 7' },
  { key: 'streak_focus_14',      name: 'Fortnight Grind',      desc: 'Focus streak: 14 consecutive days',   cat: 'STREAK',      rarity: 'UNCOMMON',   condition: 'focus_streak >= 14' },
  { key: 'streak_focus_30',      name: 'The Machine',          desc: 'Focus streak: 30 consecutive days',   cat: 'STREAK',      rarity: 'UNCOMMON',   condition: 'focus_streak >= 30' },
  { key: 'streak_focus_60',      name: 'Unstoppable',          desc: 'Focus streak: 60 consecutive days',   cat: 'STREAK',      rarity: 'RARE',       condition: 'focus_streak >= 60' },
  { key: 'streak_prayer_3',      name: 'Consistent Servant',   desc: 'Prayer streak: 3 consecutive days',   cat: 'STREAK',      rarity: 'COMMON',     condition: 'prayer_streak >= 3' },
  { key: 'streak_prayer_7',      name: 'Seven Pillars',        desc: 'Prayer streak: 7 consecutive days',   cat: 'STREAK',      rarity: 'COMMON',     condition: 'prayer_streak >= 7' },
  { key: 'streak_prayer_30',     name: 'Devoted',              desc: 'Prayer streak: 30 consecutive days',  cat: 'STREAK',      rarity: 'UNCOMMON',   condition: 'prayer_streak >= 30' },
  { key: 'streak_prayer_60',     name: 'Fajr Never Missed',    desc: 'Prayer streak: 60 consecutive days',  cat: 'STREAK',      rarity: 'RARE',       condition: 'prayer_streak >= 60' },
  { key: 'streak_prayer_100',    name: 'Al-Muhafiz',           desc: 'Prayer streak: 100 consecutive days', cat: 'STREAK',      rarity: 'EPIC',       condition: 'prayer_streak >= 100' },
  { key: 'streak_noreels_7',     name: 'Algorithm Freed',      desc: 'No reels: 7 consecutive days',        cat: 'STREAK',      rarity: 'COMMON',     condition: 'no_reels_streak >= 7' },
  { key: 'streak_noreels_30',    name: 'Mind Detoxed',         desc: 'No reels: 30 consecutive days',       cat: 'STREAK',      rarity: 'UNCOMMON',   condition: 'no_reels_streak >= 30' },
  { key: 'streak_noreels_90',    name: 'The War Won',          desc: 'No reels: 90 consecutive days',       cat: 'STREAK',      rarity: 'EPIC',       condition: 'no_reels_streak >= 90' },
  { key: 'streak_discipline_7',  name: 'Iron Week',            desc: 'Full discipline: 7 consecutive days', cat: 'STREAK',      rarity: 'UNCOMMON',   condition: 'full_discipline_streak >= 7' },
  { key: 'streak_discipline_30', name: 'Iron Month',           desc: 'Full discipline: 30 consecutive days',cat: 'STREAK',      rarity: 'RARE',       condition: 'full_discipline_streak >= 30' },
  { key: 'streak_discipline_90', name: 'Unbreakable',          desc: 'Full discipline: 90 consecutive days',cat: 'STREAK',      rarity: 'LEGENDARY',  condition: 'full_discipline_streak >= 90' },
  // SCORE
  { key: 'score_first_perfect',  name: 'First Perfect Day',    desc: 'Score 10/10 for the first time',      cat: 'SCORE',       rarity: 'COMMON',     condition: 'daily_score = 10' },
  { key: 'score_perfect_3',      name: 'Perfect Trinity',      desc: '10/10 three days in a row',           cat: 'SCORE',       rarity: 'UNCOMMON',   condition: '3x perfect' },
  { key: 'score_perfect_7',      name: 'Elite Protocol',       desc: '10/10 seven days in a row',           cat: 'SCORE',       rarity: 'RARE',       condition: '7x perfect' },
  { key: 'score_total_100',      name: 'Century Mark',         desc: 'Total cumulative score ≥ 100',         cat: 'SCORE',       rarity: 'COMMON',     condition: 'total_score >= 100' },
  { key: 'score_total_500',      name: '500 Disciplines',      desc: 'Total cumulative score ≥ 500',         cat: 'SCORE',       rarity: 'RARE',       condition: 'total_score >= 500' },
  { key: 'score_total_1000',     name: '1000 Days of War',     desc: 'Total cumulative score ≥ 1000',        cat: 'SCORE',       rarity: 'EPIC',       condition: 'total_score >= 1000' },
  { key: 'score_weekly_avg_8',   name: 'High Performer',       desc: 'Weekly avg ≥ 8 for a full week',       cat: 'SCORE',       rarity: 'UNCOMMON',   condition: 'weekly_avg >= 8' },
  { key: 'score_weekly_avg_9',   name: 'Peak State',           desc: 'Weekly avg ≥ 9 for a full week',       cat: 'SCORE',       rarity: 'RARE',       condition: 'weekly_avg >= 9' },
  // WORSHIP
  { key: 'worship_first_full',   name: 'First Full Prayer Day',desc: 'All 5 prayers in one day (first time)',cat: 'WORSHIP',     rarity: 'COMMON',     condition: 'all 5 prayers' },
  { key: 'worship_quran_7',      name: 'Quranic Week',         desc: 'Quran checked 7 days in a row',       cat: 'WORSHIP',     rarity: 'UNCOMMON',   condition: 'quran 7d' },
  { key: 'worship_all_extras_day',name:'Full Worship Mode',    desc: 'All worship items in one day',         cat: 'WORSHIP',     rarity: 'RARE',       condition: 'all worship' },
  { key: 'worship_fajr_streak_7',name: 'Dawn Warrior',         desc: 'Fajr checked 7 days in a row',        cat: 'WORSHIP',     rarity: 'UNCOMMON',   condition: 'fajr 7d' },
  { key: 'worship_fajr_streak_30',name:'Fajr Guardian',        desc: 'Fajr checked 30 days in a row',       cat: 'WORSHIP',     rarity: 'RARE',       condition: 'fajr 30d' },
  // FOCUS
  { key: 'focus_first_goal',     name: 'First 6h Day',         desc: 'Focus ≥ goal for the first time',     cat: 'FOCUS',       rarity: 'COMMON',     condition: 'focus >= goal' },
  { key: 'focus_8h_day',         name: 'Deep Work',            desc: 'Focus ≥ 8h in a single day',          cat: 'FOCUS',       rarity: 'UNCOMMON',   condition: 'focus >= 8' },
  { key: 'focus_week_goal',      name: 'Full Week Grind',      desc: 'Focus goal met every day for a week', cat: 'FOCUS',       rarity: 'RARE',       condition: 'focus 7d' },
  { key: 'focus_50h_total',      name: '50 Hours Invested',    desc: 'Cumulative focus hours ≥ 50',          cat: 'FOCUS',       rarity: 'COMMON',     condition: 'total_focus >= 50' },
  { key: 'focus_200h_total',     name: '200 Hours Invested',   desc: 'Cumulative focus hours ≥ 200',         cat: 'FOCUS',       rarity: 'UNCOMMON',   condition: 'total_focus >= 200' },
  { key: 'focus_500h_total',     name: '500 Hours Invested',   desc: 'Cumulative focus hours ≥ 500',         cat: 'FOCUS',       rarity: 'EPIC',       condition: 'total_focus >= 500' },
  // DISCIPLINE
  { key: 'discipline_first_clean',name:'First Clean Day',      desc: 'All discipline items checked (first)', cat: 'DISCIPLINE',  rarity: 'COMMON',     condition: 'all discipline' },
  { key: 'discipline_recovery_30',name:'Recovery Milestone',   desc: 'Any recovery journey hits 30 days',   cat: 'DISCIPLINE',  rarity: 'UNCOMMON',   condition: 'recovery 30d' },
  { key: 'discipline_recovery_90',name:'90 Day Warrior',       desc: 'Any recovery journey hits 90 days',   cat: 'DISCIPLINE',  rarity: 'EPIC',       condition: 'recovery 90d' },
  { key: 'discipline_recovery_365',name:'One Year Clean',      desc: 'Any recovery journey hits 365 days',  cat: 'DISCIPLINE',  rarity: 'LEGENDARY',  condition: 'recovery 365d' },
  { key: 'discipline_war_won',   name: 'The War Is Won',       desc: '"The War" journey hits 100 days',     cat: 'DISCIPLINE',  rarity: 'LEGENDARY',  condition: 'war 100d' },
  // COMPOUND
  { key: 'compound_godmode',     name: 'GOD MODE',             desc: 'Score 10/10 + all discipline clean',  cat: 'COMPOUND',    rarity: 'LEGENDARY',  condition: 'perfect + clean' },
  { key: 'compound_full_week',   name: 'Perfect Week',         desc: 'Score ≥ 8 every day for 7 days',      cat: 'COMPOUND',    rarity: 'LEGENDARY',  condition: 'perfect week' },
  { key: 'compound_discipline_god',name:'Discipline God',      desc: 'All discipline + all prayers in a day',cat:'COMPOUND',    rarity: 'EPIC',       condition: 'all discipline + prayers' },
  { key: 'compound_first_month', name: 'First Month Survived', desc: '30 days of data logged (any score)',  cat: 'COMPOUND',    rarity: 'UNCOMMON',   condition: '30 days data' },
  { key: 'compound_comeback',    name: 'Comeback Protocol',    desc: 'After score < 4, scored ≥ 8 next day', cat: 'COMPOUND',   rarity: 'UNCOMMON',   condition: 'comeback' },
  { key: 'compound_dawn_grind',  name: 'Dawn Grind',           desc: 'Fajr + focus ≥ 4h, 7 days in a row', cat: 'COMPOUND',    rarity: 'RARE',       condition: 'dawn grind 7d' },
  { key: 'compound_ramadan_ready',name:'Ramadan Ready',        desc: 'All prayers + Quran + Dhikr, 30 days',cat: 'COMPOUND',    rarity: 'LEGENDARY',  condition: 'ramadan 30d' },
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const summaryOnly = searchParams.get('summary') === 'true';

  const { data: unlocked } = await supabase
    .from('achievements')
    .select('achievement_key, unlocked_at')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false });

  const unlockedMap = new Map((unlocked || []).map(a => [a.achievement_key, a.unlocked_at]));

  if (summaryOnly) {
    return NextResponse.json({ 
      unlockedCount: unlockedMap.size,
      totalCount: ACHIEVEMENT_DEFINITIONS.length,
      recent: (unlocked || []).slice(0, 3).map(a => ({
        key: a.achievement_key,
        name: ACHIEVEMENT_DEFINITIONS.find(d => d.key === a.achievement_key)?.name || a.achievement_key,
        unlocked_at: a.unlocked_at,
      })),
    });
  }

  // Get user stats for progress calculations
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
    const unlockedAt = unlockedMap.get(def.key);
    return {
      ...def,
      unlocked: !!unlockedAt,
      unlockedAt: unlockedAt || null,
      progress: computeProgress(def.key, stats),
    };
  });

  return NextResponse.json({ achievements });
}

function computeProgress(key: string, stats: Record<string, string | number> | null): { current: number; target: number } | null {
  if (!stats) return null;
  const n = (v: string | number | undefined) => Number(v ?? 0);
  const map: Record<string, { current: number; target: number }> = {
    streak_focus_3:       { current: n(stats.focus_streak),            target: 3 },
    streak_focus_7:       { current: n(stats.focus_streak),            target: 7 },
    streak_focus_14:      { current: n(stats.focus_streak),            target: 14 },
    streak_focus_30:      { current: n(stats.focus_streak),            target: 30 },
    streak_focus_60:      { current: n(stats.focus_streak),            target: 60 },
    streak_prayer_3:      { current: n(stats.prayer_streak),           target: 3 },
    streak_prayer_7:      { current: n(stats.prayer_streak),           target: 7 },
    streak_prayer_30:     { current: n(stats.prayer_streak),           target: 30 },
    streak_prayer_60:     { current: n(stats.prayer_streak),           target: 60 },
    streak_prayer_100:    { current: n(stats.prayer_streak),           target: 100 },
    streak_noreels_7:     { current: n(stats.no_reels_streak),         target: 7 },
    streak_noreels_30:    { current: n(stats.no_reels_streak),         target: 30 },
    streak_noreels_90:    { current: n(stats.no_reels_streak),         target: 90 },
    streak_discipline_7:  { current: n(stats.full_discipline_streak),  target: 7 },
    streak_discipline_30: { current: n(stats.full_discipline_streak),  target: 30 },
    streak_discipline_90: { current: n(stats.full_discipline_streak),  target: 90 },
    score_total_100:      { current: n(stats.total_score),             target: 100 },
    score_total_500:      { current: n(stats.total_score),             target: 500 },
    score_total_1000:     { current: n(stats.total_score),             target: 1000 },
    focus_50h_total:      { current: Math.floor(n(stats.total_focus_hours)), target: 50 },
    focus_200h_total:     { current: Math.floor(n(stats.total_focus_hours)), target: 200 },
    focus_500h_total:     { current: Math.floor(n(stats.total_focus_hours)), target: 500 },
  };
  return map[key] || null;
}
