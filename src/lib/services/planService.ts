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
  prayerBlock: PrayerBlock | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Mappers
// =====================================================

function mapPlan(p: PlanRow): Plan {
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
    startDate: p.start_date,
    startTime: p.start_time,
    endDate: p.end_date,
    endTime: p.end_time,
    dayOfWeek: p.day_of_week,
    prayerBlock: p.prayer_block as PrayerBlock | null,
    completedAt: p.completed_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
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
    dayOfWeek?: string;
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
      start_time: data.startTime || null,
      end_date: data.endDate || null,
      end_time: data.endTime || null,
      day_of_week: data.dayOfWeek || null,
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
  if (data.startTime !== undefined) updateData.start_time = data.startTime;
  if (data.endDate !== undefined) updateData.end_date = data.endDate;
  if (data.endTime !== undefined) updateData.end_time = data.endTime;
  if (data.dayOfWeek !== undefined) updateData.day_of_week = data.dayOfWeek;
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
  const dateStr = dayjs(date).format('YYYY-MM-DD');

  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .lte('start_date', dateStr)
    .or(`end_date.gte.${dateStr},end_date.is.null`)
    .order('prayer_block', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  // For daily plans, also include plans with start_date == date
  const filtered = (plans || []).filter((p: PlanRow) => {
    const start = dayjs(p.start_date).format('YYYY-MM-DD');
    const end = p.end_date ? dayjs(p.end_date).format('YYYY-MM-DD') : start;
    return dateStr >= start && dateStr <= end;
  });

  return filtered.map((p: PlanRow) => mapPlan(p));
}

export async function getPlansByRange(userId: string, startDate: string, endDate: string) {
  const start = dayjs(startDate).format('YYYY-MM-DD');
  const end = dayjs(endDate).format('YYYY-MM-DD');

  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .lte('start_date', end)
    .or(`end_date.gte.${start},end_date.is.null`)
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (plans || []).map((p: PlanRow) => mapPlan(p));
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
  const today = dayjs().format('YYYY-MM-DD');
  const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
  const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

  const { data: allPlans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  const plans = (allPlans || []) as PlanRow[];

  const todayPlans = plans.filter(p => {
    const start = dayjs(p.start_date).format('YYYY-MM-DD');
    const end = p.end_date ? dayjs(p.end_date).format('YYYY-MM-DD') : start;
    return today >= start && today <= end;
  });

  const weekPlans = plans.filter(p => {
    const start = dayjs(p.start_date).format('YYYY-MM-DD');
    const end = p.end_date ? dayjs(p.end_date).format('YYYY-MM-DD') : start;
    return start <= weekEnd && end >= weekStart;
  });

  const monthPlans = plans.filter(p => {
    const start = dayjs(p.start_date).format('YYYY-MM-DD');
    const end = p.end_date ? dayjs(p.end_date).format('YYYY-MM-DD') : start;
    return start <= monthEnd && end >= monthStart;
  });

  const overdue = plans.filter(p => {
    const end = p.end_date ? dayjs(p.end_date).format('YYYY-MM-DD') : dayjs(p.start_date).format('YYYY-MM-DD');
    return end < today && p.status !== 'completed' && p.status !== 'cancelled';
  });

  const upcoming = plans.filter(p => {
    const start = dayjs(p.start_date).format('YYYY-MM-DD');
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
