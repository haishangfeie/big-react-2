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
