import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';
import { commitMutationEffects } from './commitWork';
import {
  getHighestPriorityLane,
  Lane,
  markRootFinished,
  mergeLanes,
  NoLane,
  SyncLane
} from './fiberLanes';
import { scheduleSyncCallback } from './syncTaskQueue';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;

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
    return;
  }
  if (lane === SyncLane) {
    // 同步优先级，使用微任务
    if (__DEV__) {
      console.log('在微任务中调度，优先级是', SyncLane);
    }
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    // 其他优先级使用宏任务
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
  // 初始化
  prepareFreshStack(root, SyncLane);

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
      workLoop();
      break;
    } catch (error) {
      console.warn('workLoop发生错误', error);
      workInProgress = null;
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);

  root.finishedWork = root.current.alternate;
  // 记录本次更新消费的lane
  root.finishedLane = wipRootRenderLane;
  wipRootRenderLane = NoLane;

  commitRoot(root);
}

function workLoop() {
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

  // 判断是否要执行3个子阶段
  // TODO: 当前仅判断mutation
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;

  if (rootHasEffect || subtreeHasEffect) {
    // TODO
    // mutation
    commitMutationEffects(finishedWork);

    // 在mutation结束，layout开始前切换fiber树
    root.current = finishedWork;
    // layout
  } else {
    root.current = finishedWork;
  }
}
