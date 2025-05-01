import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (finishedWork: FiberNode) => {
  /* 我要做什么？我现在处理的Mutation阶段，因此看的是MutationMask相关的副作用
    通过subtreeFlags 往下遍历，直到subtreeFlags不存在，那么当前节点就
    只有本身有副作用，然后处理Placement(暂时只处理这个副作用)
  */
  nextEffect = finishedWork;

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child;
    if (
      (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
      child !== null
    ) {
      nextEffect = child;
      continue;
    }
    commitMutationEffectsOnFiber(nextEffect);
    while (nextEffect !== null) {
      const sibling: FiberNode | null = nextEffect.sibling;
      if (sibling) {
        nextEffect = sibling;
        break;
      } else {
        nextEffect = nextEffect.return;
      }
    }
  }
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
  const flags = finishedWork.flags;
  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
};

const commitPlacement = (finishedWork: FiberNode) => {
  /* 1. 找到有parent container，2. 找到当前fiber对应的 dom 3. 将dom挂到parent上 */
  if (__DEV__) {
    console.warn('执行Placement操作', finishedWork);
  }
  const parent = getHostParent(finishedWork);
  appendPlacementNodeIntoContainer(finishedWork, parent);
};

const getHostParent = (fiber: FiberNode) => {
  let node: FiberNode | null = fiber.return;
  while (node !== null) {
    if (node.tag === HostComponent) {
      return node.stateNode;
    }
    if (node.tag === HostRoot) {
      return (node.stateNode as FiberRootNode).container;
    }
    node = node.return;
  }
  if (__DEV__) {
    console.warn('getHostParent获取parent失败');
  }
  return null;
};

/**
 * 这个方法的作用就是获取到fiber对应的dom，将dom插入到父节点上
 * @param finishedWork
 * @param hostParent
 * @returns
 */
const appendPlacementNodeIntoContainer = (
  finishedWork: FiberNode,
  hostParent: Container
) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    return appendChildToContainer(hostParent, finishedWork.stateNode);
  }
  let node = finishedWork.child;
  while (node !== null) {
    appendPlacementNodeIntoContainer(node, hostParent);
    const sibling = node.sibling;
    if (sibling) {
      node = sibling;
    } else {
      break;
    }
  }
};
