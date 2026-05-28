/**
 * Sync Queue — manages the queue of offline operations
 * that need to be pushed to the server.
 */
import { offlineDB, type SyncQueueItem } from './db';

/** Generate a UUID for deduplication */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Add an operation to the sync queue */
export async function enqueueSync(
  table: string,
  action: string,
  payload: Record<string, unknown>,
  apiEndpoint: string,
  method: string = 'POST'
): Promise<void> {
  const item: SyncQueueItem = {
    uuid: generateUUID(),
    table,
    action,
    payload,
    apiEndpoint,
    method,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  await offlineDB.syncQueue.add(item);
}

/** Get all pending sync operations, ordered by creation time */
export async function getPendingOperations(): Promise<SyncQueueItem[]> {
  return offlineDB.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('createdAt');
}

/** Get all failed sync operations */
export async function getFailedOperations(): Promise<SyncQueueItem[]> {
  return offlineDB.syncQueue
    .where('status')
    .equals('failed')
    .sortBy('createdAt');
}

/** Mark operations as syncing (lock them) */
export async function markAsSyncing(ids: number[]): Promise<void> {
  await offlineDB.syncQueue
    .where('id')
    .anyOf(ids)
    .modify({ status: 'syncing' });
}

/** Mark an operation as successfully synced */
export async function markAsSynced(id: number): Promise<void> {
  await offlineDB.syncQueue.update(id, { status: 'synced' });
}

/** Mark an operation as failed */
export async function markAsFailed(id: number, error: string): Promise<void> {
  const item = await offlineDB.syncQueue.get(id);
  if (item) {
    await offlineDB.syncQueue.update(id, {
      status: 'failed',
      error,
      retryCount: (item.retryCount || 0) + 1,
    });
  }
}

/** Remove all synced operations (cleanup) */
export async function clearSyncedOperations(): Promise<number> {
  const synced = await offlineDB.syncQueue
    .where('status')
    .equals('synced')
    .toArray();
  const ids = synced.map((s) => s.id!).filter(Boolean);
  await offlineDB.syncQueue.bulkDelete(ids);
  return ids.length;
}

/** Reset failed operations back to pending for retry */
export async function retryFailedOperations(): Promise<number> {
  const failed = await offlineDB.syncQueue
    .where('status')
    .equals('failed')
    .toArray();

  const ids = failed.map((f) => f.id!).filter(Boolean);
  await offlineDB.syncQueue
    .where('id')
    .anyOf(ids)
    .modify({ status: 'pending', error: undefined });

  return ids.length;
}

/** Get a summary of the sync queue */
export async function getSyncQueueSummary(): Promise<{
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  total: number;
}> {
  const all = await offlineDB.syncQueue.toArray();
  return {
    pending: all.filter((i) => i.status === 'pending').length,
    syncing: all.filter((i) => i.status === 'syncing').length,
    synced: all.filter((i) => i.status === 'synced').length,
    failed: all.filter((i) => i.status === 'failed').length,
    total: all.length,
  };
}

/**
 * Compact the queue: remove redundant operations.
 * For example, if a task was created then updated then deleted offline,
 * we only need to keep the "delete" (or nothing if it was never synced).
 */
export async function compactQueue(): Promise<number> {
  const pending = await getPendingOperations();
  let removed = 0;

  // Group by table + entity ID
  const groups = new Map<string, SyncQueueItem[]>();
  for (const op of pending) {
    const entityId = (op.payload as Record<string, unknown>).id as string
      || (op.payload as Record<string, unknown>).taskId as string
      || (op.payload as Record<string, unknown>).habitId as string
      || (op.payload as Record<string, unknown>).goalId as string
      || (op.payload as Record<string, unknown>).planId as string
      || (op.payload as Record<string, unknown>).journeyId as string
      || '';

    if (!entityId) continue;
    const key = `${op.table}:${entityId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(op);
  }

  for (const [, ops] of groups) {
    if (ops.length <= 1) continue;

    // If the last operation is 'delete', remove all previous ops
    const lastOp = ops[ops.length - 1];
    if (lastOp.action === 'delete') {
      // Check if the entity was created offline (never existed on server)
      const hasCreate = ops.some((o) => o.action === 'create');
      if (hasCreate) {
        // Created and deleted offline — remove ALL ops including the delete
        const idsToRemove = ops.map((o) => o.id!).filter(Boolean);
        await offlineDB.syncQueue.bulkDelete(idsToRemove);
        removed += idsToRemove.length;
      } else {
        // Only keep the delete, remove updates
        const idsToRemove = ops.slice(0, -1).map((o) => o.id!).filter(Boolean);
        await offlineDB.syncQueue.bulkDelete(idsToRemove);
        removed += idsToRemove.length;
      }
    } else {
      // Keep only the latest operation for this entity
      const idsToRemove = ops.slice(0, -1).map((o) => o.id!).filter(Boolean);
      await offlineDB.syncQueue.bulkDelete(idsToRemove);
      removed += idsToRemove.length;
    }
  }

  return removed;
}
