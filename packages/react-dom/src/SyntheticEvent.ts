import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';

export interface DOMElement extends Element {
  [elementPropsKey]: Props;
}

type EventCallback = (e: Event) => void;

interface Paths {
  bubble: EventCallback[];
  capture: EventCallback[];
}

interface SyntheticEvent extends Event {
  __isStopPropagation: boolean;
}

export const elementPropsKey = '__props';

export function updateFiberProps(element: Element, props: Props) {
  (element as DOMElement)[elementPropsKey] = props;

  return element as DOMElement;
}

const validEventTypeList = ['click'];

export function initEvent(container: Container, eventType: string) {
  if (!validEventTypeList.includes(eventType)) {
    console.warn(`${eventType}不支持合成事件`);
    return;
  }
  if (__DEV__) {
    console.log('initEvent开始执行');
  }
  container.addEventListener(eventType, (e: Event) => {
    dispatchEvent(container, eventType, e);
  });
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
  // 收集沿途的事件
  const target = e.target as DOMElement;
  const paths = collectPaths(target, container, eventType);
  // 构建合成对象
  const se = createSyntheticEvent(e);
  triggerEventFlow(paths, se);
}

function collectPaths(
  targetElement: DOMElement,
  container: Container,
  eventType: string
) {
  const paths: Paths = {
    bubble: [],
    capture: []
  };
  while (targetElement !== container) {
    const [captureCallbackName, bubbleCallbackName] =
      getEventCallbackNameFromEventType(eventType) || [];
    const props = targetElement[elementPropsKey];
    if (captureCallbackName && props[captureCallbackName]) {
      paths.capture.unshift(props[captureCallbackName]);
    }
    if (bubbleCallbackName && props[bubbleCallbackName]) {
      paths.bubble.push(props[bubbleCallbackName]);
    }
    const parent = targetElement.parentNode as DOMElement;
    if (parent) {
      targetElement = parent;
    }
  }
  return paths;
}

function getEventCallbackNameFromEventType(eventType: string) {
  return {
    click: ['onClickCapture', 'onClick']
  }[eventType];
}

function createSyntheticEvent(e: Event) {
  const se = e as SyntheticEvent;
  se.__isStopPropagation = false;

  const stopPropagationSource = e.stopPropagation;
  se.stopPropagation = () => {
    stopPropagationSource.call(se);
    se.__isStopPropagation = true;
  };
  return se;
}

function triggerEventFlow(paths: Paths, se: SyntheticEvent) {
  // 遍历capture
  for (let i = 0; i < paths.capture.length; i++) {
    const cb = paths.capture[i];
    cb.call(null, se);
  }
  // 遍历bubble
  if (se.__isStopPropagation) {
    return;
  }
  for (let i = 0; i < paths.bubble.length; i++) {
    if (se.__isStopPropagation) {
      break;
    }
    const cb = paths.bubble[i];
    cb.call(null, se);
  }
}
