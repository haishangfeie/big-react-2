import { FiberNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberNode) {
  workInProgress = fiber;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderRoot(root: FiberNode) {
  // 初始化
  prepareFreshStack(root);

  try {
    workLoop();
  } catch (error) {
    console.warn('renderRoot报错', error);
    workInProgress = null;
  }
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);
  fiber.memoizedProps = fiber.pendingProps;

  if (next !== null) {
    workInProgress = next;
  } else {
    completeUnitOfWork(fiber);
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
