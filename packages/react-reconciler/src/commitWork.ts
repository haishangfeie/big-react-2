import {
  appendChildToContainer,
  commitUpdate,
  Container,
  insertChildToContainer,
  Instance,
  removeChild,
  hideInstance,
  unhideInstance,
  hideTextInstance,
  unhideTextInstance
} from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
  ChildDeletion,
  Flags,
  layoutMask,
  MutationMask,
  NoFlags,
  PassiveEffect,
  Placement,
  Ref,
  Update,
  Visibility
} from './fiberFlags';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  OffscreenComponent
} from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { EffectTag, HookHasEffect } from './hookEffectTags';

const commitMutationEffectsOnFiber = (
  finishedWork: FiberNode,
  root: FiberRootNode
) => {
  const { flags, tag } = finishedWork;

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
      commitDeletion(childToDelete, root);
    });
    finishedWork.flags &= ~ChildDeletion;
    finishedWork.flags &= ~Ref;
  }

  if ((flags & PassiveEffect) !== NoFlags) {
    // 收集effect回调
    commitPassiveEffect(finishedWork, root, 'update');
    finishedWork.flags &= ~PassiveEffect;
  }

  if ((flags & Ref) !== NoFlags && tag === HostComponent) {
    const current = finishedWork.alternate;
    if (current) {
      console.log('mutation 解绑旧ref', finishedWork);
      safelyDetachRef(finishedWork);
    }
  }
  if ((flags & Visibility) !== NoFlags && tag === OffscreenComponent) {
    const isHidden = finishedWork.pendingProps.mode === 'hidden';
    hideOrUnhideAllChildren(finishedWork, isHidden);
    finishedWork.flags &= ~Visibility;
  }
};

function hideOrUnhideAllChildren(finishedWork: FiberNode, isHidden: boolean) {
  findHostSubtreeRoot(finishedWork, (hostSubtreeRoot) => {
    const instance = hostSubtreeRoot.stateNode;
    if (hostSubtreeRoot.tag === HostComponent) {
      if (isHidden) {
        hideInstance(instance);
      } else {
        unhideInstance(instance);
      }
    } else if (hostSubtreeRoot.tag === HostText) {
      if (isHidden) {
        hideTextInstance(instance);
      } else {
        const text = hostSubtreeRoot.memoizedProps.content;
        unhideTextInstance(instance, text);
      }
    }
  });
}

