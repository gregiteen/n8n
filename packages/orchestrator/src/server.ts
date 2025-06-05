import express from 'express';

import { Agent } from './agent';

export function createApp(agent = new Agent()) {
	const app = express();

	app.use(express.json());

	app.get('/health', (_req, res) => {
		res.json({ status: 'ok' });
	});

	app.post('/chat', async (req, res) => {
		const { message, model } = (req.body ?? {}) as {
			message?: string;
			model?: string;
		};

		if (typeof message !== 'string') {
			res.status(400).json({ error: 'message is required' });
			return;
		}

		try {
			const response = await agent.send(message, model);
			res.json({ response, memory: agent.getMemory() });
		} catch {
			res.status(500).json({ error: 'failed to process message' });
		}
	});

	return app;
}

export function start(port = 3002) {
	const app = createApp();
	app.listen(port, () => {
		console.log(`Orchestrator listening on port ${port}`);
	});
}
