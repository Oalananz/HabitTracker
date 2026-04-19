import { supabase } from '../supabase';
import type { Database } from '../database.types';
import dayjs from 'dayjs';

type GoalRow = Database['public']['Tables']['goals']['Row'];

export async function getGoals(userId: string, type?: string) {
  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('goal_type', type);
  }

  const { data: goals, error } = await query;
  if (error) throw new Error(error.message);
  return (goals || []).map(mapGoal);
}

export async function getGoal(goalId: string, userId: string) {
  const { data: goal, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return mapGoal(goal);
}

export async function createGoal(
  userId: string,
  data: {
    title: string;
    description?: string;
    goalType: string;
    targetDate?: string;
    targetCount?: number;
  }
) {
  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      goal_type: data.goalType,
      target_date: data.targetDate || null,
      target_count: data.targetCount || 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapGoal(goal);
}

export async function updateGoal(
  goalId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    goalType?: string;
    targetDate?: string;
    targetCount?: number;
    currentCount?: number;
  }
) {
  const updateData: Database['public']['Tables']['goals']['Update'] = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.goalType !== undefined) updateData.goal_type = data.goalType;
  if (data.targetDate !== undefined) updateData.target_date = data.targetDate;
  if (data.targetCount !== undefined) updateData.target_count = data.targetCount;
  if (data.currentCount !== undefined) {
    updateData.current_count = data.currentCount;
    // Auto-complete if count meets target
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapGoal(goal);
}

export async function incrementGoalProgress(goalId: string, userId: string, amount: number = 1) {
  // First get current
  const { data: current, error: fetchError } = await supabase
    .from('goals')
    .select('current_count, target_count')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !current) throw new Error('Goal not found');

  const newCount = (current.current_count || 0) + amount;
  const isComplete = newCount >= (current.target_count || 1);

  const updateData: Database['public']['Tables']['goals']['Update'] = {
    current_count: newCount,
  };

  if (isComplete) {
    updateData.completed = true;
    updateData.completed_at = new Date().toISOString();
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapGoal(goal);
}

export async function toggleGoalComplete(goalId: string, userId: string) {
  const { data: current } = await supabase
    .from('goals')
    .select('completed')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (!current) throw new Error('Goal not found');

  const { data: goal, error } = await supabase
    .from('goals')
    .update({
      completed: !current.completed,
      completed_at: !current.completed ? new Date().toISOString() : null,
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapGoal(goal);
}

export async function deleteGoal(goalId: string, userId: string) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function getGoalsSummary(userId: string) {
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw new Error(error.message);
  const all = goals || [];

  const totalActive = all.length;
  const totalCompleted = all.filter(g => g.completed).length;

  // Weekly goals completed this week
  const startOfWeek = dayjs().startOf('week');
  const weeklyCompleted = all.filter(
    g => g.goal_type === 'weekly' && g.completed && dayjs(g.completed_at).isAfter(startOfWeek)
  ).length;

  // Dated goals due soon (within 7 days)
  const dueSoon = all.filter(
    g => g.goal_type === 'dated' && !g.completed && g.target_date &&
      dayjs(g.target_date).diff(dayjs(), 'day') <= 7 &&
      dayjs(g.target_date).diff(dayjs(), 'day') >= 0
  ).length;

  // Overdue
  const overdue = all.filter(
    g => g.goal_type === 'dated' && !g.completed && g.target_date &&
      dayjs(g.target_date).isBefore(dayjs(), 'day')
  ).length;

  return {
    totalActive,
    totalCompleted,
    weeklyCompleted,
    dueSoon,
    overdue,
    completionRate: totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0,
  };
}

function mapGoal(g: GoalRow) {
  return {
    id: g.id,
    userId: g.user_id,
    title: g.title,
    description: g.description,
    goalType: g.goal_type as 'weekly' | 'dated' | 'open',
    targetDate: g.target_date,
    targetCount: g.target_count,
    currentCount: g.current_count,
    completed: g.completed,
    completedAt: g.completed_at,
    isActive: g.is_active,
    createdAt: g.created_at,
  };
}
