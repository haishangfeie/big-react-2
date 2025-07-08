import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);
  window.setNum = setNum;
  return num === 1 ? <Child /> : <div>{num}</div>;
};

const Child = () => {
  return <div>react</div>;
};

createRoot(document.getElementById('root')!).render(<App />);
