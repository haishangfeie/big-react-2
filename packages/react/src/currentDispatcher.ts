import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
  current: Dispatch | null;
}

export type Dispatch = {
  useState: <S>(initState: S | (() => S)) => [S, (action: Action<S>) => void];
};
const dispatcher: Dispatcher = {
  current: null
};

export const resolveDispatcher = () => {
  const current = dispatcher.current;

  if (current === null) {
    throw new Error('hook只能在react上下文中使用');
  }

  return current;
};
