/**
 * Sync Manager — orchestrates batch synchronization
 * of offline changes to the server.
 */
import { offlineDB, setMeta, getPendingSyncCount } from './db';
import {
  getPendingOperations,
  markAsSyncing,
  markAsSynced,
  markAsFailed,
  clearSyncedOperations,
  compactQueue,
  getSyncQueueSummary,
} from './syncQueue';
import { pullAllDataFromServer } from './offlineService';
import { networkStatus } from './networkStatus';

export interface SyncResult {
  success: boolean;
  pushed: number;
  failed: number;
  pulled: boolean;
  errors: string[];
  duration: number;
}

type SyncProgressListener = (progress: {
  phase: 'compacting' | 'pushing' | 'pulling' | 'cleanup' | 'done' | 'error';
  current: number;
  total: number;
  message: string;
}) => void;

let isSyncing = false;
const progressListeners = new Set<SyncProgressListener>();

/** Subscribe to sync progress updates */
export function onSyncProgress(listener: SyncProgressListener): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

function emitProgress(progress: Parameters<SyncProgressListener>[0]): void {
  progressListeners.forEach((fn) => fn(progress));
}

/** Check if a sync is currently in progress */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Execute a full backup/sync cycle:
 * 1. Compact the queue (remove redundant operations)
 * 2. Push all pending changes to the server
 * 3. Pull latest data from server
 * 4. Clean up synced operations
 */
