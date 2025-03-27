import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';

let workInProgress: FiberNode | null = null;

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
  const root = markUpdateFromFiberToRoot(fiber);

  if (root !== null) {
    renderRoot(root);
  }
};

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

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderRoot(root: FiberRootNode) {
  // 初始化
  prepareFreshStack(root);

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

  commitRoot(root);
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(wip: FiberNode) {
  const next = beginWork(wip);
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

  console.warn('commitRoot开始执行', finishedWork);

  // 重置
  root.finishedWork = null;

  // 判断是否要执行3个子阶段
  // TODO: 当前仅判断mutation
  const hasMutationEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  const hasMutationSubtreeEffect =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;

  if (hasMutationEffect || hasMutationSubtreeEffect) {
    // TODO
  }
}
