import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [num, updateNum] = useState(0);
  useEffect(() => {
    console.log('App mount');
  }, []);

  useEffect(() => {
    console.log('num change create', num);
    return () => {
      console.log('num change destroy', num);
    };
  }, [num]);

  return (
    <div onClick={() => updateNum(num + 1)}>
      {num === 0 ? <Child /> : 'noop'}
    </div>
  );
}

function Child() {
  const [num, updateNum] = useState(0);
  useEffect(() => {
    console.log('Child mount');
    return () => {
      console.log('Child unmount');
    };
  }, []);
  useEffect(() => {
    console.log('Child num create');
    return () => {
      console.log('Child num change');
    };
  }, [num]);

  return num;
}

createRoot(document.getElementById('root')!).render(<App />);
