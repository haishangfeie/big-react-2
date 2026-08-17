import { useState, memo, useCallback } from 'react';

export default function App() {
	const [num, update] = useState(0);
	console.log('%cApp render ' + num, 'background:red;color:white;');

	const addOne = useCallback(() => update((num) => num + 1), []);

	return (
		<div>
			<Cpn onClick={addOne} />
			{num}
		</div>
	);
}

const Cpn = memo(function ({ onClick }) {
	console.log('%cCpn render', 'background:green;color:white;padding:2px 4px;');
	return (
		<div onClick={() => onClick()}>
			<Child />
		</div>
	);
});

function Child() {
	console.log('%cChild render', 'background:#1677ff;color:white;padding:2px 4px;');
	return <p>i am child</p>;
}