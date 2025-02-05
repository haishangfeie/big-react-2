import { Action } from 'shared/ReactTypes';

export interface Update<State> {
  action: Action<State>;
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
  return {
    action
  };
};

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
  return {
    shared: {
      pending: null
    }
  };
};

export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>
) => {
  updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State>
): { memoizedState: State | null } => {
  if (pendingUpdate !== null) {
    const action = pendingUpdate.action;
    if (typeof action === 'function') {
      return { memoizedState: (action as (state: State) => State)(baseState) };
    }
    return { memoizedState: action };
  }
  return {
    memoizedState: null
  };
};
