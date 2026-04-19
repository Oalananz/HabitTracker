import { supabase } from '../supabase';
import type { Database } from '../database.types';
import dayjs from 'dayjs';

type TaskRow = Database['public']['Tables']['task_instances']['Row'];

interface RepeatRule {
  type: 'daily' | 'weekdays' | 'weekends' | 'custom';
  days?: number[]; // 0=Sun, 1=Mon, ... 6=Sat
}

function shouldGenerateForDate(rule: RepeatRule, date: dayjs.Dayjs): boolean {
  const dayOfWeek = date.day(); // 0=Sun, 6=Sat
  switch (rule.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return rule.days?.includes(dayOfWeek) ?? false;
    default:
      return false;
  }
}

export async function generateTasksForDate(userId: string, date: string) {
  const targetDate = dayjs(date).startOf('day');
  const dateStr = targetDate.format('YYYY-MM-DD');

  // Get all active habits for this user
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !habits) return [];

  const created: string[] = [];

  for (const habit of habits) {
    const rule = habit.repeat_rule as unknown as RepeatRule;

    if (!shouldGenerateForDate(rule, targetDate)) continue;

    // Skip if habit was created after this date
    if (dayjs(habit.created_at).startOf('day').isAfter(targetDate)) continue;

    // Check if task already exists for this habit+date
    const { data: existing } = await supabase
      .from('task_instances')
      .select('id')
      .eq('habit_id', habit.id)
      .eq('date', dateStr)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase
        .from('task_instances')
        .insert({
          user_id: userId,
          habit_id: habit.id,
          title: habit.title,
          description: habit.description,
          category: habit.category,
          priority: habit.priority,
          date: dateStr,
          source_type: 'habit',
        });

      if (!insertError) {
        created.push(habit.title);
      }
    }
  }

  return created;
}

export async function generateMissingTasks(
  userId: string,
  startDate: string,
  endDate: string
) {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).startOf('day');
  const allCreated: { date: string; tasks: string[] }[] = [];

  let current = start;
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dateStr = current.format('YYYY-MM-DD');
    const created = await generateTasksForDate(userId, dateStr);
    if (created.length > 0) {
      allCreated.push({ date: dateStr, tasks: created });
    }
    current = current.add(1, 'day');
  }

  return allCreated;
}

export async function getTasksForDate(userId: string, date: string) {
  const dateStr = dayjs(date).startOf('day').format('YYYY-MM-DD');

  const { data: tasks, error } = await supabase
    .from('task_instances')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .order('completed', { ascending: true })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  // Fetch associated habit info for habit-generated tasks
  const habitIds = [...new Set((tasks || []).filter(t => t.habit_id).map(t => t.habit_id as string))];
  let habitsMap: Record<string, { id: string; title: string; repeat_rule: Database['public']['Tables']['habits']['Row']['repeat_rule'] }> = {};

  if (habitIds.length > 0) {
    const { data: habits } = await supabase
      .from('habits')
      .select('id, title, repeat_rule')
      .in('id', habitIds);

    if (habits) {
      habitsMap = Object.fromEntries(habits.map(h => [h.id, h]));
    }
  }

  return (tasks || []).map(t => ({
    ...mapTask(t),
    habit: t.habit_id && habitsMap[t.habit_id]
      ? {
          id: habitsMap[t.habit_id].id,
          title: habitsMap[t.habit_id].title,
          repeatRule: habitsMap[t.habit_id].repeat_rule,
        }
      : null,
  }));
}

export async function completeTask(taskId: string, userId: string) {
  const { data: task, error } = await supabase
    .from('task_instances')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(task);
}

export async function uncompleteTask(taskId: string, userId: string) {
  const { data: task, error } = await supabase
    .from('task_instances')
    .update({
      completed: false,
      completed_at: null,
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(task);
}

export async function createManualTask(
  userId: string,
  data: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    date: string;
  }
) {
  const dateStr = dayjs(data.date).startOf('day').format('YYYY-MM-DD');

  const { data: task, error } = await supabase
    .from('task_instances')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      category: data.category || 'general',
      priority: data.priority || 'nominal',
      date: dateStr,
      source_type: 'manual',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(task);
}

export async function updateTask(
  taskId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    date?: string;
  }
) {
  const updateData: Database['public']['Tables']['task_instances']['Update'] = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.date !== undefined) updateData.date = dayjs(data.date).startOf('day').format('YYYY-MM-DD');

  const { data: task, error } = await supabase
    .from('task_instances')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(task);
}

export async function deleteTask(taskId: string, userId: string) {
  // Only allow deleting manual tasks
  const { data: task, error: fetchError } = await supabase
    .from('task_instances')
    .select('id, source_type')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !task) throw new Error('Task not found');
  if (task.source_type !== 'manual') {
    throw new Error('Cannot delete habit-generated tasks');
  }

  const { error } = await supabase
    .from('task_instances')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

// Map snake_case DB columns to camelCase for frontend
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
