import { jsx } from './src/jsx';
export {
  REACT_FRAGMENT_TYPE as Fragment,
  REACT_SUSPENSE_TYPE as Suspense
} from 'shared/ReactSymbols';
import currentDispatcher, {
  resolveDispatcher,
  Dispatcher
} from './src/currentDispatcher';
import currentBatchConfig from './src/currentBatchConfig';
import { Usable } from 'shared/ReactTypes';

export { isValidElement } from './src/jsx';

export { createContext } from './src/context';

export const useState: Dispatcher['useState'] = (initState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
};

export const useTransition: Dispatcher['useTransition'] = () => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
};

export const useRef: Dispatcher['useRef'] = (initialValue) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
};

export const useContext: Dispatcher['useContext'] = (context) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useContext(context);
};

export const use: Dispatcher['use'] = <T>(usable: Usable<T>) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.use(usable);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ = {
  currentDispatcher,
  currentBatchConfig
};

export const version = '0.0.0';

// TODO: 后续createElement应根据环境使用jsx和jsxDEV
export const createElement = jsx;
