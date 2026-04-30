import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let authCheckPromise: Promise<void> | null = null;
const generatedTaskDates = new Set<string>();

function applySummaryDelta(summary: TaskSummary | null, totalDelta: number, completedDelta: number) {
  if (!summary) return summary;

  const total = Math.max(0, summary.total + totalDelta);
  const completed = Math.max(0, summary.completed + completedDelta);

  return {
    ...summary,
    total,
    completed,
    pending: Math.max(0, total - completed),
  };
}

interface User {
  id: string;
  email: string;
  username: string;
  statusMessage?: string;
}

interface Task {
  id: string;
  habitId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  date: string;
  completed: boolean;
  completedAt: string | null;
  sourceType: string;
  createdAt: string;
  habit?: { id: string; title: string; repeatRule: unknown } | null;
}

interface Habit {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  repeatRule: { type: string; days?: number[] };
  isActive: boolean;
  createdAt: string;
  _count?: { tasks: number };
}

interface RecoveryJourney {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  isActive: boolean;
  createdAt: string;
  failureCount: number;
}

interface RecoveryState {
  id: string;
  startTime: string;
  updatedAt: string;
  failureCount: number;
}

interface FailureLog {
  id: string;
  journeyId: string | null;
  timestamp: string;
  note: string | null;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  goalType: 'weekly' | 'dated' | 'open';
  targetDate: string | null;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  completedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface GoalsSummary {
  totalActive: number;
  totalCompleted: number;
  weeklyCompleted: number;
  dueSoon: number;
  overdue: number;
  completionRate: number;
}

interface Plan {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  planType: 'daily' | 'weekly' | 'monthly' | 'custom';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: string;
  category: string | null;
  notes: string | null;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  dayOfWeek: string | null;
  prayerBlock: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlansSummary {
  totalPlans: number;
  todayCount: number;
  todayCompleted: number;
  weekCount: number;
  weekCompleted: number;
  monthCount: number;
  monthCompleted: number;
  overdueCount: number;
  upcomingCount: number;
}

interface PrayerTimesData {
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

interface DashboardMetrics {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  totalTasks: number;
  completionRate: number;
  weeklyRate: number;
  heatmapData: { date: string; count: number; total: number }[];
  weeklyTrend: { week: string; rate: number; completed: number; total: number }[];
  recovery: {
    currentDays: number;
    totalFailures: number;
    failuresByMonth: Record<string, number>;
    startTime: string | null;
  };
}

interface TaskSummary {
  total: number;
  completed: number;
  pending: number;
  date: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthLoading: boolean;
  authInitialized: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: (options?: { force?: boolean; background?: boolean }) => Promise<void>;