function findHostSubtreeRoot(
  finishedWork: FiberNode,
  callback: (hostSubtreeRoot: FiberNode) => void
) {
  let node = finishedWork;
  let hostSubtreeRoot = null;
  while (true) {
    // 深度优先遍历
    if (node.tag === HostComponent) {
      if (!hostSubtreeRoot) {
        hostSubtreeRoot = node;
        callback(node);
      }
    } else if (node.tag === HostText) {
      if (!hostSubtreeRoot) {
        callback(node);
      }
    } else if (
      node.tag === OffscreenComponent &&
      node.pendingProps.mode === 'hidden' &&
      node !== finishedWork
    ) {
      // 什么都不用做
    } else if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === finishedWork) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === finishedWork || node.return === null) {
        return;
      }
      if (hostSubtreeRoot === node) {
        hostSubtreeRoot = null;
      }

      node = node.return as FiberNode;
    }
    if (hostSubtreeRoot === node) {
      hostSubtreeRoot = null;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

/* 我要做什么？我现在处理的Mutation阶段，因此看的是MutationMask相关的副作用
    通过subtreeFlags 往下遍历，直到subtreeFlags不存在，那么当前节点就
    只有本身有副作用，然后处理Placement(暂时只处理这个副作用)
  */
/*   let nextEffect: FiberNode | null = finishedWork;

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child;
    if (
      (nextEffect.subtreeFlags & (MutationMask | PassiveEffect)) !== NoFlags &&
      child !== null
    ) {
      nextEffect = child;
      continue;
    }

    while (nextEffect !== null) {
      commitMutationEffectsOnFiber(nextEffect, root);
      const sibling: FiberNode | null = nextEffect.sibling;
      if (sibling) {
        nextEffect = sibling;
        break;
      } else {
        nextEffect = nextEffect.return;
      }
    }
  } */
export const commitMutationEffects = commitEffects(
  MutationMask | PassiveEffect,
  commitMutationEffectsOnFiber
);

const commitPassiveEffect = (
  fiber: FiberNode,
  root: FiberRootNode,
  type: keyof PendingPassiveEffects
) => {
  if (fiber.tag !== FunctionComponent) {
    if (__DEV__) {
      console.warn('非FunctionComponent fiber,无法收集effect');
    }
    return;
  }
  if (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags) {
    if (__DEV__) {
      console.warn(
        'commitPassiveEffect type为update，但fiber.flags不包含PassiveEffect',
        fiber
      );
    }
    return;
  }
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
  if (__DEV__) {
    if (
      (fiber.flags & PassiveEffect) !== NoFlags &&
      (!updateQueue || !updateQueue.lastEffect)
    ) {
      console.warn('fiber.flags 包含PassiveEffect时，不应该不存在lastEffect');
    }
  }

  if (!updateQueue) {
    return;
  }
  const lastEffect = updateQueue.lastEffect;
  if (lastEffect) {
    root.pendingPassiveEffects[type].push(lastEffect);
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
        } else {
          continue findSibling;
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

const commitDeletion = (childToDelete: FiberNode, root: FiberRootNode) => {
  let rootHostNode: FiberNode | null = null;
  /* 
    思考这个方法要做的事情是什么？
  */
  commitNestedComponent(childToDelete, (fiber) => {
    switch (fiber.tag) {
      case HostComponent:
        if (fiber.ref) {
          console.log('卸载前解绑ref', fiber);
        }
        safelyDetachRef(fiber);
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
        // todo: 解绑ref
        commitPassiveEffect(fiber, root, 'unmount');
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
  if (childToDelete === unmountFirstFiber) {
    return childrenToDelete;
  }

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
      return;
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

function commitHookEffectList(
  effectTag: EffectTag,
  lastEffect: Effect,
  callback: (effect: Effect) => void
) {
  let effect = lastEffect.next;
  do {
    if (!effect) {
      if (__DEV__) {
        console.warn('effect不存在，lastEffect为', lastEffect);
      }
      return;
    }
    if ((effect.tag & effectTag) === effectTag) {
      callback(effect);
    }

    effect = effect.next;
  } while (effect !== lastEffect.next);
}

export function commitHookEffectListUnmount(
  effectTag: EffectTag,
  lastEffect: Effect
) {
  commitHookEffectList(effectTag, lastEffect, (effect) => {
    if (typeof effect.destroy === 'function') {
      effect.destroy();
    }
    effect.tag &= ~HookHasEffect;
  });
}

export function commitHookEffectListDestroy(
  effectTag: EffectTag,
  lastEffect: Effect
) {
  commitHookEffectList(effectTag, lastEffect, (effect) => {
    if (typeof effect.destroy === 'function') {
      effect.destroy();
    }
  });
}

export function commitHookEffectListCreate(
  effectTag: EffectTag,
  lastEffect: Effect
) {
  commitHookEffectList(effectTag, lastEffect, (effect) => {
    if (typeof effect.create === 'function') {
      effect.destroy = effect.create();
      effect.tag &= ~HookHasEffect;
    }
  });
}

function safelyAttachRef(fiber: FiberNode) {
  const { ref, stateNode } = fiber;
  if (ref !== null) {
    if (typeof ref === 'function') {
      ref(stateNode);
    } else if ({}.hasOwnProperty.call(ref, 'current')) {
      ref.current = stateNode;
    } else {
      console.error('ref接收到非预期值', ref);
    }
  }
}

function safelyDetachRef(current: FiberNode) {
  const { ref } = current;
  if (ref !== null) {
    if (typeof ref === 'function') {
      ref(null);
    } else if ({}.hasOwnProperty.call(ref, 'current')) {
      ref.current = null;
    } else {
      console.error('ref接收到非预期值', ref);
    }
  }
}

/* function commitEffects(
  phrase: 'mutation' | 'layout',
  mask: Flags,
  finishedWork: FiberNode,
  root: FiberRootNode
) {
  let nextEffect: FiberNode | null = finishedWork;

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child;
    if ((nextEffect.subtreeFlags & mask) !== NoFlags && child !== null) {
      nextEffect = child;
      continue;
    }

    while (nextEffect !== null) {
      if (phrase === 'mutation') {
        commitMutationEffectsOnFiber(nextEffect, root);
      } else {
        commitLayoutEffectsOnFiber(nextEffect);
      }

      const sibling: FiberNode | null = nextEffect.sibling;
      if (sibling) {
        nextEffect = sibling;
        break;
      } else {
        nextEffect = nextEffect.return;
      }
    }
  }
} */

function commitEffects(
  mask: Flags,
  callback: (fiber: FiberNode, root: FiberRootNode) => void
) {
  return (finishedWork: FiberNode, root: FiberRootNode) => {
    let nextEffect: FiberNode | null = finishedWork;

    while (nextEffect !== null) {
      const child: FiberNode | null = nextEffect.child;
      if ((nextEffect.subtreeFlags & mask) !== NoFlags && child !== null) {
        nextEffect = child;
        continue;
      }

      while (nextEffect !== null) {
        callback(nextEffect, root);

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
}

export const commitLayoutEffect = commitEffects(
  layoutMask,
  commitLayoutEffectsOnFiber
);

function commitLayoutEffectsOnFiber(finishedWork: FiberNode) {
  const { flags, tag } = finishedWork;

  if ((flags & Ref) !== NoFlags && tag === HostComponent) {
    safelyAttachRef(finishedWork);
    finishedWork.flags &= ~Ref;
  }
}
