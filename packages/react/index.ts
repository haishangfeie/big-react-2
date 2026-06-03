import { jsx } from './src/jsx';
export { Fragment } from './src/jsx';
import currentDispatcher, {
  resolveDispatcher,
  Dispatcher
} from './src/currentDispatcher';
import currentBatchConfig from './src/currentBatchConfig';

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

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ = {
  currentDispatcher,
  currentBatchConfig
};

export const version = '0.0.0';

// TODO: 后续createElement应根据环境使用jsx和jsxDEV
export const createElement = jsx;
