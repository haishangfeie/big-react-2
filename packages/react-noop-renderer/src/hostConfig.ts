import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';
import { Props } from 'shared/ReactTypes';

export interface Container {
  rootID: number;
  children: (Instance | TextInstance)[];
}
export interface Instance {
  id: number;
  parent: number;
  children: (Instance | TextInstance)[];
  props: Props;
  type: string;
}
export interface TextInstance {
  id: number;
  parent: number;
  text: string;
}

let instanceId = 0;

export const createInstance = (type: string, props: Props): Instance => {
  return {
    id: instanceId++,
    parent: -1,
    type,
    props,
    children: []
  };
};

export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance
) => {
  const childParentId = child.parent;
  const parentId = 'rootID' in parent ? parent.rootID : parent.id;
  if (childParentId !== -1 && parentId === childParentId) {
    throw new Error('child不能重复挂载到parent上');
  }
  child.parent = parentId;
  parent.children.push(child);
};

export const createTextInstance = (content: string) => {
  return {
    id: instanceId++,
    parent: -1,
    text: content
  };
};

export const appendChildToContainer = (parent: Container, child: Instance) => {
  const childParentId = child.parent;
  const parentId = parent.rootID;
  if (childParentId !== -1 && parentId === childParentId) {
    throw new Error('child不能重复挂载到parent上');
  }
  child.parent = parentId;
  parent.children.push(child);
};

export const insertChildToContainer = (
  child: Instance,
  container: Container,
  before: Instance
) => {
  const children = container.children;

  const childIndex = children.indexOf(child);
  if (childIndex !== -1) {
    children.splice(childIndex, 1);
  }
  const beforeIndex = children.indexOf(before);
  if (beforeIndex === -1) {
    throw new Error('before不存在');
  }
  child.parent = container.rootID;
  children.splice(beforeIndex, 0, child);
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
  textInstance.text = content;
};

export const removeChild = (
  child: Instance | TextInstance,
  container: Container
) => {
  const childIndex = container.children.indexOf(child);
  if (childIndex === -1) {
    throw new Error('child不是container的children');
  }
  child.parent = -1;
  container.children.splice(childIndex, 1);
};

export const scheduleMicroTask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise === 'function'
      ? (cb: () => void) => Promise.resolve(null).then(cb)
      : setTimeout;
