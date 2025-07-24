import { ReactElementType } from 'shared/ReactTypes';
import {
  createFiberFromElement,
  createWorkInProgress,
  FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { HostText } from './workTags';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Props } from 'shared/ReactTypes';

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
  const placeSingleChild = (fiber: FiberNode) => {
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement;
    }
    return fiber;
  };

  const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
    if (!shouldTrackEffects) {
      return;
    }

    const deletions = returnFiber.deletions;
    if (!Array.isArray(deletions)) {
      returnFiber.deletions = [childToDelete];
    } else {
      deletions.push(childToDelete);
    }
    returnFiber.flags |= ChildDeletion;
  };

  const deleteRemainingChildren = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null
  ) => {
    if (!shouldTrackEffects) {
      return;
    }
    while (currentFirstChild) {
      deleteChild(returnFiber, currentFirstChild);
      currentFirstChild = currentFirstChild.sibling;
    }
  };
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild: ReactElementType
  ) => {
    const key = newChild.key;

    while (currentFiber !== null) {
      if (key === currentFiber.key) {
        if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
          if (newChild.type === currentFiber.type) {
            const existing = useFiber(currentFiber, newChild.props);
            existing.return = returnFiber;
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            return existing;
          }
          deleteRemainingChildren(returnFiber, currentFiber);
          break;
        } else {
          if (__DEV__) {
            console.warn(`reconcileSingleElement未处理的newChild:`, newChild);
          }
          break;
        }
      } else {
        deleteChild(returnFiber, currentFiber);
        currentFiber = currentFiber.sibling;
      }
    }

    const fiber = createFiberFromElement(newChild);
    fiber.return = returnFiber;
    return fiber;
  };
  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number
  ) => {
    while (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        deleteRemainingChildren(returnFiber, currentFiber.sibling);
        return existing;
      }
      deleteChild(returnFiber, currentFiber);
      currentFiber = currentFiber.sibling;
    }
    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber;
  };

  const reconcileChildrenArray = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChild: any[]
  ) => {
    /* 
      1. 将current及其同级节点都存入Map中
      2. 遍历newChild
        判断element是否可以复用，可以复用的fiber，同时移除Map中的旧节点不能复用的通过element创建fiber
        接着判断fiber是移动还是插入
      3. 将Map中剩余的节点标记删除
    */
    // 1. 将current及其同级节点都存入Map中
    const existingChildren: ExistingChildren = new Map();
    let fiber = currentFirstChild;
    while (fiber) {
      const keyToUse = fiber.key !== null ? fiber.key : fiber.index;
      existingChildren.set(keyToUse, fiber);
      fiber = fiber.sibling;
    }
    // 2. 遍历newChild
    // 当前处理的新节点中，所有对应的可复用的旧节点在旧列表中最后（靠右）的索引
    let lastPlacedIndex = 0;
    // lastNewFiber 有什么用？ 用于让fiber.sibling可以指向下一个fiber
    let lastNewFiber: FiberNode | null = null;
    let firstNewFiber: FiberNode | null = null;
    for (let i = 0; i < newChild.length; i++) {
      const element = newChild[i];
      const newFiber = updateFromMap(existingChildren, i, element);
      if (newFiber === null) {
        continue;
      }
      newFiber.return = returnFiber;
      newFiber.index = i;
      if (firstNewFiber === null) {
        firstNewFiber = newFiber;
      }
      if (lastNewFiber === null) {
        lastNewFiber = newFiber;
      } else {
        lastNewFiber.sibling = newFiber;
        lastNewFiber = newFiber;
      }
      if (!shouldTrackEffects) {
        continue;
      }

      const current = newFiber.alternate;
      if (current === null) {
        // mount
        newFiber.flags |= Placement;
      } else {
        const oldIndex = current.index;
        if (oldIndex < lastPlacedIndex) {
          newFiber.flags |= Placement;
        } else {
          lastPlacedIndex = oldIndex;
        }
      }
    }

    existingChildren.forEach((existing) => {
      deleteChild(returnFiber, existing);
    });
    return firstNewFiber;
  };

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType | null
  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      // 单节点
      if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
        const fiber = reconcileSingleElement(
          returnFiber,
          currentFiber,
          newChild
        );
        return fiber ? placeSingleChild(fiber) : null;
      }
      // 多节点
      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFiber, newChild);
      }
      console.warn('reconcileChildFibers 未处理当前情况', newChild);
    }

    // 文本节点
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild)
      );
    }

    // 兜底删除
    if (currentFiber) {
      deleteRemainingChildren(returnFiber, currentFiber);
    }

    if (__DEV__) {
      console.warn('reconcileChildFibers 未处理当前情况', newChild);
    }

    return null;
  };
}

function updateFromMap(
  existingChildren: ExistingChildren,
  index: number,
  element: any
) {
  const keyToUse = element.key !== null ? element.key : index;
  const beforeFiber = existingChildren.get(keyToUse);
  if (typeof element === 'string' || typeof element === 'number') {
    if (beforeFiber) {
      if (beforeFiber.tag === HostText) {
        existingChildren.delete(keyToUse);
        return useFiber(beforeFiber, { content: element + '' });
      }
    }

    return new FiberNode(HostText, { content: element + '' }, null);
  }
  if (typeof element === 'object' && element !== null) {
    switch (element.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        if (beforeFiber) {
          if (element.type === beforeFiber.type) {
            existingChildren.delete(keyToUse);
            return useFiber(beforeFiber, element.props);
          }
        }

        return createFiberFromElement(element);
      }
      default: {
        if (Array.isArray(element) && __DEV__) {
          console.warn('还不支持数组类型的element', element);
        }
        return null;
      }
    }
  }

  return null;
}

function useFiber(fiber: FiberNode, pendingProps: Props) {
  const clone = createWorkInProgress(fiber, pendingProps);

  clone.index = 0;
  clone.sibling = null;

  return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
