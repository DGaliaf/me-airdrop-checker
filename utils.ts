export function chunk<T>(target: T[], chunkSize: number): T[][] {
	const chunks = [];

	for (let i = 0; i < target.length; i += chunkSize) {
		chunks.push(target.slice(i, i + chunkSize));
	}

	return chunks;
}
