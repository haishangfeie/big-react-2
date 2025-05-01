// 预期：ReactDOM.createRoot(container).render(<App/>

import { Container } from 'hostConfig';
import reactReconciler from 'react-reconciler';
import { ReactElementType } from 'shared/ReactTypes';

export function createRoot(container: Container) {
  const root = reactReconciler.createContainer(container);
  return {
    render(element: ReactElementType | null) {
      reactReconciler.updateContainer(element, root);
    }
  };
}
