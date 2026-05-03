import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { isSubsetOfLanes, Lane, NoLane } from './fiberLanes';

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
  // 这个pendingUpdate应该在外部就已经和baseQueue进行了合并
  pendingUpdate: Update<State> | null,
  renderLane: Lane
): {
  memoizedState: State;
  baseState: State;
  baseQueue: Update<State> | null;
} => {
  let newState = baseState;
  let newBaseState = baseState;
  let newBaseQueue: Update<State> | null = null;

  if (pendingUpdate !== null) {
    const first = pendingUpdate.next;
    let pending = first;
    if (pending !== null) {
      let newBaseQueueFirst: Update<State> | null = null;
      let newBaseQueueLast: Update<State> | null = null;
      do {
        const action = pending.action;
        const lane = pending.lane;
        /* 
          更新要比较优先级，由isSubsetOfLanes控制Update是否跳过，
          如果跳过：
            判断是否是第一个跳过的Update
              是：
                同时newBaseState 得到确定
                记录newBaseQueueFirst/newBaseQueueLast
              否：
                构造newBaseQueue的链表(这个构造是通过操作newBaseQueueLast来完成的)（暂时不需要构成闭环链表，闭环是后面处理的）
          如果不跳过；
            消费更新
            如果已经有跳过的Update
              Update的优先级调整为NoLane，存入newBaseQueue里
        */
        // 更新要被跳过
        if (!isSubsetOfLanes(renderLane, lane)) {
          // 是否是第一个被跳过的
          const cloneUpdate = createUpdate(action, lane);
          if (newBaseQueueLast === null) {
            newBaseState = newState;
            newBaseQueueFirst = cloneUpdate;
            newBaseQueueLast = cloneUpdate;
          } else {
            newBaseQueueLast.next = cloneUpdate;
            newBaseQueueLast = cloneUpdate;
          }
          pending = pending.next as Update<State>;
          continue;
        }
        if (action instanceof Function) {
          newState = action(newState);
        } else {
          newState = action;
        }
        if (newBaseQueueLast !== null) {
          const cloneUpdate = createUpdate(action, NoLane);
          newBaseQueueLast.next = cloneUpdate;
          newBaseQueueLast = cloneUpdate;
        }
        // 使用 Update<any> 是为了避免类型系统在闭环链表遍历中强制要求每个 update 的 State 类型一致。
        // 实际上，整个队列通常是针对某个组件的状态类型，但 TypeScript 无法在链表结构中精确推断。
        // 因此这里使用 any 是一种类型擦除的策略，以保证遍历逻辑的通用性
        pending = pending.next as Update<any>;
      } while (pending !== first);

      if (newBaseQueueLast) {
        // 构成闭环链表
        newBaseQueueLast.next = newBaseQueueFirst;
        newBaseQueue = newBaseQueueLast;
      } else {
        // 本次计算没有更新被跳过
        newBaseState = newState;
      }
    } else {
      // 因为pendingUpdate存在是，应该是闭环链表
      console.error('currentUpdate不应该是null');
    }
  }

  return {
    memoizedState: newState,
    baseState: newBaseState,
    baseQueue: newBaseQueue
  };
};
