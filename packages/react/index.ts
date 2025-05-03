import { jsxDEV } from './src/jsx';
import currentDispatcher, {
  resolveDispatcher,
  Dispatcher
} from './src/currentDispatcher';

export const useState: Dispatcher['useState'] = (initState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ = {
  currentDispatcher
};

export default {
  version: '0.0.0',
  createElement: jsxDEV
};
