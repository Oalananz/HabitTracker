import { supabase } from '../supabase';
import type { Database } from '../database.types';

type HabitRow = Database['public']['Tables']['habits']['Row'];
type TaskRow = Database['public']['Tables']['task_instances']['Row'];

export async function createHabit(
  userId: string,
  data: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    repeatRule: { type: string; days?: number[] };
  }
) {
  const { data: habit, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      category: data.category || 'general',
      priority: data.priority || 'nominal',
      repeat_rule: data.repeatRule,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHabit(habit);
}

export async function updateHabit(
  habitId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    repeatRule?: { type: string; days?: number[] };
  }
) {
  const updateData: Database['public']['Tables']['habits']['Update'] = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.repeatRule !== undefined) updateData.repeat_rule = data.repeatRule;

  const { data: habit, error } = await supabase
    .from('habits')
    .update(updateData)
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHabit(habit);
}

export async function deactivateHabit(habitId: string, userId: string) {
  const { data: habit, error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHabit(habit);
}

export async function activateHabit(habitId: string, userId: string) {
  const { data: habit, error } = await supabase
    .from('habits')
    .update({ is_active: true })
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHabit(habit);
}

export async function getHabits(userId: string) {
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Get completed task counts for each habit
  const habitsWithCounts = await Promise.all(
    (habits || []).map(async (habit) => {
      const { count } = await supabase
        .from('task_instances')
        .select('*', { count: 'exact', head: true })
        .eq('habit_id', habit.id)
        .eq('completed', true);

      return {
        ...mapHabit(habit),
        _count: { tasks: count || 0 },
      };
    })
  );

  return habitsWithCounts;
}

export async function getHabit(habitId: string, userId: string) {
  const { data: habit, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);

  const { data: tasks } = await supabase
    .from('task_instances')
    .select('*')
    .eq('habit_id', habitId)
    .order('date', { ascending: false })
    .limit(30);

  return {
    ...mapHabit(habit),
    tasks: (tasks || []).map(mapTask),
  };
}

export async function deleteHabit(habitId: string, userId: string) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// Map snake_case DB columns to camelCase for frontend
function mapHabit(h: HabitRow) {
  return {
    id: h.id,
    userId: h.user_id,
    title: h.title,
    description: h.description,
    category: h.category,
    priority: h.priority,
    repeatRule: h.repeat_rule,
    isActive: h.is_active,
    createdAt: h.created_at,
  };
}

function mapTask(t: TaskRow) {
  return {
    id: t.id,
    userId: t.user_id,
    habitId: t.habit_id,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    date: t.date,
    completed: t.completed,
    completedAt: t.completed_at,
    sourceType: t.source_type,
    createdAt: t.created_at,
  };
}
