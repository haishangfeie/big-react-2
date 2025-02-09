import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { Container } from 'hostConfig';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

export const createContainer = (container: Container) => {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
};

export const updateContainer = (
  element: ReactElementType | null,
  root: FiberRootNode
) => {
  const hostRootFiber = root.current;

  enqueueUpdate(
    hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
    createUpdate(element)
  );
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
};
