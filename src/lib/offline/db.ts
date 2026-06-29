/**
 * Offline-first local database using Dexie.js (IndexedDB wrapper).
 * Mirrors the Supabase schema so data can be stored/read locally
 * and synced to the server when the user presses "Backup Data".
 */
import Dexie, { type EntityTable } from 'dexie';

// ─── Entity interfaces (matching the Zustand store shapes) ──────────

export interface LocalTask {
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
  updatedAt?: string;
  habit?: { id: string; title: string; repeatRule: unknown } | null;
  _dirty?: boolean; // true if modified offline and not yet synced
}

export interface LocalHabit {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  repeatRule: { type: string; days?: number[] };
  lifeArea?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: { tasks: number };
  _dirty?: boolean;
}

export interface LocalGoal {
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
  updatedAt?: string;
  _dirty?: boolean;
}

export interface LocalJourney {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  failureCount: number;
  _dirty?: boolean;
}

export interface LocalFailure {
  id: string;
  journeyId: string | null;
  timestamp: string;
  note: string | null;
  createdAt: string;
  _dirty?: boolean;
}

export interface LocalPlan {
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
  _dirty?: boolean;
}

export interface LocalPrayerTimes {
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

export interface LocalRecoveryState {
  id: string;
  startTime: string;
  updatedAt: string;
  failureCount: number;
}

export interface SyncQueueItem {
  id?: number; // auto-increment
  uuid: string; // unique identifier for dedup
  table: string;
  action: string;
  payload: Record<string, unknown>;
  apiEndpoint: string;
  method: string;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export interface LocalMetadata {
  key: string;
  value: string;
}

// ─── Database definition ────────────────────────────────────────────

class HabitTerminalDB extends Dexie {
  tasks!: EntityTable<LocalTask, 'id'>;
  habits!: EntityTable<LocalHabit, 'id'>;
  goals!: EntityTable<LocalGoal, 'id'>;
  journeys!: EntityTable<LocalJourney, 'id'>;
  failures!: EntityTable<LocalFailure, 'id'>;
  plans!: EntityTable<LocalPlan, 'id'>;
  prayerTimes!: EntityTable<LocalPrayerTimes, 'id'>;
  recoveryState!: EntityTable<LocalRecoveryState, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  metadata!: EntityTable<LocalMetadata, 'key'>;

  constructor() {
    super('HabitTerminalDB');

    this.version(1).stores({
      tasks: 'id, date, habitId, completed, sourceType, _dirty',
      habits: 'id, category, isActive, _dirty',
      goals: 'id, goalType, isActive, completed, _dirty',
      journeys: 'id, isActive, _dirty',
      failures: 'id, journeyId, timestamp, _dirty',
      plans: 'id, startDate, planType, prayerBlock, occurrenceDate, _dirty',
      prayerTimes: 'id, date',
      recoveryState: 'id',
      syncQueue: '++id, uuid, table, status, createdAt',
      metadata: 'key',
    });
  }
}

// Singleton instance
export const offlineDB = new HabitTerminalDB();

// ─── Helper utilities ───────────────────────────────────────────────

/** Clear all local data (used on logout) */
export async function clearAllLocalData(): Promise<void> {
  await Promise.all([
    offlineDB.tasks.clear(),
    offlineDB.habits.clear(),
    offlineDB.goals.clear(),
    offlineDB.journeys.clear(),
    offlineDB.failures.clear(),
    offlineDB.plans.clear(),
    offlineDB.prayerTimes.clear(),
    offlineDB.recoveryState.clear(),
    offlineDB.syncQueue.clear(),
    offlineDB.metadata.clear(),
  ]);
}

/** Get a metadata value */
export async function getMeta(key: string): Promise<string | undefined> {
  const entry = await offlineDB.metadata.get(key);
  return entry?.value;
}

/** Set a metadata value */
export async function setMeta(key: string, value: string): Promise<void> {
  await offlineDB.metadata.put({ key, value });
}

/** Get the count of pending sync operations */
export async function getPendingSyncCount(): Promise<number> {
  return offlineDB.syncQueue.where('status').equals('pending').count();
}

/** Check if the database has been populated with initial data */
export async function hasInitialData(): Promise<boolean> {
  const val = await getMeta('initialDataLoaded');
  return val === 'true';
}

/** Mark initial data as loaded */
export async function markInitialDataLoaded(): Promise<void> {
  await setMeta('initialDataLoaded', 'true');
  await setMeta('lastSyncAt', new Date().toISOString());
}
