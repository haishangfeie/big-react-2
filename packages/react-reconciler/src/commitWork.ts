import {
  appendChildToContainer,
  commitUpdate,
  Container,
  insertChildToContainer,
  Instance,
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

  const sibling = getHostSibling(finishedWork);
  if (parent) {
    insertOrAppendPlacementNodeIntoContainer(
      finishedWork,
      parent,
      sibling?.stateNode
    );
  }
};

/* 
  目标：找到fiber对应dom的下一个稳定的dom
  考虑两种典型情况：
  1. <div><A/>
  function A(){
    return <div></div>
  }
  
  2. <A/><div/>
    function A(){
      // 是这里标记Placement
      return <div></div>
    }
    
  fiber需要往右找，为了找到相邻的sibling
  fiber需要往下找，深度优先遍历，为了找到稳定的dom节点
  fiber需要往上找，在fiber没有sibling时，尝试往上找到没有dom结构的fiber的sibling
*/
function getHostSibling(fiber: FiberNode) {
  let node: FiberNode | null = fiber;

  findSibling: while (node !== null) {
    if (node.sibling === null) {
      const parent: FiberNode | null = node.return;
      if (
        parent === null ||
        parent.tag === HostRoot ||
        parent.tag === HostComponent
      ) {
        return null;
      }
      node = parent;
      continue;
    }
    node.sibling.return = node.return;
    node = node.sibling;

    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        if ((node.flags & Placement) === NoFlags) {
          return node;
        }
      }
      const child: FiberNode | null = node.child;
      if (child) {
        child.return = node;
        node = child;
      } else {
        continue findSibling;
      }
    }
  }

  return null;
}

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
    const childrenToDelete: FiberNode[] = recordHostChildrenToDelete(
      childToDelete,
      rootHostNode
    );

    const hostParent = getHostParent(rootHostNode);
    if (hostParent) {
      childrenToDelete.forEach((node) => {
        removeChild(node.stateNode, hostParent);
      });
    }
  }
  childToDelete.return = null;
  childToDelete.child = null;
};

function recordHostChildrenToDelete(
  childToDelete: FiberNode,
  unmountFirstFiber: FiberNode
): FiberNode[] {
  const childrenToDelete = [unmountFirstFiber];

  let node = unmountFirstFiber;

  // 这时如果dom节点是在sibling 对应的dom相邻的dom节点就加入到数组
  // 怎么做呢？
  /*
      lastOne 可能有相邻的fiber,也可能没有
      也就是向右找邻fiber，接着往下找host 节点，
      就往上，再尝试往右
      也就是3个方向
      往右：找邻fiber
      往下：找host节点对应的fiber
      往上：找挂载非host fiber
    */
  findSibling: while (true) {
    // 向右：找sibling
    const sibling = node.sibling;

    if (sibling === null) {
      // 向上：找父节点
      const returnFiber = node.return;
      if (returnFiber === childToDelete || returnFiber === null) {
        break;
      }
      node = returnFiber;
      continue;
    }
    node = sibling;

    // 向下
    while (node) {
      if (node.tag === HostComponent || node.tag === HostText) {
        childrenToDelete.push(node);
        continue findSibling;
      }
      const child = node.child;
      if (child !== null) {
        node = child;
      } else {
        break;
      }
    }
  }

  return childrenToDelete;
}

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
const insertOrAppendPlacementNodeIntoContainer = (
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Instance
) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    }
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return;
  }
  let node = finishedWork.child;
  while (node !== null) {
    insertOrAppendPlacementNodeIntoContainer(node, hostParent);
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
