import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import {
  networkStatus, persistSession, getPersistedSession, clearPersistedSession,
  clearAllLocalData, pullAllDataFromServer, markInitialDataLoaded, hasInitialData,
  getPendingSyncCount,
  getLocalTasks, cacheTasksFromServer, localCreateTask, localUpdateTask,
  localCompleteTask, localUncompleteTask, localDeleteTask,
  getLocalHabits, cacheHabitsFromServer, localCreateHabit, localUpdateHabit,
  localToggleHabit, localDeleteHabit,
  getLocalGoals, cacheGoalsFromServer, localCreateGoal, localUpdateGoal,
  localToggleGoalComplete, localIncrementGoal, localDeleteGoal,
  getLocalJourneys, getLocalRecoveryState, getLocalFailures,
  cacheJourneysFromServer, cacheFailuresFromServer,
  localCreateJourney, localUpdateJourney, localDeleteJourney,
  localRecordJourneyFailure, localResetJourney,
  getLocalPlans, getLocalPlansByRange, cachePlansFromServer,
  localCreatePlan, localUpdatePlan, localDeletePlan, localAssignPlanToPrayerBlock,
  getLocalPrayerTimes, cachePrayerTimesFromServer,
} from '@/lib/offline';
import type { DayRecord, DayRecordUpdate } from '@/lib/services/dayRecordService';

let authCheckPromise: Promise<void> | null = null;

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
  lifeArea?: string | null;
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
  lifeArea?: string | null;
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
  lifeArea?: string | null;
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
  occurrenceDate: string;
  occurrenceKey: string;
  prayerBlock: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
  lifeArea?: string | null;
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
  heatmapData: { date: string; count: number; total: number; score?: number }[];
  weeklyTrend: { week: string; rate: number; completed: number; total: number }[];
  recovery: {
    currentDays: number;
    totalFailures: number;
    failuresByMonth: Record<string, number>;
    startTime: string | null;
  };
}

interface UserStats {
  userId: string;
  totalScore: number;
  totalFocusHours: number;
  focusStreak: number;
  prayerStreak: number;
  noReelsStreak: number;
  noMasturbationStreak: number;
  fullDisciplineStreak: number;
  bestFocusStreak: number;
  bestPrayerStreak: number;
  bestNoReelsStreak: number;
  bestFullDisciplineStreak: number;
  updatedAt: string;
}

interface UserPreferences {
  userId: string;
  focusGoalHours: number;
  sleepGoalHours: number;
  achievementAlerts: boolean;
  disciplineReminder: string | null;
  onboardingCompleted: boolean;
  focusAreas: string[];
}

interface Achievement {
  key: string;
  name: string;
  desc: string;
  cat: string;
  rarity: string;
  condition: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number } | null;
}

