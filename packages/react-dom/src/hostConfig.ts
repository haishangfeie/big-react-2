import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { updateFiberProps } from './SyntheticEvent';
import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props) => {
  const el = document.createElement(type as keyof HTMLElementTagNameMap);
  updateFiberProps(el, props);
  return el;
};

export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance
) => {
  return parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export const insertChildToContainer = (
  child: Instance,
  container: Container,
  before: Instance
) => {
  return container.insertBefore(child, before);
};

export const commitUpdate = (fiber: FiberNode) => {
  if (__DEV__) {
    console.warn('执行Update操作', fiber);
  }
  switch (fiber.tag) {
    case HostText: {
      const content = fiber.memoizedProps.content;
      const textInstance = fiber.stateNode;
      commitTextUpdate(textInstance, content);
      return;
    }
    case HostComponent: {
      updateFiberProps(fiber.stateNode, fiber.memoizedProps);
      return;
    }

    default:
      if (__DEV__) {
        console.warn('commitUpdate未处理fiber', fiber);
      }
      break;
  }
};

export const commitTextUpdate = (
  textInstance: TextInstance,
  content: string
) => {
  textInstance.textContent = content;
};

export const removeChild = (
  child: Instance | TextInstance,
  container: Container
) => {
  container.removeChild(child);
};

export const scheduleMicroTask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise === 'function'
      ? (cb: () => void) => Promise.resolve(null).then(cb)
      : setTimeout;
