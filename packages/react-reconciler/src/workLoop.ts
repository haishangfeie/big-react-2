import {
  createWorkInProgress,
  FiberNode,
  FiberRootNode,
  PendingPassiveEffects
} from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import {
  MutationMask,
  NoFlags,
  PassiveEffect,
  PassiveMask
} from './fiberFlags';
import {
  commitHookEffectListCreate,
  commitHookEffectListDestroy,
  commitHookEffectListUnmount,
  commitMutationEffects
} from './commitWork';
import {
  getHighestPriorityLane,
  Lane,
  lanesToSchedulerPriority,
  markRootFinished,
  mergeLanes,
  NoLane,
  SyncLane
} from './fiberLanes';
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue';
import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority,
  unstable_shouldYield as shouldYield,
  unstable_cancelCallback as cancelCallback
} from 'scheduler';
import { Effect } from './fiberHooks';
import { HookHasEffect, Passive } from './hookEffectTags';

type RootExitStatus = number;
const RootInComplete = 1; // 中断
const RootCompleted = 2; // 完成
// todo: 除了中断和完成，还可能是报错了

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffect: boolean = false;

export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
  const root = markUpdateFromFiberToRoot(fiber);

  if (root !== null) {
    markRootUpdated(root, lane);

    ensureRootIsScheduled(root);
  }
};

