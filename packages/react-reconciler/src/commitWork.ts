import {
  appendChildToContainer,
  commitUpdate,
  Container,
  removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
  ChildDeletion,
  MutationMask,
  NoFlags,
  Placement,
  Update
} from './fiberFlags';
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
    const child: FiberNode | null = nextEffect.child;
    if (
      (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
      child !== null
    ) {
      nextEffect = child;
      continue;
    }

    while (nextEffect !== null) {
      commitMutationEffectsOnFiber(nextEffect);
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
  if ((flags & Update) !== NoFlags) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }

  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = finishedWork.deletions || [];
    deletions.forEach((childToDelete) => {
      commitDeletion(childToDelete);
    });
    finishedWork.flags &= ~ChildDeletion;
  }
};

const commitPlacement = (finishedWork: FiberNode) => {
  /* 1. 找到有parent container，2. 找到当前fiber对应的 dom 3. 将dom挂到parent上 */
  if (__DEV__) {
    console.warn('执行Placement操作', finishedWork);
  }
  const parent = getHostParent(finishedWork);
  if (parent) {
    appendPlacementNodeIntoContainer(finishedWork, parent);
  }
};

const commitDeletion = (childToDelete: FiberNode) => {
  let rootHostNode: FiberNode | null = null;

  commitNestedComponent(childToDelete, (fiber) => {
    switch (fiber.tag) {
      case HostComponent:
        // todo: 解绑ref
        if (rootHostNode === null) {
          rootHostNode = fiber;
        }
        break;
      case HostText:
        if (rootHostNode === null) {
          rootHostNode = fiber;
        }
        break;
      case FunctionComponent:
        // todo: 处理useEffect unmount
        break;
      default:
        if (__DEV__) {
          console.warn('unmount未处理的fiber', fiber);
        }
        break;
    }
  });

  if (rootHostNode) {
    const hostParent = getHostParent(rootHostNode);
    if (hostParent) {
      removeChild(rootHostNode, hostParent);
    }
  }
  childToDelete.return = null;
  childToDelete.child = null;
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

const commitNestedComponent = (
  root: FiberNode,
  onCommitUnmount: (fiber: FiberNode) => void
) => {
  let node: FiberNode | null = root;
  while (true) {
    onCommitUnmount(node);

    if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === root || node === null) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === root || node.return === null) {
        return;
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
};
