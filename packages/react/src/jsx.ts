import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import type {
  ReactElementType,
  Type,
  Key,
  Ref,
  Props,
  ElementType
} from 'shared/ReactTypes';

const ReactElement = (
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
): ReactElementType => {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'big-react-2'
  };
};

export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config || {}) {
    const val = config[prop];
    if (prop === 'key') {
      if (val !== void 0) {
        key = val + '';
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== void 0) {
        ref = val + '';
      }
      continue;
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }
  const maybeChildrenLen = maybeChildren.length;
  if (maybeChildrenLen) {
    if (maybeChildrenLen === 1) {
      props.children = maybeChildren[0];
    } else {
      props.children = maybeChildren;
    }
  }

  return ReactElement(type, key, ref, props);
};

export const jsxDEV = (type: ElementType, config: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config || {}) {
    const val = config[prop];
    if (prop === 'key') {
      if (val !== void 0) {
        key = val + '';
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== void 0) {
        ref = val + '';
      }
      continue;
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }

  return ReactElement(type, key, ref, props);
};
