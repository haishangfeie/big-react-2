import { useState, useContext, createContext, useMemo } from 'react';

// 方式1：App提取 bailout四要素
// 方式2：ExpensiveSubtree用memo包裹
export default function App() {
	const [num, update] = useState(0);
	console.log('%cApp render ' + num, 'background:#e53935;color:#ffffff;padding:2px 5px;');

	const Cpn = useMemo(() => (<ExpensiveSubtree />), []);

	return (
		<div onClick={() => update(num + 100)}>
			<p>num is: {num}</p>
			{Cpn}
		</div>
	);
}

function ExpensiveSubtree() {
	console.log('%cExpensiveSubtree render', 'background:#2e7d32;color:#fff;padding:2px 5px;');
	return <p>i am child</p>;
}