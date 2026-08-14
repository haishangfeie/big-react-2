import { useState, memo } from 'react';

export default function App() {
  const [num, update] = useState(0);
  console.log(
    '%c App render',
    'background: red; color: white; font-weight: bold; padding: 2px 6px;',
    num
  );
  return (
    <div onClick={() => update(num + 1)}>
      <Cpn num={num} name={'cpn1'} />
      <Cpn num={0} name={'cpn2'} />
    </div>
  );
}

const Cpn = memo(function ({ num, name }) {
  console.log(
    "%c render",
    "background: yellow; color: black; font-weight: bold; padding: 2px 6px;",
    name
  );
  
  return (
    <div>
      {name}: {num}
      <Child />
    </div>
  );
});

function Child() {
  console.log(
    "%c Child render",
    "background: blue; color: white; font-weight: bold; padding: 2px 6px;"
  );
  
  return <p>i am child</p>;
}
