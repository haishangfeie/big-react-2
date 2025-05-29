import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './workTags';
import { reconcileChildFibers, mountChildFibers } from './childFiber';
import { renderWidthHooks } from './fiberHooks';

export function beginWork(wip: FiberNode): FiberNode | null {
  switch (wip.tag) {
    case HostRoot:
      return updateHootRoot(wip);
    case HostComponent:
      return updateHostComponent(wip);
    case HostText:
      return null;
    case FunctionComponent:
      return updateFunctionComponent(wip);
    default: {
      if (__DEV__) {
        console.warn('beginWork未实现的类型', wip);
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

function updateFunctionComponent(wip: FiberNode) {
  const children = renderWidthHooks(wip);
  reconcileChildren(wip, children);
  return wip.child;
}

function reconcileChildren(wip: FiberNode, newChild: ReactElementType | null) {
  const current = wip.alternate;
  if (current === null) {
    wip.child = mountChildFibers(wip, null, newChild);
  } else {
    wip.child = reconcileChildFibers(wip, current.child, newChild);
  }
}
