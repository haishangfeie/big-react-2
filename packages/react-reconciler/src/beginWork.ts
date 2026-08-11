import { ReactElementType } from 'shared/ReactTypes';
import {
  FiberNode,
  OffscreenProps,
  createFiberFromOffscreen,
  createFiberFromFragment,
  createWorkInProgress
} from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  ContextProvider,
  SuspenseComponent,
  OffscreenComponent
} from './workTags';
import {
  reconcileChildFibers,
  mountChildFibers,
  cloneChildFibers
} from './childFiber';
import { renderWithHooks, bailoutHook } from './fiberHooks';
import { Lane, NoLane, includeSomeLanes } from './fiberLanes';
import { Ref } from './fiberFlags';
import { pushProvider } from './fiberContext';
import { ChildDeletion, Placement } from './fiberFlags';
import { pushSuspenseHandler } from './suspenseContext';
import { DidCapture, NoFlags } from './fiberFlags';

let didReceiveUpdate = false;

export function markWipReceivedUpdate() {
  didReceiveUpdate = true;
}

export function beginWork(wip: FiberNode, renderLane: Lane): FiberNode | null {
  console.log('beginWork', wip);
  didReceiveUpdate = false;

  const current = wip.alternate;
  if (current) {
    if (
      current.memoizedProps !== wip.pendingProps ||
      current.type !== wip.type
    ) {
      didReceiveUpdate = true; // 接收更新就是不命中bailout
    } else {
      // 判断context、state ,通过lanes，不过暂时应该context没有改变lane?
      const hasScheduledStateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLane
      );
      if (!hasScheduledStateOrContext) {
        // 命中bailout
        switch (wip.tag) {
          case ContextProvider: {
            const pendingProps = wip.pendingProps;
            const value = pendingProps.value;
            const Provider = wip.type;
            const context = Provider._context;
            pushProvider(context, value);
            break;
            // TODO: Suspense 没有实现
          }
          default:
            break;
        }
        return bailoutOnAlreadyFinishedWork(wip, renderLane);
      }
    }
  }

  // beginWork会消费lane
  wip.lanes = NoLane;

  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip, renderLane);
    case HostComponent:
      return updateHostComponent(wip);
    case HostText:
      return null;
    case FunctionComponent:
      return updateFunctionComponent(wip, renderLane);
    case Fragment:
      return updateFragment(wip);
    case ContextProvider:
      return updateContextProvider(wip);
    case SuspenseComponent:
      return updateSuspenseComponent(wip);
    case OffscreenComponent:
      return updateOffscreenComponent(wip);
    default: {
      if (__DEV__) {
        console.warn('beginWork未实现的类型', wip);
      }
    }
  }

  return null;
}

function checkScheduledUpdateOrContext(
  current: FiberNode,
  renderLane: Lane
): boolean {
  if (includeSomeLanes(current.lanes, renderLane)) {
    return true;
  }
  return false;
}

function bailoutOnAlreadyFinishedWork(wip: FiberNode, renderLane: Lane) {
  if (!includeSomeLanes(wip.childLanes, renderLane)) {
    if (__DEV__) {
      console.warn('bailout整颗子树', wip);
    }
    return null;
  }
  if (__DEV__) {
    console.warn('bailout 当前的fiber的子fiber', wip);
  }
  cloneChildFibers(wip);
  return wip.child;
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType | null>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
  const current = wip.alternate;
  // 不过这里 实际上 current.memoizedState 应该和wip.memoizedState 是一样的，因为hostRoot都是通过createWorkInProgress创建的，而这个方法里面的wip.memoizedState 是等于 current.memoizedState的
  const prevChild = wip.memoizedState;
  if (current) {
    if (!current.memoizedState) {
      current.memoizedState = memoizedState;
    }
  }

  wip.memoizedState = memoizedState;

  if (prevChild === memoizedState) {
    return bailoutOnAlreadyFinishedWork(wip, renderLane);
  }
  const newChild = memoizedState;
  reconcileChildren(wip, newChild);
  return wip.child;
}

function updateHostComponent(wip: FiberNode) {
  const pendingProps = wip.pendingProps;
  const children = pendingProps.children;
  reconcileChildren(wip, children);
  markRef(wip.alternate, wip);
  return wip.child;
}

function markRef(current: FiberNode | null, workInProgress: FiberNode) {
  if (current === null) {
    if (workInProgress.ref) {
      workInProgress.flags |= Ref;
    }
  } else {
    if (current.ref !== workInProgress.ref) {
      workInProgress.flags |= Ref;
    }
  }
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
  const children = renderWithHooks(wip, renderLane);
  const current = wip.alternate;
  // 这里要判断current是因为只有update时didReceiveUpdate的状态才会因为计算state和原来不一致而变成true,mount时永远都是false，不加上current会以为每次都命中bailout
  if (current && !didReceiveUpdate) {
    bailoutHook(wip, renderLane);
    return bailoutOnAlreadyFinishedWork(wip, renderLane);
  }
  reconcileChildren(wip, children);
  return wip.child;
}

