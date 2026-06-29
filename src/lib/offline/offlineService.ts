/**
 * Offline-first data service.
 * Wraps all CRUD operations with local-first logic:
 * - Reads: local DB first → return immediately → background server fetch → update cache
 * - Writes: update local DB → enqueue sync → return success
 */
import { offlineDB, setMeta, type LocalTask, type LocalHabit, type LocalGoal, type LocalJourney, type LocalFailure, type LocalPlan, type LocalPrayerTimes, type LocalRecoveryState } from './db';
import { enqueueSync } from './syncQueue';
import { networkStatus } from './networkStatus';

// ─── UUID generation ────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Tasks ──────────────────────────────────────────────────────────

export async function getLocalTasks(date: string): Promise<LocalTask[]> {
  return offlineDB.tasks.where('date').equals(date).toArray();
}

export async function cacheTasksFromServer(tasks: LocalTask[]): Promise<void> {
  if (!tasks.length) return;
  // Use bulkPut to upsert — only update non-dirty records
  for (const task of tasks) {
    const existing = await offlineDB.tasks.get(task.id);
    if (existing && existing._dirty) continue; // Don't overwrite local edits
    await offlineDB.tasks.put({ ...task, _dirty: false });
  }
}

export async function localCreateTask(data: {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  date: string;
  lifeArea?: string | null;
}): Promise<LocalTask> {
  const now = new Date().toISOString();
  const task: LocalTask = {
    id: genId(),
    habitId: null,
    title: data.title,
    description: data.description || null,
    category: data.category || null,
    priority: data.priority || 'medium',
    date: data.date,
    completed: false,
    completedAt: null,
    sourceType: 'manual',
    lifeArea: data.lifeArea ?? null,
    createdAt: now,
    updatedAt: now,
    _dirty: true,
  };

  await offlineDB.tasks.add(task);
  await enqueueSync('tasks', 'create', {
    action: 'create',
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    date: data.date,
    lifeArea: data.lifeArea ?? null,
    _localId: task.id,
  }, '/api/tasks');

  return task;
}

export async function localUpdateTask(
  taskId: string,
  data: { title?: string; description?: string; category?: string; priority?: string; date?: string; lifeArea?: string | null }
): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.tasks.update(taskId, { ...data, updatedAt: now, _dirty: true });
  await enqueueSync('tasks', 'update', {
    action: 'update',
    taskId,
    ...data,
  }, '/api/tasks');
}

export async function localCompleteTask(taskId: string): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.tasks.update(taskId, {
    completed: true,
    completedAt: now,
    updatedAt: now,
    _dirty: true,
  });
  await enqueueSync('tasks', 'complete', {
    action: 'complete',
    taskId,
  }, '/api/tasks');
}

export async function localUncompleteTask(taskId: string): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.tasks.update(taskId, {
    completed: false,
    completedAt: null,
    updatedAt: now,
    _dirty: true,
  });
  await enqueueSync('tasks', 'uncomplete', {
    action: 'uncomplete',
    taskId,
  }, '/api/tasks');
}

export async function localDeleteTask(taskId: string): Promise<void> {
  await offlineDB.tasks.delete(taskId);
  await enqueueSync('tasks', 'delete', {
    action: 'delete',
    taskId,
  }, '/api/tasks');
}

// ─── Habits ─────────────────────────────────────────────────────────

export async function getLocalHabits(): Promise<LocalHabit[]> {
  return offlineDB.habits.toArray();
}

export async function cacheHabitsFromServer(habits: LocalHabit[]): Promise<void> {
  for (const habit of habits) {
    const existing = await offlineDB.habits.get(habit.id);
    if (existing && existing._dirty) continue;
    await offlineDB.habits.put({ ...habit, _dirty: false });
  }
}

export async function localCreateHabit(data: {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  repeatRule: { type: string; days?: number[] };
  lifeArea?: string | null;
}): Promise<LocalHabit> {
  const now = new Date().toISOString();
  const habit: LocalHabit = {
    id: genId(),
    title: data.title,
    description: data.description || null,
    category: data.category || 'general',
    priority: data.priority || 'medium',
    repeatRule: data.repeatRule,
    lifeArea: data.lifeArea ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    _dirty: true,
  };

  await offlineDB.habits.add(habit);
  await enqueueSync('habits', 'create', {
    action: 'create',
    ...data,
    _localId: habit.id,
  }, '/api/habits');

  return habit;
}

