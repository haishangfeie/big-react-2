export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, _props: any) => {
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
