import { supabase } from '../supabase';
import type { Database } from '../database.types';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

// =====================================================
// Types
// =====================================================

export type PlanStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type PlanType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type PrayerBlock = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface PlanRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  plan_type: string;
  status: string;
  priority: string;
  category: string | null;
  notes: string | null;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  day_of_week: string | null;
  prayer_block: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  planType: PlanType;
  status: PlanStatus;
  priority: string;
  category: string | null;
  notes: string | null;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  dayOfWeek: string | null;
  occurrenceDate: string;
  occurrenceKey: string;
  prayerBlock: PrayerBlock | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Mappers
// =====================================================

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_KEY_SET = new Set<string>(DAY_KEYS);

function normalizeDate(date: string) {
  return dayjs(date).startOf('day').format('YYYY-MM-DD');
}

function normalizeTime(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

function normalizeDayOfWeek(value: string | null | undefined) {
  const selected = (value || '')
    .split(',')
    .map(day => day.trim().toLowerCase())
    .filter(day => DAY_KEY_SET.has(day));

  if (selected.length === 0) return null;

  const uniqueInWeekOrder = DAY_KEYS.filter(day => selected.includes(day));
  return uniqueInWeekOrder.join(',');
}

function mapPlan(p: PlanRow): Plan {
  const startDate = normalizeDate(p.start_date);

  return {
    id: p.id,
    userId: p.user_id,
    title: p.title,
    description: p.description,
    planType: p.plan_type as PlanType,
    status: p.status as PlanStatus,
    priority: p.priority,
    category: p.category,
    notes: p.notes,
    startDate,
    startTime: normalizeTime(p.start_time),
    endDate: p.end_date ? normalizeDate(p.end_date) : null,
    endTime: normalizeTime(p.end_time),
    dayOfWeek: normalizeDayOfWeek(p.day_of_week),
    occurrenceDate: startDate,
    occurrenceKey: `${p.id}:${startDate}`,
    prayerBlock: p.prayer_block as PrayerBlock | null,
    completedAt: p.completed_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

function mapPlanOccurrence(p: PlanRow, occurrenceDate: string): Plan {
  return {
    ...mapPlan(p),
    occurrenceDate,
    occurrenceKey: `${p.id}:${occurrenceDate}`,
  };
}

function getPlanBounds(p: PlanRow) {
  const start = normalizeDate(p.start_date);
  const end = p.end_date ? normalizeDate(p.end_date) : start;

  return {
    start,
    end: end < start ? start : end,
  };
}

function getWeeklyDays(p: PlanRow) {
  const configured = normalizeDayOfWeek(p.day_of_week);
  if (configured) return configured.split(',') as DayKey[];

  return [DAY_KEYS[dayjs(p.start_date).day()]];
}

function expandPlanDates(p: PlanRow, startDate: string, endDate: string) {
  const rangeStart = normalizeDate(startDate);
  const rangeEnd = normalizeDate(endDate);
  const { start: planStart, end: planEnd } = getPlanBounds(p);
  const from = planStart > rangeStart ? planStart : rangeStart;
  const to = planEnd < rangeEnd ? planEnd : rangeEnd;
  const dates: string[] = [];

  if (from > to) return dates;

  const pushDailyDates = () => {
    let current = dayjs(from);
    const last = dayjs(to);

    while (current.isBefore(last, 'day') || current.isSame(last, 'day')) {
      dates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }
  };

  if (p.plan_type === 'weekly') {
    const weeklyDays = new Set(getWeeklyDays(p));
    let current = dayjs(from);
    const last = dayjs(to);

    while (current.isBefore(last, 'day') || current.isSame(last, 'day')) {
      if (weeklyDays.has(DAY_KEYS[current.day()])) {
        dates.push(current.format('YYYY-MM-DD'));
      }
      current = current.add(1, 'day');
    }

    return dates;
  }

  if (p.plan_type === 'monthly') {
    const anchorDay = dayjs(planStart).date();
    let currentMonth = dayjs(from).startOf('month');
    const lastMonth = dayjs(to).startOf('month');

    while (currentMonth.isBefore(lastMonth, 'month') || currentMonth.isSame(lastMonth, 'month')) {
      const occurrenceDay = Math.min(anchorDay, currentMonth.daysInMonth());
      const occurrenceDate = currentMonth.date(occurrenceDay).format('YYYY-MM-DD');

      if (occurrenceDate >= from && occurrenceDate <= to) {
        dates.push(occurrenceDate);
      }

      currentMonth = currentMonth.add(1, 'month');
    }

    return dates;
  }

  if (p.plan_type === 'custom' && normalizeDayOfWeek(p.day_of_week)) {
    const customDays = new Set(getWeeklyDays(p));
    let current = dayjs(from);
    const last = dayjs(to);

    while (current.isBefore(last, 'day') || current.isSame(last, 'day')) {
      if (customDays.has(DAY_KEYS[current.day()])) {
        dates.push(current.format('YYYY-MM-DD'));
      }
      current = current.add(1, 'day');
    }

    return dates;
  }

  pushDailyDates();
  return dates;
}

function expandPlanRows(plans: PlanRow[], startDate: string, endDate: string) {
  return plans
    .flatMap(plan => expandPlanDates(plan, startDate, endDate).map(date => mapPlanOccurrence(plan, date)))
    .sort((a, b) => {
      const byDate = a.occurrenceDate.localeCompare(b.occurrenceDate);
      if (byDate !== 0) return byDate;

      const byTime = (a.startTime || '').localeCompare(b.startTime || '');
      if (byTime !== 0) return byTime;

      return a.createdAt.localeCompare(b.createdAt);
    });
}

async function getPlanRowsForRange(userId: string, startDate: string, endDate: string) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .lte('start_date', end)
    .or(`end_date.gte.${start},end_date.is.null`)
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (plans || []) as PlanRow[];
}

// =====================================================
// CRUD
// =====================================================

export async function createPlan(
  userId: string,
  data: {
    title: string;
    description?: string;
    planType?: string;
    status?: string;
    priority?: string;
    category?: string;
    notes?: string;
    startDate: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    dayOfWeek?: string | null;
    prayerBlock?: string;
  }
) {
  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      plan_type: data.planType || 'daily',
      status: data.status || 'planned',
      priority: data.priority || 'nominal',
      category: data.category || null,
      notes: data.notes || null,
      start_date: data.startDate,
      start_time: normalizeTime(data.startTime),
      end_date: data.endDate || null,
      end_time: normalizeTime(data.endTime),
      day_of_week: normalizeDayOfWeek(data.dayOfWeek),
      prayer_block: data.prayerBlock || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPlan(plan as PlanRow);
}

export async function updatePlan(
  planId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    planType?: string;
    status?: string;
    priority?: string;
    category?: string;
    notes?: string;
    startDate?: string;
    startTime?: string | null;
    endDate?: string;
    endTime?: string | null;
    dayOfWeek?: string | null;
    prayerBlock?: string | null;
  }
) {
  const updateData: Database['public']['Tables']['plans']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.planType !== undefined) updateData.plan_type = data.planType;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }
  }
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.startTime !== undefined) updateData.start_time = normalizeTime(data.startTime);
  if (data.endDate !== undefined) updateData.end_date = data.endDate;
  if (data.endTime !== undefined) updateData.end_time = normalizeTime(data.endTime);
  if (data.dayOfWeek !== undefined) updateData.day_of_week = normalizeDayOfWeek(data.dayOfWeek);
  if (data.prayerBlock !== undefined) updateData.prayer_block = data.prayerBlock;

  const { data: plan, error } = await supabase
    .from('plans')
    .update(updateData)
    .eq('id', planId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPlan(plan as PlanRow);
}

