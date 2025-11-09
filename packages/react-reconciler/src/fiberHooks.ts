import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
  UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { Lane, NoLane, requestUpdateLane } from './fiberLanes';
import { EffectTag, HookHasEffect, Passive } from './hookEffectTags';
import { PassiveEffect } from './fiberFlags';

export type Hook = {
  memoizedState: any;
  updateQueue: UpdateQueue<any> | null;
  next: Hook | null;
};

type EffectCallback = () => void | EffectCleanup;
type EffectCleanup = () => void;
type EffectDeps = any[] | null;

export type Effect = {
  tag: EffectTag;
  create: EffectCallback | void;
  destroy: EffectCleanup | void;
  deps: EffectDeps;
  next: Effect | null;
};

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
  lastEffect: Effect | null;
}

const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
// currentHook存的是currentFiber里当前指向的hook
let currentHook: Hook | null = null;

let currentRenderLane = NoLane;

export function renderWidthHooks(wip: FiberNode, renderLane: Lane) {
  // 设置当前的fiber
  currentlyRenderingFiber = wip;
  workInProgressHook = null;
  wip.memoizedState = null;
  // 重置effect链表
  wip.updateQueue = null;
  currentRenderLane = renderLane;

  const current = wip.alternate;

  if (current !== null) {
    // update
    currentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount;
  }

  const Component = wip.type;
  const props = wip.pendingProps;
  const children = Component(props);

  // 重置
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  currentRenderLane = NoLane;
  return children;
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
  useEffect: mountEffect
};

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
  useEffect: updateEffect
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

function updateState<S>(): [S, Dispatch<S>] {
  if (currentlyRenderingFiber === null) {
    throw new Error('useState只能在函数组件中使用');
  }
  const hook = updateWorkInProgressHook();

  const { memoizedState: oldState } = hook;
  const updateQueue = hook.updateQueue as UpdateQueue<S>;

  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  if (pending !== null) {
    const { memoizedState } = processUpdateQueue(
      oldState,
      pending,
      currentRenderLane
    );
    hook.memoizedState = memoizedState;
  }

  return [
    hook.memoizedState,
    /* 
      updateQueue.dispatch 这里我还是有疑问的：
      dispatch是应该要复用原来的函数，因为这样才能保证引用不变，
      useCallback时即便数组传入dispatch，也不会导致更多的更新
      但是dispatch里面之前是提前存入了fiber，这个fiber岂不是一直都是旧的fiber

      AI的解答
      你的代码实现和 React 源码中的设计思路是 一致的，这个 dispatch 函数确实会在首次 mount 的时候生成，并复用到后续的更新中。原因如下：

      dispatch 引用 fiber 是合理且安全的：

      React 中的更新并不要求 dispatch 拿到的是“最新的 Fiber”，而是可以接受它拿到的是那个函数组件对应的 current Fiber，因为：

      在调度更新时，scheduleUpdateOnFiber(fiber) 会根据这个 fiber 去找到它的 alternate（也就是当前的或最新的 wip）。

      你 dispatch 的只是“触发更新”这个动作，真正的计算会发生在 render 时的新 fiber 上。

      换句话说，React 不依赖 dispatch 引用的 fiber 是最新的，而是让调度系统去根据这个 fiber 找到最新状态并执行更新流程。

      为什么要复用 dispatch 函数：

      这是为了让 useCallback(fn, [dispatch]) 等语义成立。只有保证 dispatch 在生命周期内引用不变，React 才能避免不必要的重渲染或副作用执行。
    */
    updateQueue.dispatch as Dispatch<S>
  ];
}

function dispatchSetState<S>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<S>,
  action: Action<S>
) {
  const lane = requestUpdateLane();
  const update = createUpdate(action, lane);
  enqueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(fiber, lane);
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

function updateWorkInProgressHook() {
  // TODO: render 阶段触发的更新
  if (currentlyRenderingFiber === null) {
    // 获取hook时一定是要在函数组件内，因此获取不到currentlyRenderingFiber是不正常的
    throw new Error('获取hook必须要在函数组件内');
  }
  let nextHook: Hook | null = null;
  if (currentHook === null) {
    // 当前函数的第一个hook
    const currentFiber = currentlyRenderingFiber.alternate;
    if (currentFiber === null) {
      throw new Error('更新时currentFiber不应该为null');
    }
    const memoizedState = currentFiber.memoizedState;

    nextHook = memoizedState || null;
  } else {
    // 说明当前的hook不是函数里的第一个hook对象
    nextHook = currentHook.next;
  }
  if (nextHook === null) {
    // 组件本次执行的hook比上次执行的多
    throw new Error(
      '当前执行函数的hook比之前执行函数的hook多',
      currentlyRenderingFiber.type
    );
  }
  currentHook = nextHook;
  const newHook = {
    memoizedState: nextHook.memoizedState,
    updateQueue: nextHook.updateQueue,
    next: null
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = newHook;
    workInProgressHook = newHook;
  } else {
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }
  return workInProgressHook;
}

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
  if (currentlyRenderingFiber === null) {
    throw new Error('useEffect只能在函数组件中使用');
  }
  const hook = mountWorkInProgressHook();

  const fiber = currentlyRenderingFiber as FiberNode;
  fiber.flags |= PassiveEffect;
  const effect = pushEffect(
    Passive | HookHasEffect,
    create,
    void 0,
    deps || null
  );
  hook.memoizedState = effect;
}

function pushEffect(
  tag: EffectTag,
  create: EffectCallback | void,
  destroy: EffectCleanup | void,
  deps: EffectDeps
): Effect {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    next: null
  };
  const fiber = currentlyRenderingFiber as FiberNode;

  if (!fiber.updateQueue) {
    fiber.updateQueue = createFCUpdateQueue<any>();
    (fiber.updateQueue as FCUpdateQueue<any>).lastEffect = effect;
    effect.next = effect;
  } else {
    const lastEffect = (fiber.updateQueue as FCUpdateQueue<any>).lastEffect;

    if (!lastEffect) {
      (fiber.updateQueue as FCUpdateQueue<any>).lastEffect = effect;
      effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      (fiber.updateQueue as FCUpdateQueue<any>).lastEffect = effect;
    }
  }

  return effect;
}

function createFCUpdateQueue<State>(): FCUpdateQueue<State> {
  const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
  updateQueue.lastEffect = null;
  return updateQueue;
}

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
  if (currentlyRenderingFiber === null) {
    throw new Error('useEffect只能在函数组件中使用');
  }
  const hook = updateWorkInProgressHook();

  const nextDeps = deps || null;
  const prevEffect = hook.memoizedState;
  const prevDeps = prevEffect.deps;
  const destroy = prevEffect.destroy;

  if (!areHookInputsEqual(nextDeps, prevDeps)) {
    const effect = pushEffect(
      Passive | HookHasEffect,
      create,
      destroy,
      nextDeps
    );
    currentlyRenderingFiber.flags |= PassiveEffect;
    hook.memoizedState = effect;
    return;
  }
  const effect = pushEffect(Passive, create, destroy, nextDeps);
  hook.memoizedState = effect;
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
  if (nextDeps === null || prevDeps === null) {
    return false;
  }
  if (nextDeps.length !== prevDeps.length) {
    return false;
  }
  for (let i = 0; i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
