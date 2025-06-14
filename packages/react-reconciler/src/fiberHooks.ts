import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

export type Hook = {
  memoizedState: any;
  updateQueue: unknown;
  next: Hook | null;
};

const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;

export function renderWidthHooks(wip: FiberNode) {
  // 设置当前的fiber
  currentlyRenderingFiber = wip;
  workInProgressHook = null;
  wip.memoizedState = null;

  const current = wip.alternate;

  if (current !== null) {
    // update
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount;
  }

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // 重置
  currentlyRenderingFiber = null;

  return children;
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState
};

function mountState<S>(initialState: S | (() => S)): [S, Dispatch<S>] {
  if (currentlyRenderingFiber === null) {
    throw new Error('useState只能在函数组件中使用');
  }
  const hook = mountWorkInProgressHook();

  let memoizedState;
  if (initialState instanceof Function) {
    memoizedState = initialState();
  } else {
    memoizedState = initialState;
  }
  hook.memoizedState = memoizedState;

  const updateQueue = createUpdateQueue<S>();
  hook.updateQueue = updateQueue;

  const fiber = currentlyRenderingFiber;
  const dispatch = (action: Action<S>) => {
    dispatchSetState(fiber, updateQueue, action);
  };
  updateQueue.dispatch = dispatch;

  return [memoizedState, dispatch];
}

function dispatchSetState<S>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<S>,
  action: Action<S>
) {
  const update = createUpdate(action);
  enqueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook() {
  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null
  };

  if (workInProgressHook === null) {
    // 第一个hook
    if (currentlyRenderingFiber === null) {
      throw new Error('请在函数组件内调用hook');
    }
    currentlyRenderingFiber.memoizedState = hook;
    workInProgressHook = hook;
  } else {
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }

  return hook;
}