  // Tasks
  tasks: Task[];
  taskSummary: TaskSummary | null;
  isTasksLoading: boolean;
  fetchTasks: (date: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  createTask: (data: { title: string; description?: string; category?: string; priority?: string; date: string }) => Promise<void>;
  updateTask: (taskId: string, data: { title?: string; description?: string; category?: string; priority?: string; date?: string }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Habits
  habits: Habit[];
  isHabitsLoading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (data: { title: string; description?: string; category?: string; priority?: string; repeatRule: { type: string; days?: number[] } }) => Promise<void>;
  updateHabit: (habitId: string, data: { title?: string; description?: string; category?: string; priority?: string; repeatRule?: { type: string; days?: number[] } }) => Promise<void>;
  toggleHabit: (habitId: string, isActive: boolean) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;

  // Recovery Journeys
  journeys: RecoveryJourney[];
  recovery: RecoveryState | null;
  failures: FailureLog[];
  isRecoveryLoading: boolean;
  fetchJourneys: () => Promise<void>;
  createJourney: (data: { title: string; description?: string; startTime: string }) => Promise<void>;
  updateJourney: (journeyId: string, data: { title?: string; description?: string; startTime?: string }) => Promise<void>;
  deleteJourney: (journeyId: string) => Promise<void>;
  recordJourneyFailure: (journeyId: string, note?: string) => Promise<void>;
  resetJourney: (journeyId: string, clearLogs: boolean) => Promise<void>;
  fetchRecovery: () => Promise<void>;
  fetchFailures: () => Promise<void>;
  recordFailure: () => Promise<void>;
  resetRecovery: (clearLogs: boolean) => Promise<void>;
  setStartTime: (startTime: string) => Promise<void>;

  // Goals
  goals: Goal[];
  goalsSummary: GoalsSummary | null;
  isGoalsLoading: boolean;
  fetchGoals: (type?: string) => Promise<void>;
  fetchGoalsSummary: () => Promise<void>;
  createGoal: (data: { title: string; description?: string; goalType: string; targetDate?: string; targetCount?: number }) => Promise<void>;
  updateGoal: (goalId: string, data: { title?: string; description?: string; targetDate?: string; targetCount?: number; currentCount?: number }) => Promise<void>;
  toggleGoalComplete: (goalId: string) => Promise<void>;
  incrementGoal: (goalId: string, amount?: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;

  // Dashboard
  metrics: DashboardMetrics | null;
  isMetricsLoading: boolean;
  fetchMetrics: () => Promise<void>;

  // Planner
  plans: Plan[];
  plansSummary: PlansSummary | null;
  prayerTimes: PrayerTimesData | null;
  isPlansLoading: boolean;
  isPrayerTimesLoading: boolean;
  plannerDate: string;
  setPlannerDate: (date: string) => void;
  fetchPlans: (date: string) => Promise<void>;
  fetchPlansByRange: (startDate: string, endDate: string) => Promise<void>;
  fetchWeeklyPlans: (weekOf?: string) => Promise<void>;
  fetchMonthlyPlans: (month?: string) => Promise<void>;
  fetchPlansSummary: () => Promise<void>;
  createPlan: (data: { title: string; description?: string; planType?: string; status?: string; priority?: string; category?: string; notes?: string; startDate: string; startTime?: string; endDate?: string; endTime?: string; dayOfWeek?: string; prayerBlock?: string }) => Promise<void>;
  updatePlan: (planId: string, data: { title?: string; description?: string; planType?: string; status?: string; priority?: string; category?: string; notes?: string; startDate?: string; startTime?: string | null; endDate?: string; endTime?: string | null; dayOfWeek?: string | null; prayerBlock?: string | null }) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  assignPlanToPrayerBlock: (planId: string, prayerBlock: string | null) => Promise<void>;
  fetchPrayerTimes: (date: string) => Promise<void>;
  fetchPrayerTimesFromLocation: (date: string, latitude: number, longitude: number) => Promise<void>;
  setManualPrayerTimes: (date: string, times: { fajr?: string; dhuhr?: string; asr?: string; maghrib?: string; isha?: string }) => Promise<void>;

  // UI
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthLoading: true,
  authInitialized: false,
  setUser: (user) => set({ user }),

  login: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    await get().checkAuth({ force: true, background: true });
  },

  register: async (email, username, password) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw new Error(error.message);
    if (data.session) {
      await get().checkAuth({ force: true, background: true });
    } else {
      throw new Error('Check your email for the confirmation link.');
    }
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    generatedTaskDates.clear();
    set({ user: null, isAuthLoading: false, authInitialized: true });
  },

  checkAuth: async (options) => {
    const force = options?.force ?? false;
    const background = options?.background ?? false;
    const { authInitialized } = get();

    if (authCheckPromise) {
      return authCheckPromise;
    }

    if (authInitialized && !force) {
      return;
    }

    if (!background) {
      set({ isAuthLoading: true });
    }

    authCheckPromise = (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        set({ user: data.user || null, isAuthLoading: false, authInitialized: true });
      } catch {
        set({ user: null, isAuthLoading: false, authInitialized: true });
      }
    })();

    try {
      await authCheckPromise;
    } finally {
      authCheckPromise = null;
    }
  },

