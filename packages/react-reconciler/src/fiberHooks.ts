import internals from 'shared/internals';
import { FiberNode } from './fiber';

export type Hook = {
  memoizedState: any;
  updateQueue: unknown;
  next: Hook | null;
};

const { currentDispatcher } = internals;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentlyRenderingFiber: FiberNode | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let workInProgressHook: Hook | null = null;

export function renderWidthHooks(wip: FiberNode) {
  // 设置当前的fiber
  currentlyRenderingFiber = wip;
  workInProgressHook = null;

  const current = wip.alternate;

  if (current !== null) {
    // update
  } else {
    // mount
    currentDispatcher.current = {
      // TODO: 待处理
      useState: (() => []) as any
    };
  }

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // 重置
  currentlyRenderingFiber = null;

  return children;
}
