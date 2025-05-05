import { ReactElementType } from 'shared/ReactTypes';
import ReactDOM from 'react-dom';

export function renderIntoDocument(element: ReactElementType) {
  const container = document.createElement('div');
  return ReactDOM.createRoot(container).render(element);
}
