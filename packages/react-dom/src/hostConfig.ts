export type Container = Element;
export type Instance = Element;

export const createInstance = (
  type: string,
  // @ts-expect-error TS6133 - 参数暂时未使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: any
) => {
  // TODO: 暂时不处理props
  const el = document.createElement(type as keyof HTMLElementTagNameMap);
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
