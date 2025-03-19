import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkType } from './workTags';
import { NoFlags, Flags } from './fiberFlags';
import { Container } from 'hostConfig';
export class FiberNode {
  tag: WorkType;
  key: Key;
  stateNode: any;
  type: any;

  // 构成树状结构
  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  ref: Ref;

  // 作为工作单元
  pendingProps: Props;
  memoizedProps: Props;
  memoizedState: any;
  alternate: FiberNode | null;
  updateQueue: unknown;
  flags: Flags;
  subtreeFlags: Flags;

  constructor(tag: WorkType, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key;
    this.stateNode = null;
    this.type = null;

    // 构成树状结构
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    this.ref = null;

    // 作为工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.memoizedState = null;
    this.alternate = null;
    this.updateQueue = null;
    // 副作用
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
  }
}

export class FiberRootNode {
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null;
  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;

    this.finishedWork = null;
  }
}

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
) => {
  let wip = current.alternate;
  if (wip === null) {
    wip = new FiberNode(current.tag, pendingProps, current.key);
    wip.stateNode = current.stateNode;
    wip.alternate = current;
    current.alternate = wip;
  } else {
    wip.pendingProps = current.pendingProps;
    wip.flags = NoFlags;
    wip.subtreeFlags = NoFlags;
  }
  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedState = current.memoizedState;
  wip.memoizedProps = current.memoizedProps;
  return wip;
};

export function createFiberFromElement(element: ReactElementType) {
  let tag: WorkType = FunctionComponent;
  const { type, props, key } = element;
  if (typeof type === 'string') {
    tag = HostComponent;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn(`createFiberFromElement未处理类型`, element);
  }
  const fiber = new FiberNode(tag, props, key);
  fiber.type = element.type;
  return fiber;
}
