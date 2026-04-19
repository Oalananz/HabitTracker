import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

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
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

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
  setUser: (user) => set({ user }),

  login: async (email, password) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    await get().checkAuth();
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
      await get().checkAuth();
    } else {
      throw new Error('Check your email for the confirmation link.');
    }
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      set({ isAuthLoading: true });
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      set({ user: data.user || null, isAuthLoading: false });
    } catch {
      set({ user: null, isAuthLoading: false });
    }
  },

  // Tasks
  tasks: [],
  taskSummary: null,
  isTasksLoading: false,

  fetchTasks: async (date) => {
    set({ isTasksLoading: true });
    try {
      const res = await fetch(`/api/tasks?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        set({ tasks: data.tasks, taskSummary: data.summary, isTasksLoading: false });
      }
    } catch {
      set({ isTasksLoading: false });
    }
  },

  completeTask: async (taskId) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', taskId }),
    });
    const { selectedDate, fetchTasks } = get();
    await fetchTasks(selectedDate);
  },

  uncompleteTask: async (taskId) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'uncomplete', taskId }),
    });
    const { selectedDate, fetchTasks } = get();
    await fetchTasks(selectedDate);
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
    const { selectedDate, fetchTasks } = get();
    await fetchTasks(selectedDate);
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
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', taskId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const { selectedDate, fetchTasks } = get();
    await fetchTasks(selectedDate);
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
    await get().fetchHabits();
  },

  updateHabit: async (habitId, data) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', habitId, ...data }),
    });
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
    await get().fetchHabits();
  },

  deleteHabit: async (habitId) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', habitId }),
    });
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

  // UI
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
