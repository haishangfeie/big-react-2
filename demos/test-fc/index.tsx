import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-noop-renderer';

function App() {
  const [num, updateNum] = useState(0);
  useEffect(() => {
    console.log('App mount');
    updateNum((num) => num + 1);
  }, []);
  return (
    <div>
      <Child />
    </div>
  );
}

function Child() {
  return `I'm child`;
}

const root = createRoot();
root.render(<App />);
declare global {
  interface Window {
    root?: ReturnType<typeof createRoot>;
  }
}

window.root = root;
