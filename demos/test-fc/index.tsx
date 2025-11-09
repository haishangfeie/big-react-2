import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [num, updateNum] = useState(0);

  return (
    <div onClick={() => updateNum(num + 1)}>
      {num === 0 ? <Child /> : 'noop'}
    </div>
  );
}

function Child() {
  useEffect(() => {
    console.log('Child mount');
    return () => {
      console.log('Child unmount');
    };
  }, []);

  return '我是child';
}

createRoot(document.getElementById('root')!).render(<App />);