interface ActivityLogEntry {
  timestamp: string;
  category: string;
  message: string;
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
  generateTodayTasks: (date: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  createTask: (data: { title: string; description?: string; category?: string; priority?: string; date: string; lifeArea?: string | null }) => Promise<void>;
  updateTask: (taskId: string, data: { title?: string; description?: string; category?: string; priority?: string; date?: string; lifeArea?: string | null }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Habits
  habits: Habit[];
  isHabitsLoading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (data: { title: string; description?: string; category?: string; priority?: string; repeatRule: { type: string; days?: number[] }; lifeArea?: string | null }) => Promise<void>;
  updateHabit: (habitId: string, data: { title?: string; description?: string; category?: string; priority?: string; repeatRule?: { type: string; days?: number[] }; lifeArea?: string | null }) => Promise<void>;
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
  deleteFailure: (failureId: string) => Promise<void>;
  resetJourney: (journeyId: string, clearLogs: boolean) => Promise<void>;
  fetchRecovery: () => Promise<void>;
  fetchFailures: () => Promise<void>;

  // Goals
  goals: Goal[];
  goalsSummary: GoalsSummary | null;
  isGoalsLoading: boolean;
  fetchGoals: (type?: string) => Promise<void>;
  fetchGoalsSummary: () => Promise<void>;
  createGoal: (data: { title: string; description?: string; goalType: string; targetDate?: string; targetCount?: number; lifeArea?: string | null }) => Promise<void>;
  updateGoal: (goalId: string, data: { title?: string; description?: string; targetDate?: string; targetCount?: number; currentCount?: number; lifeArea?: string | null; isActive?: boolean }) => Promise<void>;
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
  createPlan: (data: { title: string; description?: string; planType?: string; status?: string; priority?: string; category?: string; notes?: string; startDate: string; startTime?: string; endDate?: string; endTime?: string; dayOfWeek?: string | null; prayerBlock?: string; lifeArea?: string | null }) => Promise<void>;
  updatePlan: (planId: string, data: { title?: string; description?: string; planType?: string; status?: string; priority?: string; category?: string; notes?: string; startDate?: string; startTime?: string | null; endDate?: string; endTime?: string | null; dayOfWeek?: string | null; prayerBlock?: string | null; lifeArea?: string | null }) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  assignPlanToPrayerBlock: (planId: string, prayerBlock: string | null) => Promise<void>;
  fetchPrayerTimes: (date: string) => Promise<void>;
  fetchPrayerTimesFromLocation: (date: string, latitude: number, longitude: number) => Promise<void>;
  setManualPrayerTimes: (date: string, times: { fajr?: string; dhuhr?: string; asr?: string; maghrib?: string; isha?: string }) => Promise<void>;

  // Day Record
  dayRecord: DayRecord | null;
  isDayRecordLoading: boolean;
  fetchDayRecord: (date: string) => Promise<void>;
  updateDayRecord: (date: string, fields: DayRecordUpdate) => Promise<string[]>;

  // User Stats
  userStats: UserStats | null;
  fetchUserStats: () => Promise<void>;

  // Achievements
  achievements: Achievement[];
  newlyUnlockedAchievements: Achievement[];
  newAchievementCount: number;
  isAchievementsLoading: boolean;
  fetchAchievements: () => Promise<void>;
  clearNewAchievements: () => void;
  markAchievementsSeen: () => void;

  // User Preferences
  userPreferences: UserPreferences | null;
  fetchUserPreferences: () => Promise<void>;
  saveUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  // Activity Log
  activityLog: ActivityLogEntry[];
  addActivityLog: (category: string, message: string) => void;

  // Offline / Sync
  isOffline: boolean;
  pendingSyncCount: number;
  setOffline: (offline: boolean) => void;
  refreshPendingCount: () => Promise<void>;
  initOfflineData: () => Promise<void>;

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await get().checkAuth({ force: true, background: true });
  },

  register: async (email, username, password) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { username } },
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
    await clearPersistedSession();
    await clearAllLocalData();
    set({ user: null, isAuthLoading: false, authInitialized: true, pendingSyncCount: 0 });
  },

  checkAuth: async (options) => {
    const force = options?.force ?? false;
    const background = options?.background ?? false;
    const { authInitialized } = get();

    if (authCheckPromise) return authCheckPromise;
    if (authInitialized && !force) return;
    if (!background) set({ isAuthLoading: true });

    authCheckPromise = (async () => {
      try {
        if (networkStatus.isOnline) {
          const res = await fetch('/api/auth/me');
          if (!res.ok) throw new Error('Not authenticated');
          const data = await res.json();
          const user = data.user || null;
          if (user) await persistSession(user);
          set({ user, isAuthLoading: false, authInitialized: true });
        } else {
          // Offline: use persisted session
          const cached = await getPersistedSession();
          set({ user: cached || null, isAuthLoading: false, authInitialized: true, isOffline: true });
        }
      } catch {
        // Network failed — try local session
        const cached = await getPersistedSession();
        if (cached) {
          set({ user: cached, isAuthLoading: false, authInitialized: true, isOffline: true });
        } else {
          set({ user: null, isAuthLoading: false, authInitialized: true });
        }
      }
    })();

    try { await authCheckPromise; } finally { authCheckPromise = null; }
  },

  // Tasks
  tasks: [],
  taskSummary: null,
  isTasksLoading: false,

  fetchTasks: async (date) => {
    // 1. Instant local read
    const localTasks = await getLocalTasks(date);
    if (localTasks.length) {
      const completed = localTasks.filter((t) => t.completed).length;
      set({
        tasks: localTasks as unknown as Task[],
        taskSummary: { total: localTasks.length, completed, pending: localTasks.length - completed, date },
        isTasksLoading: false,
      });
    } else {
      set({ isTasksLoading: true });
    }

    // 2. Background server fetch (if online)
    if (networkStatus.isOnline) {
      try {
        const res = await fetch(`/api/tasks?date=${date}`);
        const data = await res.json();
        if (res.ok) {
          await cacheTasksFromServer(data.tasks);
          set({ tasks: data.tasks, taskSummary: data.summary, isTasksLoading: false });
        } else {
          set({ isTasksLoading: false });
        }
      } catch {
        set({ isTasksLoading: false });
      }
    } else {
      set({ isTasksLoading: false });
    }
  },

  generateTodayTasks: async (date) => {
    // Explicitly create any habit-due tasks for the date, then load the list.
    // The GET in fetchTasks also auto-generates, so this is a reliability net
    // (e.g. stale local cache) and a no-op-safe upsert on the server.
    if (networkStatus.isOnline) {
      try {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate', date }),
        });
      } catch { /* fall through to fetch */ }
    }
    await get().fetchTasks(date);
  },

  completeTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevSummary = get().taskSummary;
    const current = prevTasks.find((t) => t.id === taskId);
    if (current && !current.completed) {
      set({
        tasks: prevTasks.map((t) => t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t),
        taskSummary: applySummaryDelta(prevSummary, 0, 1),
      });
    }
    await localCompleteTask(taskId);
    get().refreshPendingCount();

    if (networkStatus.isOnline) {
      try {
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', taskId }) });
        if (res.ok) { const data = await res.json(); if (data?.task) set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, ...data.task } : t) })); }
      } catch { /* queued for sync */ }
    }
  },

  uncompleteTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevSummary = get().taskSummary;
    const current = prevTasks.find((t) => t.id === taskId);
    if (current && current.completed) {
      set({
        tasks: prevTasks.map((t) => t.id === taskId ? { ...t, completed: false, completedAt: null } : t),
        taskSummary: applySummaryDelta(prevSummary, 0, -1),
      });
    }
    await localUncompleteTask(taskId);
    get().refreshPendingCount();

    if (networkStatus.isOnline) {
      try {
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uncomplete', taskId }) });
        if (res.ok) { const data = await res.json(); if (data?.task) set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, ...data.task } : t) })); }
      } catch { /* queued for sync */ }
    }
  },

  createTask: async (data) => {
    // Local-first create
    const created = await localCreateTask(data);
    const { selectedDate } = get();
    if (created.date === selectedDate) {
      set((state) => ({
        tasks: [created as unknown as Task, ...state.tasks],
        taskSummary: applySummaryDelta(state.taskSummary, 1, 0),
      }));
    }
    get().refreshPendingCount();

    if (networkStatus.isOnline) {
      try {
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...data }) });
        if (res.ok) { const payload = await res.json(); if (payload?.task) set((s) => ({ tasks: s.tasks.map((t) => t.id === created.id ? { ...t, ...payload.task } : t) })); }
      } catch { /* queued for sync */ }
    }
  },

  updateTask: async (taskId, data) => {
    await localUpdateTask(taskId, data);
    get().refreshPendingCount();

    if (networkStatus.isOnline) {
      try {
        await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', taskId, ...data }) });
      } catch { /* queued for sync */ }
    }
    const { selectedDate, fetchTasks } = get();
    await fetchTasks(selectedDate);
  },

  deleteTask: async (taskId) => {
    const prevTasks = get().tasks;
    const prevSummary = get().taskSummary;
    const toDelete = prevTasks.find((t) => t.id === taskId);
    if (toDelete) {
      set({ tasks: prevTasks.filter((t) => t.id !== taskId), taskSummary: applySummaryDelta(prevSummary, -1, toDelete.completed ? -1 : 0) });
    }
    await localDeleteTask(taskId);
    get().refreshPendingCount();

    if (networkStatus.isOnline) {
      try {
        await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', taskId }) });
      } catch { /* queued for sync */ }
    }
  },

  // Habits
  habits: [],
  isHabitsLoading: false,

  fetchHabits: async () => {
    set({ isHabitsLoading: true });
    const localHabits = await getLocalHabits();
    if (localHabits.length) set({ habits: localHabits as unknown as Habit[], isHabitsLoading: false });

    if (networkStatus.isOnline) {
      try {
        const res = await fetch('/api/habits');
        const data = await res.json();
        if (res.ok) { await cacheHabitsFromServer(data.habits); set({ habits: data.habits, isHabitsLoading: false }); }
      } catch { /* use local */ }
    }
    set({ isHabitsLoading: false });
  },

  createHabit: async (data) => {
    const created = await localCreateHabit(data);
    set((s) => ({ habits: [created as unknown as Habit, ...s.habits] }));
    get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...data }) }); } catch {} }
    await get().fetchHabits();
  },

  updateHabit: async (habitId, data) => {
    await localUpdateHabit(habitId, data);
    get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', habitId, ...data }) }); } catch {} }
    await get().fetchHabits();
  },

  toggleHabit: async (habitId, isActive) => {
    await localToggleHabit(habitId, isActive);
    get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: isActive ? 'deactivate' : 'activate', habitId }) }); } catch {} }
    await get().fetchHabits();
  },

  deleteHabit: async (habitId) => {
    await localDeleteHabit(habitId);
    set((s) => ({ habits: s.habits.filter((h) => h.id !== habitId) }));
    get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', habitId }) }); } catch {} }
  },

  // Recovery Journeys
  journeys: [],
  recovery: null,
  failures: [],
  isRecoveryLoading: false,

  fetchJourneys: async () => {
    set({ isRecoveryLoading: true });
    const local = await getLocalJourneys();
    const localRec = await getLocalRecoveryState();
    if (local.length) set({ journeys: local as unknown as RecoveryJourney[], recovery: (localRec as unknown as RecoveryState) || null, isRecoveryLoading: false });
    if (networkStatus.isOnline) {
      try {
        const res = await fetch('/api/recovery'); const data = await res.json();
        if (res.ok) { await cacheJourneysFromServer(data.journeys || [], data.recovery || null); set({ journeys: data.journeys || [], recovery: data.recovery || null, isRecoveryLoading: false }); }
      } catch {}
    }
    set({ isRecoveryLoading: false });
  },
  createJourney: async (data) => {
    const created = await localCreateJourney(data);
    set((s) => ({ journeys: [created as unknown as RecoveryJourney, ...s.journeys] }));
    get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'createJourney', ...data }) }); } catch {} }
    await get().fetchJourneys();
  },
  updateJourney: async (journeyId, data) => {
    await localUpdateJourney(journeyId, data); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateJourney', journeyId, ...data }) }); } catch {} }
    await get().fetchJourneys();
  },
  deleteJourney: async (journeyId) => {
    await localDeleteJourney(journeyId); set((s) => ({ journeys: s.journeys.filter((j) => j.id !== journeyId) })); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteJourney', journeyId }) }); } catch {} }
  },
  recordJourneyFailure: async (journeyId, note) => {
    const prevJourneys = get().journeys;
    set({ journeys: prevJourneys.map((j) => j.id === journeyId ? { ...j, failureCount: j.failureCount + 1 } : j) });
    const failure = await localRecordJourneyFailure(journeyId, note);
    set((s) => ({ failures: [failure as unknown as FailureLog, ...s.failures] }));
    get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fail', journeyId, note }) }); await get().fetchJourneys(); await get().fetchFailures(); } catch {} }
  },
  deleteFailure: async (failureId) => {
    // Optimistically remove from state, then sync with the server.
    const removed = get().failures.find((f) => f.id === failureId);
    set((s) => ({ failures: s.failures.filter((f) => f.id !== failureId) }));
    if (removed?.journeyId) {
      set((s) => ({ journeys: s.journeys.map((j) => j.id === removed.journeyId ? { ...j, failureCount: Math.max(0, j.failureCount - 1) } : j) }));
    }
    if (networkStatus.isOnline) {
      try {
        await fetch('/api/failures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: failureId }) });
        await get().fetchJourneys();
        await get().fetchFailures();
      } catch {}
    }
  },
  resetJourney: async (journeyId, clearLogs) => {
    await localResetJourney(journeyId, clearLogs); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset', journeyId, clearLogs }) }); } catch {} }
    await get().fetchJourneys();
  },
  fetchRecovery: async () => { await get().fetchJourneys(); },
  fetchFailures: async () => {
    const local = await getLocalFailures();
    if (local.length) set({ failures: local as unknown as FailureLog[] });
    if (networkStatus.isOnline) { try { const res = await fetch('/api/failures'); const data = await res.json(); if (res.ok) { await cacheFailuresFromServer(data.failures); set({ failures: data.failures }); } } catch {} }
  },

  // Goals
  goals: [],
  goalsSummary: null,
  isGoalsLoading: false,

  fetchGoals: async (type) => {
    set({ isGoalsLoading: true });
    const local = await getLocalGoals(type);
    if (local.length) set({ goals: local as unknown as Goal[], isGoalsLoading: false });
    if (networkStatus.isOnline) {
      try { const url = type ? `/api/goals?type=${type}` : '/api/goals'; const res = await fetch(url); const data = await res.json(); if (res.ok) { await cacheGoalsFromServer(data.goals); set({ goals: data.goals, isGoalsLoading: false }); } } catch {}
    }
    set({ isGoalsLoading: false });
  },
  fetchGoalsSummary: async () => {
    if (!networkStatus.isOnline) return;
    try { const res = await fetch('/api/goals?summary=true'); const data = await res.json(); if (res.ok) set({ goalsSummary: data.summary }); } catch {}
  },
  createGoal: async (data) => {
    const created = await localCreateGoal(data);
    set((s) => ({ goals: [created as unknown as Goal, ...s.goals] })); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...data }) }); } catch {} }
    await get().fetchGoals();
  },
  updateGoal: async (goalId, data) => {
    await localUpdateGoal(goalId, data); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', goalId, ...data }) }); } catch {} }
    await get().fetchGoals();
  },
  toggleGoalComplete: async (goalId) => {
    await localToggleGoalComplete(goalId); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', goalId }) }); } catch {} }
    await get().fetchGoals();
  },
  incrementGoal: async (goalId, amount = 1) => {
    await localIncrementGoal(goalId, amount); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'increment', goalId, amount }) }); } catch {} }
    await get().fetchGoals();
  },
  deleteGoal: async (goalId) => {
    await localDeleteGoal(goalId); set((s) => ({ goals: s.goals.filter((g) => g.id !== goalId) })); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', goalId }) }); } catch {} }
  },

  // Dashboard
  metrics: null,
  isMetricsLoading: false,
  fetchMetrics: async () => {
    if (!networkStatus.isOnline) return;
    set({ isMetricsLoading: true });
    try { const res = await fetch('/api/dashboard'); const data = await res.json(); if (res.ok) set({ metrics: data.metrics, isMetricsLoading: false }); } catch { set({ isMetricsLoading: false }); }
  },

  // Planner
  plans: [],
  plansSummary: null,
  prayerTimes: null,
  isPlansLoading: false,
  isPrayerTimesLoading: false,
  plannerDate: '',
  setPlannerDate: (date) => set({ plannerDate: date }),

  fetchPlans: async (date) => {
    set({ isPlansLoading: true });
    const local = await getLocalPlans(date);
    if (local.length) set({ plans: local as unknown as Plan[], isPlansLoading: false });
    if (networkStatus.isOnline) { try { const res = await fetch(`/api/plans?date=${date}`); const data = await res.json(); if (res.ok) { await cachePlansFromServer(data.plans); set({ plans: data.plans, isPlansLoading: false }); } } catch {} }
    set({ isPlansLoading: false });
  },
  fetchPlansByRange: async (startDate, endDate) => {
    set({ isPlansLoading: true });
    const local = await getLocalPlansByRange(startDate, endDate);
    if (local.length) set({ plans: local as unknown as Plan[], isPlansLoading: false });
    if (networkStatus.isOnline) { try { const res = await fetch(`/api/plans?startDate=${startDate}&endDate=${endDate}`); const data = await res.json(); if (res.ok) { await cachePlansFromServer(data.plans); set({ plans: data.plans, isPlansLoading: false }); } } catch {} }
    set({ isPlansLoading: false });
  },
  fetchWeeklyPlans: async (weekOf) => {
    set({ isPlansLoading: true });
    if (networkStatus.isOnline) { try { const p = weekOf ? `?week=${weekOf}` : `?week=${new Date().toISOString().split('T')[0]}`; const res = await fetch(`/api/plans${p}`); const data = await res.json(); if (res.ok) { await cachePlansFromServer(data.plans); set({ plans: data.plans, isPlansLoading: false }); } } catch {} }
    set({ isPlansLoading: false });
  },
  fetchMonthlyPlans: async (month) => {
    set({ isPlansLoading: true });
    if (networkStatus.isOnline) { try { const p = month ? `?month=${month}` : `?month=${new Date().toISOString().substring(0, 7)}`; const res = await fetch(`/api/plans${p}`); const data = await res.json(); if (res.ok) { await cachePlansFromServer(data.plans); set({ plans: data.plans, isPlansLoading: false }); } } catch {} }
    set({ isPlansLoading: false });
  },
  fetchPlansSummary: async () => {
    if (!networkStatus.isOnline) return;
    try { const res = await fetch('/api/plans?summary=true'); const data = await res.json(); if (res.ok) set({ plansSummary: data.summary }); } catch {}
  },
  createPlan: async (data) => {
    const userId = get().user?.id || '';
    const created = await localCreatePlan(data, userId);
    set((s) => ({ plans: [created as unknown as Plan, ...s.plans] })); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { const res = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...data }) }); if (res.ok) { const payload = await res.json(); if (payload?.plan) set((s) => ({ plans: s.plans.map((p) => p.id === created.id ? { ...p, ...payload.plan } : p) })); } } catch {} }
  },
  updatePlan: async (planId, data) => {
    await localUpdatePlan(planId, data as Record<string, unknown>); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { const res = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', planId, ...data }) }); if (res.ok) { const payload = await res.json(); if (payload?.plan) set((s) => ({ plans: s.plans.map((p) => p.id === planId ? { ...p, ...payload.plan } : p) })); } } catch {} }
  },
  deletePlan: async (planId) => {
    set((s) => ({ plans: s.plans.filter((p) => p.id !== planId) }));
    await localDeletePlan(planId); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', planId }) }); } catch {} }
  },
  assignPlanToPrayerBlock: async (planId, prayerBlock) => {
    await localAssignPlanToPrayerBlock(planId, prayerBlock); get().refreshPendingCount();
    if (networkStatus.isOnline) { try { const res = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assignPrayer', planId, prayerBlock }) }); if (res.ok) { const payload = await res.json(); if (payload?.plan) set((s) => ({ plans: s.plans.map((p) => p.id === planId ? { ...p, ...payload.plan } : p) })); } } catch {} }
  },

  fetchPrayerTimes: async (date) => {
    set({ isPrayerTimesLoading: true });
    const local = await getLocalPrayerTimes(date);
    if (local) set({ prayerTimes: local as unknown as PrayerTimesData, isPrayerTimesLoading: false });
    if (networkStatus.isOnline) {
      try { const res = await fetch(`/api/prayer-times?date=${date}`); const data = await res.json(); if (res.ok) { await cachePrayerTimesFromServer(data.prayerTimes); set({ prayerTimes: data.prayerTimes, isPrayerTimesLoading: false }); } } catch {}
    }
    set({ isPrayerTimesLoading: false });
  },

  fetchPrayerTimesFromLocation: async (date, latitude, longitude) => {
    if (!networkStatus.isOnline) return;
    set({ isPrayerTimesLoading: true });
    try {
      const res = await fetch('/api/prayer-times', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fetchFromLocation', date, latitude, longitude }) });
      const data = await res.json();
      if (res.ok && data?.prayerTimes) { await cachePrayerTimesFromServer(data.prayerTimes); set({ prayerTimes: data.prayerTimes, isPrayerTimesLoading: false }); }
      else set({ isPrayerTimesLoading: false });
    } catch { set({ isPrayerTimesLoading: false }); }
  },

  setManualPrayerTimes: async (date, times) => {
    if (!networkStatus.isOnline) return;
    const res = await fetch('/api/prayer-times', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setManual', date, ...times }) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    const data = await res.json();
    if (data?.prayerTimes) { await cachePrayerTimesFromServer(data.prayerTimes); set({ prayerTimes: data.prayerTimes }); }
  },

  // Day Record
  dayRecord: null,
  isDayRecordLoading: false,

  fetchDayRecord: async (date) => {
    set({ isDayRecordLoading: true });
    try {
      const res = await fetch(`/api/day-record?date=${date}`);
      const data = await res.json();
      if (res.ok && data.record) {
        const r = data.record;
        const mapped: DayRecord = {
          id: r.id, userId: r.user_id, date: r.date,
          focusHours: Number(r.focus_hours ?? 0), focusGoal: Number(r.focus_goal ?? 6),
          noReels: Boolean(r.no_reels), noMasturbation: Boolean(r.no_masturbation),
          lowSugar: Boolean(r.low_sugar), noMusic: Boolean(r.no_music), noYapping: Boolean(r.no_yapping),
          fajr: Boolean(r.fajr), dhuhr: Boolean(r.dhuhr), asr: Boolean(r.asr),
          maghrib: Boolean(r.maghrib), isha: Boolean(r.isha),
          quran: Boolean(r.quran), dhikrMorning: Boolean(r.dhikr_morning),
          dhikrEvening: Boolean(r.dhikr_evening), nightPrayer: Boolean(r.night_prayer),
          sunnahPrayer: Boolean(r.sunnah_prayer),
          sleepHours: Number(r.sleep_hours ?? 0), sleepGoal: Number(r.sleep_goal ?? 7),
          tasksDone: Boolean(r.tasks_done),
          dailyScore: Number(r.daily_score ?? 0),
          notes: r.notes || null, createdAt: r.created_at, updatedAt: r.updated_at,
        };
        set({ dayRecord: mapped });
      }
    } catch {/* use cached */}
    set({ isDayRecordLoading: false });
  },

  updateDayRecord: async (date, fields) => {
    // Optimistic update
    const prev = get().dayRecord;
    if (prev) {
      const optimistic = { ...prev, ...fields };
      // Compute optimistic score (mirror of recalculate_day_score, v5)
      let score = 0;
      if (optimistic.focusHours >= optimistic.focusGoal) score += 2;
      if (optimistic.fajr && optimistic.dhuhr && optimistic.asr && optimistic.maghrib && optimistic.isha) score += 2;
      if (optimistic.quran && (optimistic.dhikrMorning || optimistic.dhikrEvening)) score += 1;
      if (optimistic.nightPrayer && optimistic.sunnahPrayer) score += 1;
      if (optimistic.noReels && optimistic.noMasturbation && optimistic.noMusic) score += 2;
      if (optimistic.sleepHours >= optimistic.sleepGoal) score += 1;
      if (optimistic.tasksDone) score += 1;
      optimistic.dailyScore = Math.min(score, 10);
      set({ dayRecord: optimistic });
    }

    if (!networkStatus.isOnline) return [];
    try {
      const body: Record<string, unknown> = { date };
      for (const [k, v] of Object.entries(fields)) { body[k] = v; }
      const res = await fetch('/api/day-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          const r = data.record;
          const updated: DayRecord = {
            id: r.id, userId: r.user_id, date: r.date,
            focusHours: Number(r.focus_hours ?? 0), focusGoal: Number(r.focus_goal ?? 6),
            noReels: Boolean(r.no_reels), noMasturbation: Boolean(r.no_masturbation),
            lowSugar: Boolean(r.low_sugar), noMusic: Boolean(r.no_music), noYapping: Boolean(r.no_yapping),
            fajr: Boolean(r.fajr), dhuhr: Boolean(r.dhuhr), asr: Boolean(r.asr),
            maghrib: Boolean(r.maghrib), isha: Boolean(r.isha),
            quran: Boolean(r.quran), dhikrMorning: Boolean(r.dhikr_morning),
            dhikrEvening: Boolean(r.dhikr_evening), nightPrayer: Boolean(r.night_prayer),
            sunnahPrayer: Boolean(r.sunnah_prayer),
            sleepHours: Number(r.sleep_hours ?? 0), sleepGoal: Number(r.sleep_goal ?? 7),
            tasksDone: Boolean(r.tasks_done),
            dailyScore: Number(r.daily_score ?? 0),
            notes: r.notes || null, createdAt: r.created_at, updatedAt: r.updated_at,
          };
          set({ dayRecord: updated });
        }
        const newKeys: string[] = data.newAchievements || [];
        if (newKeys.length > 0) {
          const allDefs = get().achievements;
          const newOnes = newKeys.map(k => allDefs.find(a => a.key === k)).filter(Boolean) as Achievement[];
          set(s => ({
            newlyUnlockedAchievements: [...s.newlyUnlockedAchievements, ...newOnes],
            newAchievementCount: s.newAchievementCount + newKeys.length,
          }));
          void get().fetchAchievements();
        }
        return newKeys;
      }
    } catch {/* keep optimistic */}
    return [];
  },

  // User Stats
  userStats: null,
  fetchUserStats: async () => {
    if (!networkStatus.isOnline) return;
    try {
      const res = await fetch('/api/user-stats');
      const data = await res.json();
      if (res.ok && data.stats) {
        const s = data.stats;
        set({
          userStats: {
            userId: s.user_id,
            totalScore: s.total_score || 0,
            totalFocusHours: s.total_focus_hours || 0,
            focusStreak: s.focus_streak || 0,
            prayerStreak: s.prayer_streak || 0,
            noReelsStreak: s.no_reels_streak || 0,
            noMasturbationStreak: s.no_masturbation_streak || 0,
            fullDisciplineStreak: s.full_discipline_streak || 0,
            bestFocusStreak: s.best_focus_streak || 0,
            bestPrayerStreak: s.best_prayer_streak || 0,
            bestNoReelsStreak: s.best_no_reels_streak || 0,
            bestFullDisciplineStreak: s.best_full_discipline_streak || 0,
            updatedAt: s.updated_at,
          },
        });
      }
    } catch {}
  },

  // Achievements
  achievements: [],
  newlyUnlockedAchievements: [],
  newAchievementCount: 0,
  isAchievementsLoading: false,

  fetchAchievements: async () => {
    if (!networkStatus.isOnline) return;
    set({ isAchievementsLoading: true });
    try {
      const res = await fetch('/api/achievements');
      const data = await res.json();
      if (res.ok) set({ achievements: data.achievements || [] });
    } catch {}
    set({ isAchievementsLoading: false });
  },

  clearNewAchievements: () => set({ newlyUnlockedAchievements: [] }),
  markAchievementsSeen: () => set({ newAchievementCount: 0 }),

  // User Preferences
  userPreferences: null,
  fetchUserPreferences: async () => {
    if (!networkStatus.isOnline) return;
    try {
      const res = await fetch('/api/user-preferences');
      const data = await res.json();
      if (res.ok && data.preferences) {
        const p = data.preferences;
        set({
          userPreferences: {
            userId: p.user_id,
            focusGoalHours: p.focus_goal_hours ?? 6,
            sleepGoalHours: p.sleep_goal_hours ?? 7,
            achievementAlerts: p.achievement_alerts ?? true,
            disciplineReminder: p.discipline_reminder || null,
            onboardingCompleted: p.onboarding_completed ?? false,
            focusAreas: p.focus_areas || [],
          },
        });
      }
    } catch {}
  },

  saveUserPreferences: async (prefs) => {
    if (!networkStatus.isOnline) return;
    const body: Record<string, unknown> = {};
    if (prefs.focusGoalHours !== undefined) body.focus_goal_hours = prefs.focusGoalHours;
    if (prefs.sleepGoalHours !== undefined) body.sleep_goal_hours = prefs.sleepGoalHours;
    if (prefs.achievementAlerts !== undefined) body.achievement_alerts = prefs.achievementAlerts;
    if (prefs.disciplineReminder !== undefined) body.discipline_reminder = prefs.disciplineReminder;
    if (prefs.onboardingCompleted !== undefined) body.onboarding_completed = prefs.onboardingCompleted;
    if (prefs.focusAreas !== undefined) body.focus_areas = prefs.focusAreas;
    try {
      const res = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        set(s => ({ userPreferences: s.userPreferences ? { ...s.userPreferences, ...prefs } : null }));
      }
    } catch {}
  },

  // Activity Log
  activityLog: [],
  addActivityLog: (category, message) => {
    const entry: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
    };
    set(s => ({ activityLog: [entry, ...s.activityLog].slice(0, 100) }));
  },

  // Offline / Sync
  isOffline: false,
  pendingSyncCount: 0,
  setOffline: (offline) => set({ isOffline: offline }),
  refreshPendingCount: async () => {
    try { const count = await getPendingSyncCount(); set({ pendingSyncCount: count }); } catch {}
  },
  initOfflineData: async () => {
    const loaded = await hasInitialData();
    if (!loaded && networkStatus.isOnline) {
      const success = await pullAllDataFromServer();
      if (success) await markInitialDataLoaded();
    }
  },

  // UI
  selectedDate: '',
  setSelectedDate: (date) => set({ selectedDate: date }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
