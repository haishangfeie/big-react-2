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
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild: ReactElementType
  ) => {
    const key = newChild.key;

    if (currentFiber !== null) {
      if (key === currentFiber.key) {
        if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
          if (newChild.type === currentFiber.type) {
            const existing = useFiber(currentFiber, newChild.props);
            existing.return = returnFiber;
            return existing;
          }
          deleteChild(returnFiber, currentFiber);
        } else {
          if (__DEV__) {
            console.warn(`reconcileSingleElement未处理的newChild:`, newChild);
          }
          return null;
        }
      } else {
        deleteChild(returnFiber, currentFiber);
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
    if (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        return existing;
      }
      deleteChild(returnFiber, currentFiber);
    }
    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber;
  };

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType | null
  ) {
    // 单节点
    if (typeof newChild === 'object' && newChild !== null) {
      if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
        const fiber = reconcileSingleElement(
          returnFiber,
          currentFiber,
          newChild
        );
        return fiber ? placeSingleChild(fiber) : null;
      }
      console.warn('reconcileChildFibers 未处理当前情况', newChild);
    }
    // TODO: 多节点

    // 文本节点
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild)
      );
    }

    if (currentFiber) {
      deleteChild(returnFiber, currentFiber);
    }

    if (__DEV__) {
      console.warn('reconcileChildFibers 未处理当前情况', newChild);
    }

    return null;
  };
}

function useFiber(fiber: FiberNode, pendingProps: Props) {
  const clone = createWorkInProgress(fiber, pendingProps);

  clone.index = 0;
  clone.sibling = null;

  return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
