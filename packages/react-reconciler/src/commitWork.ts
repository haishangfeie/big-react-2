import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './workTags';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (finishedWork: FiberNode) => {
  /* 我要做什么？我现在处理的Mutation阶段，因此看的是MutationMask相关的副作用
    通过subtreeFlags 往下遍历，直到subtreeFlags不存在，那么当前节点就
    只有本身有副作用，然后处理Placement(暂时只处理这个副作用)
  */
  nextEffect = finishedWork;

  while (nextEffect !== null) {
    if (
      (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
      nextEffect.child
    ) {
      nextEffect = nextEffect.child;
      continue;
    }
    commitMutationEffectsOnFiber(nextEffect);
    while (nextEffect !== null) {
      if (nextEffect.sibling) {
        nextEffect = nextEffect.sibling;
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
  const parent = getHostParent(finishedWork);
  appendPlacementNodeIntoContainer(finishedWork, parent);
};

const getHostParent = (fiber: FiberNode) => {
  let node: FiberNode | null = fiber;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      return node.stateNode;
    }
    node = node.return;
  }
  console.warn('getHostParent获取parent失败');
  return null;
};

const appendPlacementNodeIntoContainer = (
  finishedWork: FiberNode,
  parent: Container
) => {
  let node: FiberNode | null = finishedWork;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendChildToContainer(parent, node.stateNode);
    } else if (node.tag === FunctionComponent || node.tag === HostRoot) {
      if (node.child) {
        node = node.child;
        continue;
      }
    }
    while (node !== null) {
      if (node.sibling) {
        node = node.sibling;
        break;
      } else {
        node = node.return;
        if (node === finishedWork) {
          return;
        }
      }
    }
  }
};