export async function localUpdateHabit(
  habitId: string,
  data: { title?: string; description?: string; category?: string; priority?: string; repeatRule?: { type: string; days?: number[] }; lifeArea?: string | null }
): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.habits.update(habitId, { ...data, updatedAt: now, _dirty: true });
  await enqueueSync('habits', 'update', {
    action: 'update',
    habitId,
    ...data,
  }, '/api/habits');
}

export async function localToggleHabit(habitId: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.habits.update(habitId, { isActive: !isActive, updatedAt: now, _dirty: true });
  await enqueueSync('habits', 'toggle', {
    action: isActive ? 'deactivate' : 'activate',
    habitId,
  }, '/api/habits');
}

export async function localDeleteHabit(habitId: string): Promise<void> {
  await offlineDB.habits.delete(habitId);
  await enqueueSync('habits', 'delete', {
    action: 'delete',
    habitId,
  }, '/api/habits');
}

// ─── Goals ──────────────────────────────────────────────────────────

export async function getLocalGoals(type?: string): Promise<LocalGoal[]> {
  if (type) {
    return offlineDB.goals.where('goalType').equals(type).toArray();
  }
  return offlineDB.goals.toArray();
}

export async function cacheGoalsFromServer(goals: LocalGoal[]): Promise<void> {
  for (const goal of goals) {
    const existing = await offlineDB.goals.get(goal.id);
    if (existing && existing._dirty) continue;
    await offlineDB.goals.put({ ...goal, _dirty: false });
  }
}

export async function localCreateGoal(data: {
  title: string;
  description?: string;
  goalType: string;
  targetDate?: string;
  targetCount?: number;
  lifeArea?: string | null;
}): Promise<LocalGoal> {
  const now = new Date().toISOString();
  const goal: LocalGoal = {
    id: genId(),
    title: data.title,
    description: data.description || null,
    goalType: data.goalType as LocalGoal['goalType'],
    targetDate: data.targetDate || null,
    targetCount: data.targetCount || 1,
    currentCount: 0,
    completed: false,
    completedAt: null,
    lifeArea: data.lifeArea ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    _dirty: true,
  };

  await offlineDB.goals.add(goal);
  await enqueueSync('goals', 'create', {
    action: 'create',
    ...data,
    _localId: goal.id,
  }, '/api/goals');

  return goal;
}

export async function localUpdateGoal(
  goalId: string,
  data: { title?: string; description?: string; targetDate?: string; targetCount?: number; currentCount?: number; lifeArea?: string | null }
): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.goals.update(goalId, { ...data, updatedAt: now, _dirty: true });
  await enqueueSync('goals', 'update', {
    action: 'update',
    goalId,
    ...data,
  }, '/api/goals');
}

export async function localToggleGoalComplete(goalId: string): Promise<void> {
  const goal = await offlineDB.goals.get(goalId);
  if (!goal) return;
  const now = new Date().toISOString();
  await offlineDB.goals.update(goalId, {
    completed: !goal.completed,
    completedAt: goal.completed ? null : now,
    updatedAt: now,
    _dirty: true,
  });
  await enqueueSync('goals', 'toggle', {
    action: 'toggle',
    goalId,
  }, '/api/goals');
}

export async function localIncrementGoal(goalId: string, amount: number = 1): Promise<void> {
  const goal = await offlineDB.goals.get(goalId);
  if (!goal) return;
  const newCount = goal.currentCount + amount;
  const now = new Date().toISOString();
  await offlineDB.goals.update(goalId, {
    currentCount: newCount,
    completed: newCount >= goal.targetCount,
    completedAt: newCount >= goal.targetCount ? now : null,
    updatedAt: now,
    _dirty: true,
  });
  await enqueueSync('goals', 'increment', {
    action: 'increment',
    goalId,
    amount,
  }, '/api/goals');
}

export async function localDeleteGoal(goalId: string): Promise<void> {
  await offlineDB.goals.delete(goalId);
  await enqueueSync('goals', 'delete', {
    action: 'delete',
    goalId,
  }, '/api/goals');
}

// ─── Recovery Journeys ──────────────────────────────────────────────

export async function getLocalJourneys(): Promise<LocalJourney[]> {
  return offlineDB.journeys.toArray();
}

