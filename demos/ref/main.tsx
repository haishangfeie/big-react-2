import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [isDel, del] = useState(false);
  const divRef = useRef(null);

  console.log(
    '%c render divRef',
    'background: #4CAF50; color: white; font-weight: bold; padding: 2px 6px;',
    divRef.current
  );

  useEffect(() => {
    console.log(
      '%c useEffect divRef',
      'background: #2196F3; color: white; font-weight: bold; padding: 2px 6px;',
      divRef.current
    );
  }, []);

  return (
    <div ref={divRef} onClick={() => del(true)}>
      {isDel ? null : <Child />}
    </div>
  );
}

function Child() {
  return (
    <p
      ref={(dom) => {
        console.log(
          '%c dom is:',
          'background: orange; color: black; font-weight: bold; padding: 2px 6px;',
          dom
        );
      }}
    >
      Child
    </p>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