export async function performBackup(): Promise<SyncResult> {
  if (isSyncing) {
    return {
      success: false,
      pushed: 0,
      failed: 0,
      pulled: false,
      errors: ['Sync already in progress'],
      duration: 0,
    };
  }

  if (!networkStatus.isOnline) {
    return {
      success: false,
      pushed: 0,
      failed: 0,
      pulled: false,
      errors: ['No internet connection. Please connect and try again.'],
      duration: 0,
    };
  }

  isSyncing = true;
  const startTime = Date.now();
  const errors: string[] = [];
  let pushed = 0;
  let failed = 0;

  try {
    // Phase 1: Compact the queue
    emitProgress({ phase: 'compacting', current: 0, total: 0, message: 'Optimizing sync queue...' });
    const compacted = await compactQueue();
    if (compacted > 0) {
      console.log(`[syncManager] Compacted ${compacted} redundant operations`);
    }

    // Phase 2: Push pending changes
    const pending = await getPendingOperations();
    const total = pending.length;

    if (total === 0) {
      emitProgress({ phase: 'pulling', current: 0, total: 0, message: 'No pending changes. Pulling latest data...' });
    } else {
      emitProgress({ phase: 'pushing', current: 0, total, message: `Pushing ${total} changes...` });

      // Mark all as syncing
      const ids = pending.map((p) => p.id!).filter(Boolean);
      await markAsSyncing(ids);

      // Process operations sequentially to maintain order
      for (let i = 0; i < pending.length; i++) {
        const op = pending[i];
        emitProgress({
          phase: 'pushing',
          current: i + 1,
          total,
          message: `Syncing ${op.table}/${op.action} (${i + 1}/${total})...`,
        });

        try {
          const res = await fetch(op.apiEndpoint, {
            method: op.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(op.payload),
          });

          if (res.ok) {
            await markAsSynced(op.id!);
            pushed++;

            // If this was a create operation, update local ID mapping
            const data = await res.json().catch(() => null);
            if (data && op.action === 'create' && op.payload._localId) {
              await updateLocalIdMapping(op.table, op.payload._localId as string, data);
            }
          } else {
            const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            const errMsg = errBody.error || `Failed: ${res.status}`;
            await markAsFailed(op.id!, errMsg);
            errors.push(`${op.table}/${op.action}: ${errMsg}`);
            failed++;
          }
        } catch (err) {
          const errMsg = (err as Error).message || 'Network error';
          await markAsFailed(op.id!, errMsg);
          errors.push(`${op.table}/${op.action}: ${errMsg}`);
          failed++;
        }
      }
    }

    // Phase 3: Pull latest data from server
    emitProgress({ phase: 'pulling', current: 0, total: 0, message: 'Pulling latest data...' });
    const pulled = await pullAllDataFromServer();

    // Phase 4: Cleanup
    emitProgress({ phase: 'cleanup', current: 0, total: 0, message: 'Cleaning up...' });
    await clearSyncedOperations();
    await setMeta('lastBackupAt', new Date().toISOString());

    const duration = Date.now() - startTime;
    const result: SyncResult = {
      success: failed === 0,
      pushed,
      failed,
      pulled,
      errors,
      duration,
    };

    emitProgress({
      phase: 'done',
      current: pushed,
      total: pushed + failed,
      message: failed === 0
        ? `Backup complete! ${pushed} changes synced.`
        : `Backup finished with ${failed} errors.`,
    });

    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    emitProgress({
      phase: 'error',
      current: 0,
      total: 0,
      message: `Backup failed: ${(err as Error).message}`,
    });

    return {
      success: false,
      pushed,
      failed,
      pulled: false,
      errors: [(err as Error).message, ...errors],
      duration,
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * When a create operation succeeds on the server, the server may assign
 * a different ID. Update local references accordingly.
 */
async function updateLocalIdMapping(
  table: string,
  localId: string,
  serverResponse: Record<string, unknown>
): Promise<void> {
  // Extract the server entity from the response
  const entity = (serverResponse.task || serverResponse.habit || serverResponse.goal ||
    serverResponse.plan || serverResponse.journey || serverResponse) as Record<string, unknown>;

  const serverId = entity?.id as string;
  if (!serverId || serverId === localId) return;

  // We need to replace the local record with the server-assigned ID
  try {
    switch (table) {
      case 'tasks': {
        const local = await offlineDB.tasks.get(localId);
        if (local) {
          await offlineDB.tasks.delete(localId);
          await offlineDB.tasks.put({ ...local, id: serverId, _dirty: false });
        }
        break;
      }
      case 'habits': {
        const local = await offlineDB.habits.get(localId);
        if (local) {
          await offlineDB.habits.delete(localId);
          await offlineDB.habits.put({ ...local, id: serverId, _dirty: false });
        }
        break;
      }
      case 'goals': {
        const local = await offlineDB.goals.get(localId);
        if (local) {
          await offlineDB.goals.delete(localId);
          await offlineDB.goals.put({ ...local, id: serverId, _dirty: false });
        }
        break;
      }
      case 'plans': {
        const local = await offlineDB.plans.get(localId);
        if (local) {
          await offlineDB.plans.delete(localId);
          await offlineDB.plans.put({ ...local, id: serverId, _dirty: false });
        }
        break;
      }
      case 'journeys': {
        const local = await offlineDB.journeys.get(localId);
        if (local) {
          await offlineDB.journeys.delete(localId);
          await offlineDB.journeys.put({ ...local, id: serverId, _dirty: false });
        }
        break;
      }
    }

    // Also update any pending sync ops that reference the old local ID
    const pendingOps = await offlineDB.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    for (const op of pendingOps) {
      const payload = op.payload;
      let updated = false;

      if (payload.taskId === localId) { payload.taskId = serverId; updated = true; }
      if (payload.habitId === localId) { payload.habitId = serverId; updated = true; }
      if (payload.goalId === localId) { payload.goalId = serverId; updated = true; }
      if (payload.planId === localId) { payload.planId = serverId; updated = true; }
      if (payload.journeyId === localId) { payload.journeyId = serverId; updated = true; }

      if (updated && op.id) {
        await offlineDB.syncQueue.update(op.id, { payload });
      }
    }
  } catch (err) {
    console.error('[syncManager] updateLocalIdMapping error:', err);
  }
}

/** Get the current sync status for display in the UI */
export async function getSyncStatus(): Promise<{
  pendingCount: number;
  lastBackupAt: string | null;
  lastSyncAt: string | null;
  summary: Awaited<ReturnType<typeof getSyncQueueSummary>>;
}> {
  const pendingCount = await getPendingSyncCount();
  const lastBackupAt = (await offlineDB.metadata.get('lastBackupAt'))?.value || null;
  const lastSyncAt = (await offlineDB.metadata.get('lastSyncAt'))?.value || null;
  const summary = await getSyncQueueSummary();

  return { pendingCount, lastBackupAt, lastSyncAt, summary };
}
