import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);
  window.setNum = setNum;
  return <div>{num}</div>;
};

createRoot(document.getElementById('root')!).render(<App />);