  // Tasks
  tasks: [],
  taskSummary: null,
  isTasksLoading: false,

  fetchTasks: async (date) => {
    const hasCachedDateData = get().taskSummary?.date === date;
    if (!hasCachedDateData) {
      set({ isTasksLoading: true });
    }
    try {
      if (!generatedTaskDates.has(date)) {
        generatedTaskDates.add(date);
        const generateRes = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate', date }),
        });

        if (!generateRes.ok) {
          generatedTaskDates.delete(date);
        }
      }

      const res = await fetch(`/api/tasks?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        set({ tasks: data.tasks, taskSummary: data.summary, isTasksLoading: false });
      } else {
        set({ isTasksLoading: false });
      }
    } catch {
      set({ isTasksLoading: false });
    }
  },

  completeTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevSummary = get().taskSummary;
    const current = prevTasks.find((t) => t.id === taskId);

    if (current && !current.completed) {
      set({
        tasks: prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t
        ),
        taskSummary: applySummaryDelta(prevSummary, 0, 1),
      });
    }

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', taskId }),
    });

    if (!res.ok) {
      set({ tasks: prevTasks, taskSummary: prevSummary });
      const err = await res.json().catch(() => ({ error: 'Failed to complete task' }));
      throw new Error(err.error || 'Failed to complete task');
    }

    const data = await res.json();
    if (data?.task) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data.task } : t)),
      }));
    }
  },

  uncompleteTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevSummary = get().taskSummary;
    const current = prevTasks.find((t) => t.id === taskId);

    if (current && current.completed) {
      set({
        tasks: prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, completed: false, completedAt: null }
            : t
        ),
        taskSummary: applySummaryDelta(prevSummary, 0, -1),
      });
    }

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'uncomplete', taskId }),
    });

    if (!res.ok) {
      set({ tasks: prevTasks, taskSummary: prevSummary });
      const err = await res.json().catch(() => ({ error: 'Failed to uncomplete task' }));
      throw new Error(err.error || 'Failed to uncomplete task');
    }

    const data = await res.json();
    if (data?.task) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data.task } : t)),
      }));
    }
  },

  createTask: async (data) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    const payload = await res.json();
    const createdTask = payload?.task;
    const { selectedDate } = get();

    if (createdTask && createdTask.date === selectedDate) {
      set((state) => ({
        tasks: [createdTask, ...state.tasks],
        taskSummary: applySummaryDelta(state.taskSummary, 1, createdTask.completed ? 1 : 0),
      }));
    }
  },

  updateTask: async (taskId, data) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', taskId, ...data }),
    });
    const { selectedDate, fetchTasks } = get();
    await fetchTasks(selectedDate);
  },

  deleteTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevSummary = get().taskSummary;
    const toDelete = prevTasks.find((t) => t.id === taskId);

    if (toDelete) {
      set({
        tasks: prevTasks.filter((t) => t.id !== taskId),
        taskSummary: applySummaryDelta(prevSummary, -1, toDelete.completed ? -1 : 0),
      });
    }

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', taskId }),
    });

    if (!res.ok) {
      set({ tasks: prevTasks, taskSummary: prevSummary });
      const err = await res.json();
      throw new Error(err.error);
    }
  },

  // Habits
  habits: [],
  isHabitsLoading: false,

  fetchHabits: async () => {
    set({ isHabitsLoading: true });
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (res.ok) set({ habits: data.habits, isHabitsLoading: false });
    } catch {
      set({ isHabitsLoading: false });
    }
  },

  createHabit: async (data) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    generatedTaskDates.clear();
    await get().fetchHabits();
  },

  updateHabit: async (habitId, data) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', habitId, ...data }),
    });
    generatedTaskDates.clear();
    await get().fetchHabits();
  },

  toggleHabit: async (habitId, isActive) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isActive ? 'deactivate' : 'activate',
        habitId,
      }),
    });
    generatedTaskDates.clear();
    await get().fetchHabits();
  },

  deleteHabit: async (habitId) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', habitId }),
    });
    generatedTaskDates.clear();
    await get().fetchHabits();
  },

  // Recovery Journeys
  journeys: [],
  recovery: null,
  failures: [],
  isRecoveryLoading: false,

  fetchJourneys: async () => {
    set({ isRecoveryLoading: true });
    try {
      const res = await fetch('/api/recovery');
      const data = await res.json();
      if (res.ok) {
        set({
          journeys: data.journeys || [],
          recovery: data.recovery || null,
          isRecoveryLoading: false,
        });
      }
    } catch {
      set({ isRecoveryLoading: false });
    }
  },

  createJourney: async (data) => {
    const res = await fetch('/api/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createJourney', ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await get().fetchJourneys();
  },

  updateJourney: async (journeyId, data) => {
    await fetch('/api/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateJourney', journeyId, ...data }),
    });
    await get().fetchJourneys();
  },

  deleteJourney: async (journeyId) => {
    await fetch('/api/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteJourney', journeyId }),
    });
    await get().fetchJourneys();
  },

  recordJourneyFailure: async (journeyId, note) => {
    await fetch('/api/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fail', journeyId, note }),
    });
    await get().fetchJourneys();
  },

  resetJourney: async (journeyId, clearLogs) => {
    await fetch('/api/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', journeyId, clearLogs }),
    });
    await get().fetchJourneys();
  },

  // Legacy recovery compat
  fetchRecovery: async () => {
    await get().fetchJourneys();
  },

  fetchFailures: async () => {
    try {
      const res = await fetch('/api/failures');
      const data = await res.json();
      if (res.ok) set({ failures: data.failures });
    } catch {
      // silently fail
    }
  },

  recordFailure: async () => {
    // Legacy - no-op, use recordJourneyFailure
  },

  resetRecovery: async () => {
    // Legacy - no-op, use resetJourney
  },

  setStartTime: async () => {
    // Legacy - no-op, use updateJourney
  },

  // Goals
  goals: [],
  goalsSummary: null,
  isGoalsLoading: false,

  fetchGoals: async (type) => {
    set({ isGoalsLoading: true });
    try {
      const url = type ? `/api/goals?type=${type}` : '/api/goals';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) set({ goals: data.goals, isGoalsLoading: false });
    } catch {
      set({ isGoalsLoading: false });
    }
  },

  fetchGoalsSummary: async () => {
    try {
      const res = await fetch('/api/goals?summary=true');
      const data = await res.json();
      if (res.ok) set({ goalsSummary: data.summary });
    } catch {
      // silently fail
    }
  },

  createGoal: async (data) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await get().fetchGoals();
  },

  updateGoal: async (goalId, data) => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', goalId, ...data }),
    });
    await get().fetchGoals();
  },

  toggleGoalComplete: async (goalId) => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', goalId }),
    });
    await get().fetchGoals();
  },

  incrementGoal: async (goalId, amount = 1) => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'increment', goalId, amount }),
    });
    await get().fetchGoals();
  },

  deleteGoal: async (goalId) => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', goalId }),
    });
    await get().fetchGoals();
  },

  // Dashboard
  metrics: null,
  isMetricsLoading: false,

  fetchMetrics: async () => {
    set({ isMetricsLoading: true });
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (res.ok) set({ metrics: data.metrics, isMetricsLoading: false });
    } catch {
      set({ isMetricsLoading: false });
    }
  },

  // Planner
  plans: [],
  plansSummary: null,
  prayerTimes: null,
  isPlansLoading: false,
  isPrayerTimesLoading: false,
  plannerDate: new Date().toISOString().split('T')[0],
  setPlannerDate: (date) => set({ plannerDate: date }),

  fetchPlans: async (date) => {
    set({ isPlansLoading: true });
    try {
      const res = await fetch(`/api/plans?date=${date}`);
      const data = await res.json();
      if (res.ok) set({ plans: data.plans, isPlansLoading: false });
      else set({ isPlansLoading: false });
    } catch {
      set({ isPlansLoading: false });
    }
  },

  fetchPlansByRange: async (startDate, endDate) => {
    set({ isPlansLoading: true });
    try {
      const res = await fetch(`/api/plans?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (res.ok) set({ plans: data.plans, isPlansLoading: false });
      else set({ isPlansLoading: false });
    } catch {
      set({ isPlansLoading: false });
    }
  },

