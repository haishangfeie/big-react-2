import { Action, ReactContext } from 'shared/ReactTypes';

export interface Dispatcher {
  useState: <S>(initialState: S | (() => S)) => [S, Dispatch<S>];
  useEffect: (
    create: () => void | (() => void),
    deps: any[] | null | void
  ) => void;
  useTransition: () => [boolean, (cb: () => void) => void];
  useRef: <S>(initialValue: S) => { current: S };
  useContext: <T>(context: ReactContext<T>) => T;
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
