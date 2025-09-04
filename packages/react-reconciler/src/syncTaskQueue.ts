import { scheduleMicroTask } from 'hostConfig';

let syncQueue: (() => void)[] = [];
let isFlushingSyncQueue = false;
export function scheduleSyncCallback(callback: () => void) {
  syncQueue.push(callback);
  if (!isFlushingSyncQueue) {
    isFlushingSyncQueue = true;
    scheduleMicroTask(flushSyncCallback);
  }
}

function flushSyncCallback() {
  if (syncQueue.length) {
    try {
      console.log('syncQueue.length', syncQueue.length);
      syncQueue.forEach((cb) => cb());
    } catch (error) {
      console.log('flushSyncCallback 报错', error);
    } finally {
      isFlushingSyncQueue = false;
      syncQueue = [];
    }
  }
}