  fetchWeeklyPlans: async (weekOf) => {
    set({ isPlansLoading: true });
    try {
      const param = weekOf ? `?week=${weekOf}` : `?week=${new Date().toISOString().split('T')[0]}`;
      const res = await fetch(`/api/plans${param}`);
      const data = await res.json();
      if (res.ok) set({ plans: data.plans, isPlansLoading: false });
      else set({ isPlansLoading: false });
    } catch {
      set({ isPlansLoading: false });
    }
  },

  fetchMonthlyPlans: async (month) => {
    set({ isPlansLoading: true });
    try {
      const param = month ? `?month=${month}` : `?month=${new Date().toISOString().substring(0, 7)}`;
      const res = await fetch(`/api/plans${param}`);
      const data = await res.json();
      if (res.ok) set({ plans: data.plans, isPlansLoading: false });
      else set({ isPlansLoading: false });
    } catch {
      set({ isPlansLoading: false });
    }
  },

  fetchPlansSummary: async () => {
    try {
      const res = await fetch('/api/plans?summary=true');
      const data = await res.json();
      if (res.ok) set({ plansSummary: data.summary });
    } catch {
      // silently fail
    }
  },

  createPlan: async (data) => {
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const payload = await res.json();
    if (payload?.plan) {
      set((state) => ({ plans: [payload.plan, ...state.plans] }));
    }
  },

