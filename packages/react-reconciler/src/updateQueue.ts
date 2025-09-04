import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane, NoLane } from './fiberLanes';

export interface Update<State> {
  action: Action<State>;
  /* 
    之所以 update要新增next属性，是因为react 要实现批处理（多次触发更新合并为一次更新处理）。实现批处理，意味着一次更新的流程里面，需要记录多次update，要在现有结构上支持顺序处理update，因此将update改造为一个闭环链表。
   */
  next: Update<any> | null;
  lane: Lane;
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
  dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(
  action: Action<State>,
  lane: Lane
): Update<State> => {
  return {
    action,
    next: null,
    lane
  };
};

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
  return {
    shared: {
      pending: null
    },
    dispatch: null
  };
};

export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>
) => {
  const pending = updateQueue.shared.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null,
  renderLane: Lane
): { memoizedState: State } => {
  let newState = baseState;
  if (pendingUpdate !== null) {
    const first = pendingUpdate.next;
    let currentUpdate = first;
    if (currentUpdate !== null) {
      do {
        const action = currentUpdate.action;
        const lane = currentUpdate.lane;
        if ((lane & renderLane) === NoLane) {
          currentUpdate = currentUpdate.next as Update<State>;
          continue;
        }
        if (action instanceof Function) {
          newState = action(newState);
        } else {
          newState = action;
        }
        currentUpdate = currentUpdate.next as Update<State>;
      } while (currentUpdate !== first);
    } else {
      // 因为pendingUpdate存在是，应该是闭环链表
      console.error('currentUpdate不应该是null');
    }
  }

  return {
    memoizedState: newState
  };
};
