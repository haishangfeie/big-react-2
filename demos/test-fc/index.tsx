import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [num, updateNum] = useState(0);
  useEffect(() => {
    console.log('App mount');
    updateNum((num) => num + 1);
  }, []);
  return <div>{num}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
