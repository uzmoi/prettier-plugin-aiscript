export const asyncDebounce = <A extends readonly unknown[]>(
	f: (...args: A) => Promise<void>,
	ms: number,
) => {
	let currentArgsId = 0;
	let promise: Promise<void> | undefined;

	return async (...args: A) => {
		const argsId = ++currentArgsId;

		await new Promise(resolve => {
			setTimeout(resolve, ms, promise);
		});

		if (currentArgsId !== argsId) return;

		promise = f(...args).then(() => {
			promise = undefined;
		});
	};
};
