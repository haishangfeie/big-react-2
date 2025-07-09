// 预期：ReactDOM.createRoot(container).render(<App/>

import { Container } from 'hostConfig';
import {
  createContainer,
  updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { initEvent } from './SyntheticEvent';
import { ReactElementType } from 'shared/ReactTypes';

export function createRoot(container: Container) {
  const root = createContainer(container);
  return {
    render(element: ReactElementType | null) {
      initEvent(container, 'click');
      return updateContainer(element, root);
    }
  };
}