  updatePlan: async (planId, data) => {
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', planId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const payload = await res.json();
    if (payload?.plan) {
      set((state) => ({
        plans: state.plans.map((p) => (p.id === planId ? { ...p, ...payload.plan } : p)),
      }));
    }
  },

  deletePlan: async (planId) => {
    const prevPlans = get().plans;
    set({ plans: prevPlans.filter((p) => p.id !== planId) });

    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', planId }),
    });
    if (!res.ok) {
      set({ plans: prevPlans });
      const err = await res.json();
      throw new Error(err.error);
    }
  },

  assignPlanToPrayerBlock: async (planId, prayerBlock) => {
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assignPrayer', planId, prayerBlock }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const payload = await res.json();
    if (payload?.plan) {
      set((state) => ({
        plans: state.plans.map((p) => (p.id === planId ? { ...p, ...payload.plan } : p)),
      }));
    }
  },

  fetchPrayerTimes: async (date) => {
    set({ isPrayerTimesLoading: true });
    try {
      const res = await fetch(`/api/prayer-times?date=${date}`);
      const data = await res.json();
      if (res.ok) set({ prayerTimes: data.prayerTimes, isPrayerTimesLoading: false });
      else set({ isPrayerTimesLoading: false });
    } catch {
      set({ isPrayerTimesLoading: false });
    }
  },

  fetchPrayerTimesFromLocation: async (date, latitude, longitude) => {
    set({ isPrayerTimesLoading: true });
    try {
      const res = await fetch('/api/prayer-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchFromLocation', date, latitude, longitude }),
      });
      const data = await res.json();
      if (res.ok && data?.prayerTimes) {
        set({ prayerTimes: data.prayerTimes, isPrayerTimesLoading: false });
      } else {
        set({ isPrayerTimesLoading: false });
      }
    } catch {
      set({ isPrayerTimesLoading: false });
    }
  },

  setManualPrayerTimes: async (date, times) => {
    const res = await fetch('/api/prayer-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setManual', date, ...times }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const data = await res.json();
    if (data?.prayerTimes) set({ prayerTimes: data.prayerTimes });
  },

  // UI
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