export async function getLocalRecoveryState(): Promise<LocalRecoveryState | undefined> {
  const all = await offlineDB.recoveryState.toArray();
  return all[0];
}

export async function getLocalFailures(): Promise<LocalFailure[]> {
  return offlineDB.failures.orderBy('timestamp').reverse().toArray();
}

export async function cacheJourneysFromServer(journeys: LocalJourney[], recovery: LocalRecoveryState | null): Promise<void> {
  for (const journey of journeys) {
    const existing = await offlineDB.journeys.get(journey.id);
    if (existing && existing._dirty) continue;
    await offlineDB.journeys.put({ ...journey, _dirty: false });
  }
  if (recovery) {
    await offlineDB.recoveryState.put(recovery);
  }
}

export async function cacheFailuresFromServer(failures: LocalFailure[]): Promise<void> {
  for (const failure of failures) {
    const existing = await offlineDB.failures.get(failure.id);
    if (existing && existing._dirty) continue;
    await offlineDB.failures.put({ ...failure, _dirty: false });
  }
}

export async function localCreateJourney(data: {
  title: string;
  description?: string;
  startTime: string;
}): Promise<LocalJourney> {
  const now = new Date().toISOString();
  const journey: LocalJourney = {
    id: genId(),
    title: data.title,
    description: data.description || null,
    startTime: data.startTime,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    failureCount: 0,
    _dirty: true,
  };

  await offlineDB.journeys.add(journey);
  await enqueueSync('journeys', 'createJourney', {
    action: 'createJourney',
    ...data,
    _localId: journey.id,
  }, '/api/recovery');

  return journey;
}

export async function localUpdateJourney(
  journeyId: string,
  data: { title?: string; description?: string; startTime?: string }
): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.journeys.update(journeyId, { ...data, updatedAt: now, _dirty: true });
  await enqueueSync('journeys', 'updateJourney', {
    action: 'updateJourney',
    journeyId,
    ...data,
  }, '/api/recovery');
}

export async function localDeleteJourney(journeyId: string): Promise<void> {
  await offlineDB.journeys.delete(journeyId);
  await enqueueSync('journeys', 'deleteJourney', {
    action: 'deleteJourney',
    journeyId,
  }, '/api/recovery');
}

export async function localRecordJourneyFailure(journeyId: string, note?: string): Promise<LocalFailure> {
  const now = new Date().toISOString();
  const failure: LocalFailure = {
    id: genId(),
    journeyId,
    timestamp: now,
    note: note || null,
    createdAt: now,
    _dirty: true,
  };

  // Update journey failure count
  const journey = await offlineDB.journeys.get(journeyId);
  if (journey) {
    await offlineDB.journeys.update(journeyId, {
      failureCount: journey.failureCount + 1,
      updatedAt: now,
      _dirty: true,
    });
  }

  await offlineDB.failures.add(failure);
  await enqueueSync('failures', 'fail', {
    action: 'fail',
    journeyId,
    note,
    _localId: failure.id,
  }, '/api/recovery');

  return failure;
}

export async function localResetJourney(journeyId: string, clearLogs: boolean): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.journeys.update(journeyId, {
    failureCount: 0,
    startTime: now,
    updatedAt: now,
    _dirty: true,
  });

  if (clearLogs) {
    const failures = await offlineDB.failures.where('journeyId').equals(journeyId).toArray();
    await offlineDB.failures.bulkDelete(failures.map((f) => f.id));
  }

  await enqueueSync('journeys', 'reset', {
    action: 'reset',
    journeyId,
    clearLogs,
  }, '/api/recovery');
}

// ─── Plans ──────────────────────────────────────────────────────────

export async function getLocalPlans(date: string): Promise<LocalPlan[]> {
  return offlineDB.plans.where('occurrenceDate').equals(date).toArray();
}

