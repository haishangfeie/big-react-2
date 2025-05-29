import {
  appendInitialChild,
  Container,
  createInstance,
  createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './workTags';
import { NoFlags, Update } from './fiberFlags';

const markUpdate = (fiber: FiberNode) => {
  fiber.flags |= Update;
  return fiber;
};

export function completeWork(wip: FiberNode) {
  const current = wip.alternate;
  const pendingProps = wip.pendingProps;
  switch (wip.tag) {
    case HostComponent:
      if (current !== null && wip.stateNode !== null) {
        // update
      } else {
        const instance = createInstance(wip.type, pendingProps);
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostText:
      if (current !== null && wip.stateNode !== null) {
        // update
        const oldText = current.pendingProps.content;
        const newText = pendingProps.content;
        if (oldText !== newText) {
          markUpdate(wip);
        }
      } else {
        const instance = createTextInstance(pendingProps.content);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostRoot:
      bubbleProperties(wip);
      return null;
    case FunctionComponent:
      bubbleProperties(wip);
      return null;
    default:
      console.warn(`未处理的completeWork类型${wip.tag}`, wip);
      return null;
  }
}

/* 
  <div>
    <div></div>
    <div></div>
  </div>

  <div>
    <A>
      div
      div
    </A>
    <div></div>
  </div>
*/
function appendAllChildren(parent: Container, wip: FiberNode) {
  let node = wip.child;
  if (node !== null) {
    node.return = wip;
  }

  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    while ((node as FiberNode).sibling === null) {
      node = (node as FiberNode).return;
      if (node === wip) {
        return;
      }
    }
    ((node as FiberNode).sibling as FiberNode).return = node;
    node = (node as FiberNode).sibling;
  }
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;

  let child = wip.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = wip;
    child = child.sibling;
  }
  wip.subtreeFlags = subtreeFlags;
  return null;
}
