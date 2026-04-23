import { supabase } from '../supabase';
import dayjs from 'dayjs';

export async function calculateMetrics(userId: string) {
  const now = dayjs();
  const today = now.startOf('day');

  const [
    { data: allTasks, error },
    { data: recoveryState },
    { data: failureLogs }
  ] = await Promise.all([
    supabase
      .from('task_instances')
      .select('date, completed')
      .eq('user_id', userId)
      .order('date', { ascending: true }),
    supabase
      .from('recovery_states')
      .select('start_time')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('failure_logs')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false }),
  ]);

  if (error) throw new Error(error.message);
  const tasks = allTasks || [];

  // Total completed
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Completion rate (trailing 30 days)
  const thirtyDaysAgo = today.subtract(30, 'day').toDate();
  const recentTasks = tasks.filter(
    (t) => dayjs(t.date).isAfter(thirtyDaysAgo) || dayjs(t.date).isSame(thirtyDaysAgo, 'day')
  );
  const recentCompleted = recentTasks.filter((t) => t.completed).length;
  const completionRate = recentTasks.length > 0
    ? Math.round((recentCompleted / recentTasks.length) * 1000) / 10
    : 0;

  // Weekly completion rate
  const sevenDaysAgo = today.subtract(7, 'day').toDate();
  const weeklyTasks = tasks.filter(
    (t) => dayjs(t.date).isAfter(sevenDaysAgo) || dayjs(t.date).isSame(sevenDaysAgo, 'day')
  );
  const weeklyCompleted = weeklyTasks.filter((t) => t.completed).length;
  const weeklyRate = weeklyTasks.length > 0
    ? Math.round((weeklyCompleted / weeklyTasks.length) * 1000) / 10
    : 0;

  // Calculate streaks (days where ALL tasks were completed)
  const tasksByDate = new Map<string, { total: number; completed: number }>();
  tasks.forEach((task) => {
    const dateKey = dayjs(task.date).format('YYYY-MM-DD');
    const entry = tasksByDate.get(dateKey) || { total: 0, completed: 0 };
    entry.total++;
    if (task.completed) entry.completed++;
    tasksByDate.set(dateKey, entry);
  });

  // Sort dates
  const sortedDates = Array.from(tasksByDate.keys()).sort();

  // Current streak (consecutive perfect days ending at today or yesterday)
  let currentStreak = 0;
  let checkDate = today;
  // Allow for today not being done yet - check if yesterday was perfect
  const todayKey = today.format('YYYY-MM-DD');
  const todayEntry = tasksByDate.get(todayKey);
  if (todayEntry && todayEntry.total === todayEntry.completed && todayEntry.total > 0) {
    currentStreak = 1;
    checkDate = today.subtract(1, 'day');
  } else {
    checkDate = today.subtract(1, 'day');
  }

  while (true) {
    const key = checkDate.format('YYYY-MM-DD');
    const entry = tasksByDate.get(key);
    if (entry && entry.total > 0 && entry.total === entry.completed) {
      currentStreak++;
      checkDate = checkDate.subtract(1, 'day');
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const entry = tasksByDate.get(sortedDates[i])!;
    if (entry.total > 0 && entry.total === entry.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Contribution heatmap data (last 365 days)
  const heatmapData: { date: string; count: number; total: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = today.subtract(i, 'day').format('YYYY-MM-DD');
    const entry = tasksByDate.get(d);
    heatmapData.push({
      date: d,
      count: entry?.completed || 0,
      total: entry?.total || 0,
    });
  }

  // Weekly trend data (last 12 weeks)
  const weeklyTrend: { week: string; rate: number; completed: number; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = today.subtract(i, 'week').startOf('week');
    const weekEnd = weekStart.add(6, 'day');
    const weekLabel = weekStart.format('MMM D');

    let wTotal = 0;
    let wCompleted = 0;
    let current = weekStart;
    while (current.isBefore(weekEnd) || current.isSame(weekEnd, 'day')) {
      const key = current.format('YYYY-MM-DD');
      const entry = tasksByDate.get(key);
      if (entry) {
        wTotal += entry.total;
        wCompleted += entry.completed;
      }
      current = current.add(1, 'day');
    }

    weeklyTrend.push({
      week: weekLabel,
      rate: wTotal > 0 ? Math.round((wCompleted / wTotal) * 100) : 0,
      completed: wCompleted,
      total: wTotal,
    });
  }

  const logs = failureLogs || [];

  const recoveryDays = recoveryState
    ? dayjs().diff(dayjs(recoveryState.start_time), 'day')
    : 0;

  // Failure frequency (per month)
  const failuresByMonth: Record<string, number> = {};
  logs.forEach((log) => {
    const month = dayjs(log.timestamp).format('YYYY-MM');
    failuresByMonth[month] = (failuresByMonth[month] || 0) + 1;
  });

  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    totalTasks,
    completionRate,
    weeklyRate,
    heatmapData,
    weeklyTrend,
    recovery: {
      currentDays: recoveryDays,
      totalFailures: logs.length,
      failuresByMonth,
      startTime: recoveryState?.start_time || null,
    },
  };
}
