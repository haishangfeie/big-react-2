import { FiberRootNode } from './fiber';
import { Lane } from './fiberLanes';
import { Wakeable } from 'shared/ReactTypes';
import { markRootUpdated, ensureRootIsScheduled } from './workLoop';
import { getSuspenseHandler } from './suspenseContext';
import { ShouldCapture } from './fiberFlags';

export function throwException(root: FiberRootNode, value: any, lane: Lane) {
  // Error Boundary 也可以在这里实现

  // thenable
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  ) {
    const wakeable: Wakeable = value;
    // 设置副作用
    const suspense = getSuspenseHandler();
    if (suspense) {
      suspense.flags |= ShouldCapture;
    }
    attachPingListener(root, wakeable, lane);
  }
}

function attachPingListener(
  root: FiberRootNode,
  wakeable: Wakeable,
  lane: Lane
) {
  let threadIDs: Set<Lane> | void;
  let pingCache = root.pingCache;

  const ping = () => {
    (pingCache as WeakMap<Wakeable<any>, Set<Lane>>).delete(wakeable);
    // promise状态变化时触发更新
    markRootUpdated(root, lane);
    ensureRootIsScheduled(root);
  };

  if (pingCache === null) {
    pingCache = root.pingCache = new WeakMap();
  }
  if (!pingCache.has(wakeable)) {
    threadIDs = new Set();
    pingCache.set(wakeable, threadIDs);
  } else {
    threadIDs = pingCache.get(wakeable);
  }

  if (!(threadIDs as Set<Lane>).has(lane)) {
    (threadIDs as Set<Lane>).add(lane);
    wakeable.then(ping, ping);
  }
}