function ensureRootIsScheduled(root: FiberRootNode) {
  const lane = getHighestPriorityLane(root.pendingLanes);

  if (lane === NoLane) {
    if (root.callbackNode) {
      cancelCallback(root.callbackNode);
    }
    root.callbackNode = null;
    return;
  }

  if (root.callbackPriority === lane) {
    return;
  }

  // 重置
  if (root.callbackNode) {
    cancelCallback(root.callbackNode);
  }
  root.callbackNode = null;

  if (lane === SyncLane) {
    // 同步优先级，使用微任务
    if (__DEV__) {
      console.log('在微任务中调度，优先级是', SyncLane);
    }
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    // 其他优先级使用宏任务
    const schedulerPriority = lanesToSchedulerPriority(lane);
    root.callbackNode = scheduleCallback(
      schedulerPriority,
      performConCurrentWorkOnRoot.bind(null, root)
    );
  }
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

export const markUpdateFromFiberToRoot = (
  fiber: FiberNode
): FiberRootNode | null => {
  let node = fiber;
  while (node.return !== null) {
    node = node.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
};

function prepareFreshStack(root: FiberRootNode, renderLane: Lane) {
  root.finishedLane = NoLane;
  root.finishedWork = null;
  workInProgress = createWorkInProgress(root.current, {});
  wipRootRenderLane = renderLane;
}

function performSyncWorkOnRoot(root: FiberRootNode) {
  if (__DEV__) {
    console.log('执行performSyncWorkOnRoot方法');
  }
  const nextLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane !== SyncLane) {
    // 这里有两种可能，一种是NoLane，一种是其他优先级
    // NoLane是不需要执行渲染，其他优先级是要执行渲染，这里可以统一用ensureRootIsScheduled
    ensureRootIsScheduled(root);
    return;
  }
  if (__DEV__) {
    console.warn('render阶段开始');
  }
  const status = renderRoot(root, SyncLane, false);
  root.callbackPriority = SyncLane;

  if (status === RootCompleted) {
    root.finishedWork = root.current.alternate;
    // 记录本次更新消费的lane
    root.finishedLane = wipRootRenderLane;
    wipRootRenderLane = NoLane;
    root.callbackPriority = NoLane;
    root.callbackNode = null;
    commitRoot(root);
    return;
  } else if (__DEV__) {
    console.warn('同步更新state不应该不等于RootCompleted');
  }
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(wip: FiberNode) {
  const next = beginWork(wip, wipRootRenderLane);
  wip.memoizedProps = wip.pendingProps;

  if (next !== null) {
    workInProgress = next;
  } else {
    completeUnitOfWork(wip);
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  // let node = fiber;
  // completeWork(node);
  // const sibling = node.sibling;

  // if (sibling) {
  //   workInProgress = sibling;
  // } else {
  //   workInProgress = node.return;
  //   completeUnitOfWork(node.return as FiberNode);
  // }

  let node: FiberNode | null = fiber;
  while (node) {
    completeWork(node);
    const sibling = node.sibling;
    if (sibling) {
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  }
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn('commit阶段开始', finishedWork);
  }

  // 重置
  root.finishedWork = null;

  const lane = root.finishedLane;
  if (lane === NoLane && __DEV__) {
    console.error('commit阶段不应该存在root.finishedLane为NoLane');
  }
  root.finishedLane = NoLane;
  markRootFinished(root, lane);

  const rootNeedScheduleEffect = (finishedWork.flags & PassiveMask) !== NoFlags;
  const subtreeNeedScheduleEffect =
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags;
  if (rootNeedScheduleEffect || subtreeNeedScheduleEffect) {
    // 调度effect
    if (!rootDoesHasPassiveEffect) {
      rootDoesHasPassiveEffect = true;
      scheduleCallback(NormalPriority, () => {
        // 执行effect回调
        flushPassiveEffects(root.pendingPassiveEffects);
        rootDoesHasPassiveEffect = false;
        console.log('同步执行');
        flushSyncCallback();
      });
    }
  }

  // 判断是否要执行3个子阶段
  // TODO: 当前仅判断mutation
  const rootHasMutation = (finishedWork.flags & MutationMask) !== NoFlags;
  const subtreeHasMutation =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & PassiveEffect) !== NoFlags;
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & PassiveEffect) !== NoFlags;
  if (
    rootHasMutation ||
    subtreeHasMutation ||
    rootHasEffect ||
    subtreeHasEffect
  ) {
    // TODO
    // mutation
    commitMutationEffects(finishedWork, root);

    // 在mutation结束，layout开始前切换fiber树
    root.current = finishedWork;
    // layout
  } else {
    root.current = finishedWork;
  }

  ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
  // 先执行组件卸载
  // 再执行上一轮destroy
  // 最后执行本次create
  pendingPassiveEffects.unmount.forEach((lastEffect: Effect) => {
    commitHookEffectListUnmount(Passive, lastEffect);
  });
  pendingPassiveEffects.update.forEach((lastEffect: Effect) => {
    commitHookEffectListDestroy(Passive | HookHasEffect, lastEffect);
  });
  pendingPassiveEffects.update.forEach((lastEffect: Effect) => {
    commitHookEffectListCreate(Passive | HookHasEffect, lastEffect);
  });

  pendingPassiveEffects.unmount = [];
  pendingPassiveEffects.update = [];
}

function performConCurrentWorkOnRoot(
  root: FiberRootNode,
  didTimeout: boolean
): any {
  if (__DEV__) {
    console.log('执行performConCurrentWorkOnRoot方法');
  }
  const nextLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane === NoLane) {
    if (root.callbackNode) {
      cancelCallback(root.callbackNode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }
  flushPassiveEffects(root.pendingPassiveEffects);
  const newLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane !== newLane) {
    return;
  }

  const status = renderRoot(root, nextLane, !didTimeout);
  root.callbackPriority = nextLane;
  if (status === RootCompleted) {
    root.finishedWork = root.current.alternate;
    // 记录本次更新消费的lane
    root.finishedLane = wipRootRenderLane;
    wipRootRenderLane = NoLane;
    root.callbackPriority = NoLane;
    root.callbackNode = null;
    commitRoot(root);
    return;
  }

  if (status === RootInComplete) {
    const prevCb = root.callbackNode;
    ensureRootIsScheduled(root);
    if (prevCb === root.callbackNode && root.callbackNode) {
      return performConCurrentWorkOnRoot.bind(null, root);
    } else {
      return;
    }
  }

  if (__DEV__) {
    console.warn('并发更新还没实现的结束状态');
  }
}

function renderRoot(
  root: FiberRootNode,
  lane: Lane,
  shouldTimeSlice: boolean
): RootExitStatus {
  if (__DEV__) {
    console.log(`render阶段进行${shouldTimeSlice ? '并发' : '同步'}更新`);
  }
  if (wipRootRenderLane !== lane) {
    // 初始化
    prepareFreshStack(root, lane);
  }

  // try {
  //   workLoop();
  // } catch (error) {
  //   console.warn('workLoop发生错误', error);
  //   workInProgress = null;
  // }

  // 这里的实现好奇怪，这里的实现和上面的实现效果似乎是一样的
  // 两段代码的区别其实是在出错时，下面的代码会再执行workLoop
  // 但是因为workInProgress为null，因此workLoop的执行不会执行任何有意义的工作
  // 一个合理的推测是这里的do...while是后续的代码会用到的
  do {
    try {
      if (shouldTimeSlice) {
        workLoopConcurrent();
      } else {
        workLoopSync();
      }
      break;
    } catch (error) {
      console.warn('workLoop发生错误', error);
      workInProgress = null;
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);

  // 中断或者完成
  if (shouldTimeSlice && workInProgress !== null) {
    return RootInComplete;
  }

  if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
    console.error('同步更新，render阶段结束时wip不应该不是null');
  }
  // TODO: 没有处理报错的场景

  return RootCompleted;
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
