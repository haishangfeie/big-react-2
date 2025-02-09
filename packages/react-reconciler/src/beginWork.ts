import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTags';
import { reconcileChildFibers, mountChildFibers } from './childFiber';

export function beginWork(fiber: FiberNode): FiberNode | null {
  switch (fiber.tag) {
    case HostRoot:
      return updateHootRoot(fiber);
    case HostComponent:
      return updateHostComponent(fiber);
    case HostText:
      return null;
    default: {
      if (__DEV__) {
        console.warn('beginWork未实现的类型');
      }
    }
  }

  return null;
}

function updateHootRoot(wip: FiberNode) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType | null>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  const { memoizedState } = processUpdateQueue(baseState, pending);
  wip.memoizedState = memoizedState;
  const newChild = memoizedState;
  reconcileChildren(wip, newChild);
  return wip.child;
}

function updateHostComponent(wip: FiberNode) {
  const pendingProps = wip.pendingProps;
  const children = pendingProps.children;
  reconcileChildren(wip, children);
  return wip.child;
}

function reconcileChildren(wip: FiberNode, newChild: ReactElementType | null) {
  const current = wip.alternate;
  if (current === null) {
    mountChildFibers(wip, null, newChild);
  } else {
    reconcileChildFibers(wip, current, newChild);
  }
}
