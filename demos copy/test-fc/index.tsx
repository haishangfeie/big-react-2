import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => (
  <div>
    <Child />
  </div>
);

const Child = () => {
  return <span>big-react-2</span>;
};
createRoot(document.getElementById('root')!).render(<App />);
