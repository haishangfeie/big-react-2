import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);
  return (
    <div
      onClick={() => {
        console.log('我是父元素');
      }}
      onClickCapture={() => {
        setNum((i) => i + 1);
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          console.log('我是内层元素');
        }}
      >
        {num}
      </div>
    </div>
  );
};

const Child = () => {
  return <div>react</div>;
};

createRoot(document.getElementById('root')!).render(<App />);
