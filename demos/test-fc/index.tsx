import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [num, updateNum] = useState(100);
  useEffect(() => {
    console.log('App mount');
    updateNum((num) => num + 1);
  }, []);
  return (
    <ul
      onClick={() => {
        updateNum(50);
      }}
    >
      {Array(num)
        .fill(0)
        .map((_, index) => {
          return <Child key={index}>{index}</Child>;
        })}
    </ul>
  );
}

function Child({ children }: { children: any }) {
  const now = performance.now();
  while (performance.now() - now < 4) {}
  return <li>{children}</li>;
}

const root = createRoot(document.querySelector('#root') as Element);
root.render(<App />);
