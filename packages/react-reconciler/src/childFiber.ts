import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './fiber';
import { Placement } from './fiberFlags';
import { HostText } from './workTags';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';

function ChildReconciler(shouldTrackEffects: boolean) {
  const placeSingleChild = (fiber: FiberNode) => {
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement;
    }
    return fiber;
  };
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    // @ts-expect-error TS6133 - 参数暂时未使用
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentFiber: FiberNode | null,
    newChild: ReactElementType
  ) => {
    const fiber = createFiberFromElement(newChild);
    fiber.return = returnFiber;
    return fiber;
  };
  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    // @ts-expect-error TS6133 - 参数暂时未使用
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentFiber: FiberNode | null,
    content: string | number
  ) => {
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
        return placeSingleChild(
          reconcileSingleElement(returnFiber, currentFiber, newChild)
        );
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

    if (__DEV__) {
      console.warn('reconcileChildFibers 未处理当前情况', newChild);
    }

    return null;
  };
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
