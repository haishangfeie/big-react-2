import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { Container } from 'hostConfig';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  Update
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

export const createContainer = (container: Container) => {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  return root;
};

export const updateContainer = (
  element: ReactElementType | null,
  root: FiberRootNode
) => {
  const hostRootFiber = root.current;
  hostRootFiber.updateQueue = createUpdateQueue();
  enqueueUpdate(
    hostRootFiber.updateQueue,
    createUpdate(element) as Update<unknown>
  );
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
};
