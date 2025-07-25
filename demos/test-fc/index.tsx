import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(1);
  const arr =
    num % 2 === 0
      ? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
      : [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
  return (
    <ul
      onClick={() => {
        setNum((i) => i + 1);
      }}
    >
      {arr}
    </ul>
  );
};


createRoot(document.getElementById('root')!).render(<App />);
