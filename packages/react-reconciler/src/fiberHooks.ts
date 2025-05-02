import { FiberNode } from './fiber';

export function renderWidthHooks(wip: FiberNode) {
  const fn = wip.type;
  const props = wip.pendingProps;
  return fn(props);
}
