import { Container, Instance } from './hostConfig';
import {
  createContainer,
  updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType } from 'shared/ReactTypes';

let rootId = 0;

export function createRoot() {
  const container: Container = {
    rootID: rootId++,
    children: []
  };
  // @ts-expect-error: 这里识别错了Container的类型，忽略
  const root = createContainer(container);

  const getChildren = (parent: Container | Instance) => {
    return parent.children;
  };

  const getChildrenAsJSX = (root: Container) => {
    const children = childToJSX(getChildren(root));
    if (Array.isArray(children)) {
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: REACT_FRAGMENT_TYPE,
        key: null,
        ref: null,
        props: children,
        __mark: 'big-react-2'
      };
    }
    return children;
  };
  const childToJSX = (child: any) => {
    if (child === null) {
      return null;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      return child;
    }
    if (Array.isArray(child)) {
      if (child.length === 0) {
        return null;
      }
      if (child.length === 1) {
        return childToJSX(child[0]);
      }
      const childMap: any[] = child.map(childToJSX);
      if (
        childMap.every(
          (item) => typeof item === 'string' || typeof item === 'number'
        )
      ) {
        return childMap.join('');
      }
      return childMap;
    }
    // Instance
    if (Array.isArray(child.children)) {
      const props: any = {
        props: child.props
      };
      const children = childToJSX(child.children);
      if (children !== null) {
        props.children = children;
      }
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: child.type,
        key: null,
        ref: null,
        props,
        __mark: 'big-react-2'
      };
    }

    // TextInstance
    return child.text;
  };
  return {
    render(element: ReactElementType | null) {
      return updateContainer(element, root);
    },
    getChildren() {
      return getChildren(container);
    },
    getChildrenAsJSX() {
      return getChildrenAsJSX(container);
    }
  };
}
