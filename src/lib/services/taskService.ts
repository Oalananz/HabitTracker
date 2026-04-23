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

  if (error || !habits || habits.length === 0) return [];

  // Get existing task instances for this date in a single query
  const { data: existingTasks } = await supabase
    .from('task_instances')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('date', dateStr);

  const existingHabits = new Set(existingTasks?.map(t => t.habit_id) || []);
  const toInsert: Database['public']['Tables']['task_instances']['Insert'][] = [];
  const created: string[] = [];

  for (const habit of habits) {
    const rule = habit.repeat_rule as unknown as RepeatRule;

    if (!shouldGenerateForDate(rule, targetDate)) continue;

    // Skip if habit was created after this date
    if (dayjs(habit.created_at).startOf('day').isAfter(targetDate)) continue;

    if (!existingHabits.has(habit.id)) {
      toInsert.push({
        user_id: userId,
        habit_id: habit.id,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        priority: habit.priority,
        date: dateStr,
        source_type: 'habit',
      });
      created.push(habit.title);
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('task_instances').insert(toInsert);
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

  return (tasks || []).map(mapTask);
}

export async function getTaskSummaryForRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  const start = dayjs(startDate).startOf('day').format('YYYY-MM-DD');
  const end = dayjs(endDate).startOf('day').format('YYYY-MM-DD');

  const { data: rows, error } = await supabase
    .from('task_instances')
    .select('date, completed')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  if (error) throw new Error(error.message);

  const summary: Record<string, { total: number; completed: number; pending: number }> = {};

  for (const row of rows || []) {
    const key = dayjs(row.date).format('YYYY-MM-DD');
    if (!summary[key]) {
      summary[key] = { total: 0, completed: 0, pending: 0 };
    }

    summary[key].total += 1;
    if (row.completed) {
      summary[key].completed += 1;
    } else {
      summary[key].pending += 1;
    }
  }

  return summary;
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