export async function deletePlan(planId: string, userId: string) {
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// =====================================================
// Queries
// =====================================================

export async function getPlansByDate(userId: string, date: string) {
  const dateStr = normalizeDate(date);
  const plans = await getPlanRowsForRange(userId, dateStr, dateStr);

  return expandPlanRows(plans, dateStr, dateStr);
}

export async function getPlansByRange(userId: string, startDate: string, endDate: string) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const plans = await getPlanRowsForRange(userId, start, end);

  return expandPlanRows(plans, start, end);
}

export async function getWeeklyPlans(userId: string, weekOf?: string) {
  const base = weekOf ? dayjs(weekOf) : dayjs();
  const weekStart = base.startOf('week').format('YYYY-MM-DD');
  const weekEnd = base.endOf('week').format('YYYY-MM-DD');

  return getPlansByRange(userId, weekStart, weekEnd);
}

export async function getMonthlyPlans(userId: string, month?: string) {
  const base = month ? dayjs(month + '-01') : dayjs();
  const monthStart = base.startOf('month').format('YYYY-MM-DD');
  const monthEnd = base.endOf('month').format('YYYY-MM-DD');

  return getPlansByRange(userId, monthStart, monthEnd);
}

export async function assignPlanToPrayerBlock(
  planId: string,
  userId: string,
  prayerBlock: PrayerBlock | null
) {
  return updatePlan(planId, userId, { prayerBlock });
}

export async function getPlansSummary(userId: string) {
  const today = normalizeDate(dayjs().format('YYYY-MM-DD'));
  const weekStart = normalizeDate(dayjs().startOf('week').format('YYYY-MM-DD'));
  const weekEnd = normalizeDate(dayjs().endOf('week').format('YYYY-MM-DD'));
  const monthStart = normalizeDate(dayjs().startOf('month').format('YYYY-MM-DD'));
  const monthEnd = normalizeDate(dayjs().endOf('month').format('YYYY-MM-DD'));

  const { data: allPlans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  const plans = (allPlans || []) as PlanRow[];
  const todayPlans = expandPlanRows(plans, today, today);
  const weekPlans = expandPlanRows(plans, weekStart, weekEnd);
  const monthPlans = expandPlanRows(plans, monthStart, monthEnd);

  const overdue = plans.filter(p => {
    const end = getPlanBounds(p).end;
    return end < today && p.status !== 'completed' && p.status !== 'cancelled';
  });

  const upcoming = plans.filter(p => {
    const start = getPlanBounds(p).start;
    return start > today && p.status !== 'completed' && p.status !== 'cancelled';
  });

  return {
    totalPlans: plans.length,
    todayCount: todayPlans.length,
    todayCompleted: todayPlans.filter(p => p.status === 'completed').length,
    weekCount: weekPlans.length,
    weekCompleted: weekPlans.filter(p => p.status === 'completed').length,
    monthCount: monthPlans.length,
    monthCompleted: monthPlans.filter(p => p.status === 'completed').length,
    overdueCount: overdue.length,
    upcomingCount: upcoming.length,
  };
}
