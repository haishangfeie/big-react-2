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
    console.warn(`当前不支持${eventType}合成事件`);
    return;
  }
  if (__DEV__) {
    console.log('初始化事件:', eventType);
  }
  container.addEventListener(eventType, (e: Event) => {
    dispatchEvent(container, eventType, e);
  });
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
  // 收集沿途的事件
  const target = e.target as DOMElement;
  if (!target) {
    console.warn('事件target不存在', e);
    return;
  }
  const { bubble, capture } = collectPaths(target, container, eventType);
  // 构建合成对象
  const se = createSyntheticEvent(e);

  /* 
    我发现我有一个误区，event.stopPropagation() 会阻止事件在捕获和冒泡阶段的进一步传播，不仅阻止冒泡，还会阻止捕获。之前我误以为stopPropagation只会阻止捕获。所以我的实现存在问题。
   */
  triggerEventFlow(capture, se);
  if (se.__isStopPropagation) {
    return;
  }
  triggerEventFlow(bubble, se);
}

function collectPaths(
  targetElement: DOMElement,
  container: Container,
  eventType: string
) {
  let target: DOMElement | null = targetElement;
  const paths: Paths = {
    bubble: [],
    capture: []
  };
  while (target && target !== container) {
    const [captureCallbackName, bubbleCallbackName] =
      getEventCallbackNameFromEventType(eventType) || [];
    const props = target[elementPropsKey];
    if (captureCallbackName && props[captureCallbackName]) {
      paths.capture.unshift(props[captureCallbackName]);
    }
    if (bubbleCallbackName && props[bubbleCallbackName]) {
      paths.bubble.push(props[bubbleCallbackName]);
    }
    target = target.parentNode as DOMElement | null;
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

  const originStopPropagation = e.stopPropagation;
  se.stopPropagation = () => {
    se.__isStopPropagation = true;
    if (originStopPropagation) {
      originStopPropagation();
    }
  };
  return se;
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
  if (se.__isStopPropagation) {
    return;
  }
  for (let i = 0; i < paths.length; i++) {
    if (se.__isStopPropagation) {
      break;
    }
    const cb = paths[i];
    cb.call(null, se);
  }
}
