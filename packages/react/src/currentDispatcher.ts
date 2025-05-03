import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
  useState: <S>(initState: S | (() => S)) => [S, Dispatch<S>];
}

export type Dispatch<S> = (action: Action<S>) => void;

const currentDispatcher: { current: Dispatcher | null } = {
  current: null
};

export const resolveDispatcher = () => {
  const current = currentDispatcher.current;

  if (current === null) {
    throw new Error('hook只能在函数组件中使用');
  }

  return current;
};

export default currentDispatcher;
