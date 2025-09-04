import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);
  return (
    <div
      onClick={() => {
        setNum((i) => {
          return i + 1;
        });
        setNum((i) => {
          return i + 1;
        });
        setNum((i) => {
          return i + 1;
        });
      }}
    >
      {num}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
