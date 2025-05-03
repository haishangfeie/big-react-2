import { FiberNode } from './fiber';

export type Hook = {
  memoizedState: any;
  updateQueue: any;
  next: Hook;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentlyRenderingFiber: FiberNode | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let workInProgressHook: Hook | null = null;

export function renderWidthHooks(wip: FiberNode) {
  // 设置当前的fiber
  currentlyRenderingFiber = wip;
  workInProgressHook = null;

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // 重置
  currentlyRenderingFiber = null;

  return children;
}
