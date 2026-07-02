/**
 * Barrel export for the offline module.
 */
export { offlineDB, clearAllLocalData, getPendingSyncCount, getMeta, setMeta, hasInitialData, markInitialDataLoaded } from './db';
export type { LocalTask, LocalHabit, LocalGoal, LocalJourney, LocalFailure, LocalPlan, LocalPrayerTimes, LocalRecoveryState, SyncQueueItem } from './db';

export { networkStatus } from './networkStatus';

export { enqueueSync, getPendingOperations, getSyncQueueSummary, compactQueue, retryFailedOperations, clearSyncedOperations } from './syncQueue';

export { persistSession, getPersistedSession, clearPersistedSession, hasPersistedSession } from './authPersistence';

export { performBackup, getSyncStatus, onSyncProgress, isSyncInProgress, scheduleAutoSync, initAutoSync, type SyncResult } from './syncManager';

export {
  // Tasks
  getLocalTasks, cacheTasksFromServer, localCreateTask, localUpdateTask, localCompleteTask, localUncompleteTask, localDeleteTask,
  // Habits
  getLocalHabits, cacheHabitsFromServer, localCreateHabit, localUpdateHabit, localToggleHabit, localDeleteHabit,
  // Goals
  getLocalGoals, cacheGoalsFromServer, localCreateGoal, localUpdateGoal, localToggleGoalComplete, localIncrementGoal, localDeleteGoal,
  // Journeys
  getLocalJourneys, getLocalRecoveryState, getLocalFailures, cacheJourneysFromServer, cacheFailuresFromServer,
  localCreateJourney, localUpdateJourney, localDeleteJourney, localRecordJourneyFailure, localResetJourney,
  // Plans
  getLocalPlans, getLocalPlansByRange, cachePlansFromServer, localCreatePlan, localUpdatePlan, localDeletePlan, localAssignPlanToPrayerBlock,
  // Prayer Times
  getLocalPrayerTimes, cachePrayerTimesFromServer,
  // Bulk
  pullAllDataFromServer,
} from './offlineService';