function updateFragment(wip: FiberNode) {
  const children = wip.pendingProps;
  reconcileChildren(wip, children);
  return wip.child;
}

function updateContextProvider(wip: FiberNode) {
  const pendingProps = wip.pendingProps;
  const children = pendingProps.children;
  const value = pendingProps.value;
  const Provider = wip.type;
  const context = Provider._context;
  pushProvider(context, value);
  reconcileChildren(wip, children);
  return wip.child;
}

function updateSuspenseComponent(wip: FiberNode) {
  pushSuspenseHandler(wip);
  const current = wip.alternate;
  // 是否挂起
  const didSuspend = (wip.flags & DidCapture) !== NoFlags;
  if (didSuspend) {
    wip.flags &= ~DidCapture;
  }

  const pendingProps = wip.pendingProps;
  const primaryChildren = pendingProps.children;
  const fallbackChildren = pendingProps.fallback;

  if (!current) {
    // mount
    if (didSuspend) {
      // 挂起
      return mountSuspenseFallbackChildren(
        wip,
        primaryChildren,
        fallbackChildren
      );
    } else {
      // 已解决(正常流程)
      return mountSuspensePrimaryChildren(wip, primaryChildren);
    }
  } else {
    // update
    if (didSuspend) {
      // 挂起
      return updateSuspenseFallbackChildren(
        wip,
        primaryChildren,
        fallbackChildren
      );
    } else {
      // 已解决(正常流程)
      return updateSuspensePrimaryChildren(wip, primaryChildren);
    }
  }
}

function mountSuspenseFallbackChildren(
  workInProgress: FiberNode,
  primaryChildren: any,
  fallbackChildren: any
) {
  const offscreenProps: OffscreenProps = {
    mode: 'hidden',
    children: primaryChildren
  };

  const primaryChildFragment = createFiberFromOffscreen(offscreenProps);
  const fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);

  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;

  return fallbackChildFragment;
}

function mountSuspensePrimaryChildren(
  workInProgress: FiberNode,
  primaryChildren: any
) {
  const offscreenProps: OffscreenProps = {
    mode: 'visible',
    children: primaryChildren
  };
  const primaryChildFragment = createFiberFromOffscreen(offscreenProps);
  primaryChildFragment.return = workInProgress;
  primaryChildFragment.sibling = null;
  workInProgress.child = primaryChildFragment;

  return primaryChildFragment;
}

function updateSuspenseFallbackChildren(
  workInProgress: FiberNode,
  primaryChildren: any,
  fallbackChildren: any
) {
  const offscreenProps: OffscreenProps = {
    mode: 'hidden',
    children: primaryChildren
  };

  const current = workInProgress.alternate as FiberNode;
  const currentPrimaryChildFragment = current.child as FiberNode;
  const currentFallbackChildFragment: FiberNode | null =
    currentPrimaryChildFragment.sibling;

  const primaryChildFragment = createWorkInProgress(
    currentPrimaryChildFragment,
    offscreenProps
  );
  let fallbackChildFragment;
  if (!currentFallbackChildFragment) {
    fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);
    fallbackChildFragment.flags |= Placement;
  } else {
    fallbackChildFragment = createWorkInProgress(
      currentFallbackChildFragment,
      fallbackChildren
    );
  }

  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  fallbackChildFragment.sibling = null;
  workInProgress.child = primaryChildFragment;

  return fallbackChildFragment;
}

function updateSuspensePrimaryChildren(
  workInProgress: FiberNode,
  primaryChildren: any
) {
  const offscreenProps: OffscreenProps = {
    mode: 'visible',
    children: primaryChildren
  };

  const current = workInProgress.alternate as FiberNode;
  const currentPrimaryChildFragment = current.child as FiberNode;
  const currentFallbackChildFragment: FiberNode | null =
    currentPrimaryChildFragment.sibling;

  const primaryChildFragment = createWorkInProgress(
    currentPrimaryChildFragment,
    offscreenProps
  );

  if (currentFallbackChildFragment) {
    const deletions = workInProgress.deletions;
    if (!deletions) {
      workInProgress.deletions = [currentFallbackChildFragment];
      workInProgress.flags |= ChildDeletion;
    } else {
      deletions.push(currentFallbackChildFragment);
    }
  }

  primaryChildFragment.return = workInProgress;
  primaryChildFragment.sibling = null;
  workInProgress.child = primaryChildFragment;

  return primaryChildFragment;
}

function updateOffscreenComponent(wip: FiberNode) {
  const pendingProps = wip.pendingProps;
  const children = pendingProps.children;
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
