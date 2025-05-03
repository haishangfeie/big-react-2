import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
  useState: <S>(initialState: S | (() => S)) => [S, Dispatch<S>];
}

export type Dispatch<S> = (action: Action<S>) => void;

const currentDispatcher: { current: Dispatcher | null } = {
  current: null
};

export const resolveDispatcher = () => {
  const dispatcher = currentDispatcher.current;

  if (dispatcher === null) {
    throw new Error('hook只能在函数组件中使用');
  }

  return dispatcher;
};

export default currentDispatcher;
