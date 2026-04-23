import { supabase } from '../supabase';
import type { Database } from '../database.types';
import dayjs from 'dayjs';

// =====================================================
// Types
// =====================================================

export interface PrayerTimesRow {
  id: string;
  user_id: string;
  date: string;
  fajr: string;
  sunrise: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  source: string;
  created_at: string;
}

export interface PrayerTimes {
  id: string;
  userId: string;
  date: string;
  fajr: string;
  sunrise: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  source: string;
  createdAt: string;
}

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

// =====================================================
// Mappers
// =====================================================

function mapPrayerTimes(p: PrayerTimesRow): PrayerTimes {
  return {
    id: p.id,
    userId: p.user_id,
    date: p.date,
    fajr: p.fajr,
    sunrise: p.sunrise,
    dhuhr: p.dhuhr,
    asr: p.asr,
    maghrib: p.maghrib,
    isha: p.isha,
    source: p.source,
    createdAt: p.created_at,
  };
}

// =====================================================
// Default prayer times (approximate for a generic location)
// =====================================================

function getDefaultPrayerTimes(date: string): Omit<PrayerTimes, 'id' | 'userId' | 'createdAt'> {
  return {
    date,
    fajr: '05:00',
    sunrise: '06:15',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:15',
    isha: '19:45',
    source: 'default',
  };
}

// =====================================================
// API-based prayer time calculation
// =====================================================

async function fetchPrayerTimesFromAPI(
  date: string,
  latitude: number,
  longitude: number
): Promise<{
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}> {
  try {
    const dateStr = dayjs(date).format('DD-MM-YYYY');
    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=2`
    );
    const data = await res.json();
    const timings = data?.data?.timings;

    if (timings) {
      return {
        fajr: timings.Fajr?.substring(0, 5) || '05:00',
        sunrise: timings.Sunrise?.substring(0, 5) || '06:15',
        dhuhr: timings.Dhuhr?.substring(0, 5) || '12:15',
        asr: timings.Asr?.substring(0, 5) || '15:30',
        maghrib: timings.Maghrib?.substring(0, 5) || '18:15',
        isha: timings.Isha?.substring(0, 5) || '19:45',
      };
    }
  } catch {
    // Fallback to defaults
  }

  return {
    fajr: '05:00',
    sunrise: '06:15',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:15',
    isha: '19:45',
  };
}

// =====================================================
// Service functions
// =====================================================

export async function getPrayerTimes(userId: string, date: string): Promise<PrayerTimes> {
  const dateStr = dayjs(date).format('YYYY-MM-DD');

  // Check if we have stored prayer times for this date
  const { data: existing } = await supabase
    .from('prayer_times')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle();

  if (existing) {
    return mapPrayerTimes(existing as PrayerTimesRow);
  }

  // Return defaults if no stored times
  const defaults = getDefaultPrayerTimes(dateStr);
  return {
    id: '',
    userId,
    createdAt: new Date().toISOString(),
    ...defaults,
  };
}

export async function setManualPrayerTimes(
  userId: string,
  date: string,
  times: {
    fajr?: string;
    sunrise?: string;
    dhuhr?: string;
    asr?: string;
    maghrib?: string;
    isha?: string;
  }
) {
  const dateStr = dayjs(date).format('YYYY-MM-DD');

  // Check if entry exists
  const { data: existing } = await supabase
    .from('prayer_times')
    .select('id')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle();

  if (existing) {
    const updateData: Database['public']['Tables']['prayer_times']['Update'] = { source: 'manual' };
    if (times.fajr !== undefined) updateData.fajr = times.fajr;
    if (times.dhuhr !== undefined) updateData.dhuhr = times.dhuhr;
    if (times.asr !== undefined) updateData.asr = times.asr;
    if (times.maghrib !== undefined) updateData.maghrib = times.maghrib;
    if (times.isha !== undefined) updateData.isha = times.isha;
    if (times.sunrise !== undefined) updateData.sunrise = times.sunrise;

    const { data: updated, error } = await supabase
      .from('prayer_times')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapPrayerTimes(updated as PrayerTimesRow);
  }

  // Create new entry
  const defaults = getDefaultPrayerTimes(dateStr);
  const insertData = {
    user_id: userId,
    date: dateStr,
    fajr: times.fajr || defaults.fajr,
    sunrise: times.sunrise || defaults.sunrise,
    dhuhr: times.dhuhr || defaults.dhuhr,
    asr: times.asr || defaults.asr,
    maghrib: times.maghrib || defaults.maghrib,
    isha: times.isha || defaults.isha,
    source: 'manual',
  };

  const { data: created, error } = await supabase
    .from('prayer_times')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPrayerTimes(created as PrayerTimesRow);
}

export async function fetchAndStorePrayerTimes(
  userId: string,
  date: string,
  latitude: number,
  longitude: number
) {
  const dateStr = dayjs(date).format('YYYY-MM-DD');
  const times = await fetchPrayerTimesFromAPI(dateStr, latitude, longitude);

  // Check if manual entry exists — don't overwrite manual entries
  const { data: existing } = await supabase
    .from('prayer_times')
    .select('id, source')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle();

  if (existing && existing.source === 'manual') {
    // Don't overwrite manual entries
    const { data: manual } = await supabase
      .from('prayer_times')
      .select('*')
      .eq('id', existing.id)
      .single();
    return mapPrayerTimes(manual as PrayerTimesRow);
  }

  if (existing) {
    const { data: updated, error } = await supabase
      .from('prayer_times')
      .update({ ...times, source: 'api' })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapPrayerTimes(updated as PrayerTimesRow);
  }

  const { data: created, error } = await supabase
    .from('prayer_times')
    .insert({
      user_id: userId,
      date: dateStr,
      ...times,
      source: 'api',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPrayerTimes(created as PrayerTimesRow);
}

export function getCurrentPrayerBlock(prayerTimes: PrayerTimes): string | null {
  const now = dayjs().format('HH:mm');
  const prayers = [
    { name: 'isha', time: prayerTimes.isha },
    { name: 'maghrib', time: prayerTimes.maghrib },
    { name: 'asr', time: prayerTimes.asr },
    { name: 'dhuhr', time: prayerTimes.dhuhr },
    { name: 'fajr', time: prayerTimes.fajr },
  ];

  for (const prayer of prayers) {
    if (now >= prayer.time) return prayer.name;
  }

  return null;
}

export function getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string } | null {
  const now = dayjs().format('HH:mm');
  const prayers = [
    { name: 'fajr', time: prayerTimes.fajr },
    { name: 'dhuhr', time: prayerTimes.dhuhr },
    { name: 'asr', time: prayerTimes.asr },
    { name: 'maghrib', time: prayerTimes.maghrib },
    { name: 'isha', time: prayerTimes.isha },
  ];

  for (const prayer of prayers) {
    if (now < prayer.time) return prayer;
  }

  return null;
}
