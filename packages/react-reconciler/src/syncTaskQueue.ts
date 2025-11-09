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

export function flushSyncCallback() {
  if (syncQueue.length) {
    if (__DEV__) {
      console.log('flushSyncCallback开始执行');
    }
    try {
      console.log('syncQueue.length', syncQueue.length);
      syncQueue.forEach((cb) => cb());
    } catch (error) {
      console.log('flushSyncCallback 报错', error);
    } finally {
      isFlushingSyncQueue = false;
      syncQueue = [];
      if (__DEV__) {
        console.log('flushSyncCallback完成');
      }
    }
  }
}
