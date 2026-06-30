/**
 * Shared helpers for the Today page's Worship section and summary cards:
 * the five daily prayers, their order, "next prayer" resolution, and the
 * quick-add plan suggestions shown after each prayer block.
 */
import dayjs from 'dayjs';
import type { DayRecord } from '@/lib/services/dayRecordService';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
];

/** Quick-add task suggestions shown under each prayer block. */
export const PRAYER_SUGGESTIONS: Record<PrayerKey, string[]> = {
  fajr: ['Plan the day', 'Quran', 'Deep work'],
  dhuhr: ['Work block', 'Errands'],
  asr: ['Exercise', 'Study'],
  maghrib: ['Family', 'Rest'],
  isha: ['Review day', 'Prepare tomorrow'],
};

/** Category prefix used to tag tasks created from a prayer block suggestion. */
export const prayerTaskCategory = (key: PrayerKey) => `Prayer:${key}`;

export interface PrayerTimesLike {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

/** Find the next prayer that hasn't happened yet today (by clock time), or
 *  Fajr for "tomorrow" if all five have passed. Falls back gracefully when
 *  prayer times haven't loaded. */
export function getNextPrayer(
  times: PrayerTimesLike | null | undefined,
  dayRecord: DayRecord | null | undefined,
  now: dayjs.Dayjs = dayjs(),
): { key: PrayerKey; label: string; time: string | null; done: boolean } {
  if (!times) {
    const key = PRAYERS.find(p => !dayRecord?.[p.key])?.key ?? 'fajr';
    const label = PRAYERS.find(p => p.key === key)!.label;
    return { key, label, time: null, done: Boolean(dayRecord?.[key]) };
  }

  const nowMinutes = now.hour() * 60 + now.minute();
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  for (const p of PRAYERS) {
    const time = times[p.key];
    if (toMinutes(time) >= nowMinutes && !dayRecord?.[p.key]) {
      return { key: p.key, label: p.label, time, done: false };
    }
  }
  // All prayer times have passed (or are marked done) — show the next
  // unfinished prayer if any remain, else loop to tomorrow's Fajr.
  const unfinished = PRAYERS.find(p => !dayRecord?.[p.key]);
  if (unfinished) {
    return { key: unfinished.key, label: unfinished.label, time: times[unfinished.key], done: false };
  }
  return { key: 'fajr', label: 'Fajr', time: times.fajr, done: true };
}
