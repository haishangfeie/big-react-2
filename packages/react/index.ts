import { jsx } from './src/jsx';
export { Fragment } from './src/jsx';
import currentDispatcher, {
  resolveDispatcher,
  Dispatcher
} from './src/currentDispatcher';

export { isValidElement } from './src/jsx';

export const useState: Dispatcher['useState'] = (initState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ = {
  currentDispatcher
};

export const version = '0.0.0';

// TODO: 后续createElement应根据环境使用jsx和jsxDEV
export const createElement = jsx;