export async function getLocalPlansByRange(startDate: string, endDate: string): Promise<LocalPlan[]> {
  return offlineDB.plans
    .where('occurrenceDate')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function cachePlansFromServer(plans: LocalPlan[]): Promise<void> {
  for (const plan of plans) {
    const existing = await offlineDB.plans.get(plan.id);
    if (existing && existing._dirty) continue;
    await offlineDB.plans.put({ ...plan, _dirty: false });
  }
}

export async function localCreatePlan(data: {
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
}, userId: string): Promise<LocalPlan> {
  const now = new Date().toISOString();
  const plan: LocalPlan = {
    id: genId(),
    userId,
    title: data.title,
    description: data.description || null,
    planType: (data.planType || 'daily') as LocalPlan['planType'],
    status: (data.status || 'planned') as LocalPlan['status'],
    priority: data.priority || 'medium',
    category: data.category || null,
    notes: data.notes || null,
    startDate: data.startDate,
    startTime: data.startTime || null,
    endDate: data.endDate || null,
    endTime: data.endTime || null,
    dayOfWeek: data.dayOfWeek || null,
    occurrenceDate: data.startDate,
    occurrenceKey: `${data.startDate}_${genId().slice(0, 8)}`,
    prayerBlock: (data.prayerBlock || null) as LocalPlan['prayerBlock'],
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    _dirty: true,
  };

  await offlineDB.plans.add(plan);
  await enqueueSync('plans', 'create', {
    action: 'create',
    ...data,
    _localId: plan.id,
  }, '/api/plans');

  return plan;
}

export async function localUpdatePlan(
  planId: string,
  data: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.plans.update(planId, { ...data, updatedAt: now, _dirty: true });
  await enqueueSync('plans', 'update', {
    action: 'update',
    planId,
    ...data,
  }, '/api/plans');
}

export async function localDeletePlan(planId: string): Promise<void> {
  await offlineDB.plans.delete(planId);
  await enqueueSync('plans', 'delete', {
    action: 'delete',
    planId,
  }, '/api/plans');
}

export async function localAssignPlanToPrayerBlock(planId: string, prayerBlock: string | null): Promise<void> {
  const now = new Date().toISOString();
  await offlineDB.plans.update(planId, { prayerBlock: prayerBlock as LocalPlan['prayerBlock'], updatedAt: now, _dirty: true });
  await enqueueSync('plans', 'assignPrayer', {
    action: 'assignPrayer',
    planId,
    prayerBlock,
  }, '/api/plans');
}

// ─── Prayer Times ───────────────────────────────────────────────────

export async function getLocalPrayerTimes(date: string): Promise<LocalPrayerTimes | undefined> {
  const results = await offlineDB.prayerTimes.where('date').equals(date).toArray();
  return results[0];
}

export async function cachePrayerTimesFromServer(prayerTimes: LocalPrayerTimes): Promise<void> {
  await offlineDB.prayerTimes.put(prayerTimes);
}

// ─── Full Data Pull (for initial load / sync) ───────────────────────

export async function pullAllDataFromServer(): Promise<boolean> {
  if (!networkStatus.isOnline) return false;

  try {
    // Fetch all data endpoints in parallel
    const [
      tasksRes,
      habitsRes,
      goalsRes,
      journeysRes,
      failuresRes,
    ] = await Promise.allSettled([
      fetch('/api/tasks?date=' + new Date().toISOString().split('T')[0]),
      fetch('/api/habits'),
      fetch('/api/goals'),
      fetch('/api/recovery'),
      fetch('/api/failures'),
    ]);

    // Cache tasks
    if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
      const data = await tasksRes.value.json();
      if (data.tasks) await cacheTasksFromServer(data.tasks);
    }

    // Cache habits
    if (habitsRes.status === 'fulfilled' && habitsRes.value.ok) {
      const data = await habitsRes.value.json();
      if (data.habits) await cacheHabitsFromServer(data.habits);
    }

    // Cache goals
    if (goalsRes.status === 'fulfilled' && goalsRes.value.ok) {
      const data = await goalsRes.value.json();
      if (data.goals) await cacheGoalsFromServer(data.goals);
    }

    // Cache journeys + recovery
    if (journeysRes.status === 'fulfilled' && journeysRes.value.ok) {
      const data = await journeysRes.value.json();
      if (data.journeys) await cacheJourneysFromServer(data.journeys, data.recovery || null);
    }

    // Cache failures
    if (failuresRes.status === 'fulfilled' && failuresRes.value.ok) {
      const data = await failuresRes.value.json();
      if (data.failures) await cacheFailuresFromServer(data.failures);
    }

    await setMeta('lastSyncAt', new Date().toISOString());
    return true;
  } catch (err) {
    console.error('[offlineService] pullAllDataFromServer failed:', err);
    return false;
  }
}
