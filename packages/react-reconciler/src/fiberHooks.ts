import { FiberNode } from './fiber';

export function renderWidthHooks(wip: FiberNode) {
  const Component = wip.type;
  const props = wip.pendingProps;
  return Component(props);
}
