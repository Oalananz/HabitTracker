import { supabase } from '../supabase';

export interface DayRecord {
  id: string;
  userId: string;
  date: string;
  focusHours: number;
  focusGoal: number;
  noReels: boolean;
  noMasturbation: boolean;
  lowSugar: boolean;
  noMusic: boolean;
  noYapping: boolean;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  quran: boolean;
  dhikrMorning: boolean;
  dhikrEvening: boolean;
  nightPrayer: boolean;
  sunnahPrayer: boolean;
  sleepHours: number;
  sleepGoal: number;
  dailyScore: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DayRecordUpdate = Partial<Omit<DayRecord, 'id' | 'userId' | 'date' | 'createdAt' | 'updatedAt' | 'dailyScore'>>;

function mapRow(row: Record<string, unknown>): DayRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    date: row.date as string,
    focusHours: Number(row.focus_hours ?? 0),
    focusGoal: Number(row.focus_goal ?? 6),
    noReels: Boolean(row.no_reels),
    noMasturbation: Boolean(row.no_masturbation),
    lowSugar: Boolean(row.low_sugar),
    noMusic: Boolean(row.no_music),
    noYapping: Boolean(row.no_yapping),
    fajr: Boolean(row.fajr),
    dhuhr: Boolean(row.dhuhr),
    asr: Boolean(row.asr),
    maghrib: Boolean(row.maghrib),
    isha: Boolean(row.isha),
    quran: Boolean(row.quran),
    dhikrMorning: Boolean(row.dhikr_morning),
    dhikrEvening: Boolean(row.dhikr_evening),
    nightPrayer: Boolean(row.night_prayer),
    sunnahPrayer: Boolean(row.sunnah_prayer),
    sleepHours: Number(row.sleep_hours ?? 0),
    sleepGoal: Number(row.sleep_goal ?? 7),
    dailyScore: Number(row.daily_score ?? 0),
    notes: (row.notes as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getDayRecord(userId: string, date: string): Promise<DayRecord | null> {
  const { data } = await supabase
    .from('day_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getDayRecordsRange(userId: string, startDate: string, endDate: string): Promise<DayRecord[]> {
  const { data } = await supabase
    .from('day_records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  return (data || []).map(r => mapRow(r as Record<string, unknown>));
}

export async function upsertDayRecord(
  userId: string,
  date: string,
  fields: DayRecordUpdate
): Promise<{ record: DayRecord; newAchievements: string[] }> {
  const params: Record<string, unknown> = { p_user_id: userId, p_date: date };
  if (fields.focusHours !== undefined) params.p_focus_hours = fields.focusHours;
  if (fields.focusGoal !== undefined) params.p_focus_goal = fields.focusGoal;
  if (fields.noReels !== undefined) params.p_no_reels = fields.noReels;
  if (fields.noMasturbation !== undefined) params.p_no_masturbation = fields.noMasturbation;
  if (fields.lowSugar !== undefined) params.p_low_sugar = fields.lowSugar;
  if (fields.noMusic !== undefined) params.p_no_music = fields.noMusic;
  if (fields.noYapping !== undefined) params.p_no_yapping = fields.noYapping;
  if (fields.fajr !== undefined) params.p_fajr = fields.fajr;
  if (fields.dhuhr !== undefined) params.p_dhuhr = fields.dhuhr;
  if (fields.asr !== undefined) params.p_asr = fields.asr;
  if (fields.maghrib !== undefined) params.p_maghrib = fields.maghrib;
  if (fields.isha !== undefined) params.p_isha = fields.isha;
  if (fields.quran !== undefined) params.p_quran = fields.quran;
  if (fields.dhikrMorning !== undefined) params.p_dhikr_morning = fields.dhikrMorning;
  if (fields.dhikrEvening !== undefined) params.p_dhikr_evening = fields.dhikrEvening;
  if (fields.nightPrayer !== undefined) params.p_night_prayer = fields.nightPrayer;
  if (fields.sunnahPrayer !== undefined) params.p_sunnah_prayer = fields.sunnahPrayer;
  if (fields.sleepHours !== undefined) params.p_sleep_hours = fields.sleepHours;
  if (fields.sleepGoal !== undefined) params.p_sleep_goal = fields.sleepGoal;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('upsert_day_record', params);
  if (error) throw new Error(error.message);

  const result = data as { record: Record<string, unknown>; newAchievements: string[] };
  return {
    record: mapRow(result.record),
    newAchievements: result.newAchievements || [],
  };
}
