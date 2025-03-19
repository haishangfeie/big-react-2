import {
  appendInitialChild,
  Container,
  createInstance,
  createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { NoFlags } from './fiberFlags';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      } else {
        const instance = createTextInstance(pendingProps.content);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostRoot:
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
  let child = wip.child;
  if (child !== null) {
    child.return = wip;
  }

  while (child !== null) {
    if (child.tag === HostComponent || child.tag === HostText) {
      appendInitialChild(parent, child.stateNode);
    } else if (child.child !== null) {
      child.child.return = child;
      child = child.child;
      continue;
    }
    if (child === null) {
      return;
    }
    while ((child as FiberNode).sibling === null) {
      child = (child as FiberNode).return;
      if (child === wip) {
        return;
      }
    }
    child = (child as FiberNode).sibling;
  }
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;

  let child = wip.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child = child.sibling;
  }
  wip.subtreeFlags = subtreeFlags;
  return null;
}
