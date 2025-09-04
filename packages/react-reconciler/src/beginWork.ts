import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './workTags';
import { reconcileChildFibers, mountChildFibers } from './childFiber';
import { renderWidthHooks } from './fiberHooks';
import { Lane } from './fiberLanes';

export function beginWork(wip: FiberNode, renderLane: Lane): FiberNode | null {
  switch (wip.tag) {
    case HostRoot:
      return updateHootRoot(wip, renderLane);
    case HostComponent:
      return updateHostComponent(wip);
    case HostText:
      return null;
    case FunctionComponent:
      return updateFunctionComponent(wip, renderLane);
    case Fragment:
      return updateFragment(wip);
      break;
    default: {
      if (__DEV__) {
        console.warn('beginWork未实现的类型', wip);
      }
    }
  }

  return null;
}

function updateHootRoot(wip: FiberNode, renderLane: Lane) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType | null>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
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

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
  const children = renderWidthHooks(wip, renderLane);
  reconcileChildren(wip, children);
  return wip.child;
}

function updateFragment(wip: FiberNode) {
  const children = wip.pendingProps;
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
