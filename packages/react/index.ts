import { jsxDEV } from './src/jsx';
import { resolveDispatcher } from './src/currentDispatcher';

export const useState = (initState: any) => {
  const dispatcher = resolveDispatcher();
  const useState = dispatcher.useState;
  return useState(initState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ = {};

export default {
  version: '0.0.0',
  createElement: jsxDEV
};
