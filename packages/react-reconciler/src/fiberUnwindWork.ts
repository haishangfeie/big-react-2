import { FiberNode } from './fiber';
import { SuspenseComponent, ContextProvider } from './workTags';
import { popSuspenseHandler } from './suspenseContext';
import { ShouldCapture, DidCapture, NoFlags } from './fiberFlags';
import { popProvider } from './fiberContext';

export function unwindWork(wip: FiberNode) {
  switch (wip.tag) {
    case SuspenseComponent:
      popSuspenseHandler();
      if (
        (wip.flags & ShouldCapture) !== NoFlags &&
        (wip.flags & DidCapture) === NoFlags
      ) {
        wip.flags = (wip.flags & ~ShouldCapture) | DidCapture;
      }
      return wip;
    case ContextProvider: {
      const Provider = wip.type;
      const context = Provider._context;
      popProvider(context);
      return null;
    }
    default:
      break;
  }
  return null;
}
