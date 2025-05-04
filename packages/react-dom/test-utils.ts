import { ReactElementType } from 'shared/ReactTypes';
import ReactDOM from 'react-dom';

export function renderIntoContainer(element: ReactElementType) {
  const container = document.createElement('div');
  ReactDOM.createRoot(container).render(element);
}
