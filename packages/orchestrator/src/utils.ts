/**
 * Utilities
 * This is a temporary stub until the real module is implemented
 */

export const createEventQueue = <T>(processor: (item: T) => Promise<void>) => {
	const queue: T[] = [];
	let processing = false;

	const processQueue = async () => {
		if (processing || queue.length === 0) {
			return;
		}

		processing = true;
		try {
			const item = queue.shift();
			if (item) {
				await processor(item);
			}
		} finally {
			processing = false;
			if (queue.length > 0) {
				processQueue();
			}
		}
	};

	return {
		enqueue: (item: T) => {
			queue.push(item);
			processQueue();
		},
		isEmpty: () => queue.length === 0,
		size: () => queue.length,
	};
};
