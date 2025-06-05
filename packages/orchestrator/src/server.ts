import express from 'express';

import { Agent, ModelProvider } from './agent';

export function createApp(agent = new Agent()) {
	const app = express();

	app.use(express.json());

	app.get('/health', (_req, res) => {
		res.json({ status: 'ok' });
	});

	app.post('/chat', async (req, res) => {
		const { message, model, provider } = (req.body ?? {}) as {
			message?: string;
			model?: string;
			provider?: ModelProvider;
		};

		if (typeof message !== 'string') {
			res.status(400).json({ error: 'message is required' });
			return;
		}

		try {
			const response = await agent.send(message, model, provider);
			res.json({ response, memory: agent.getMemory() });
		} catch (error) {
			console.error('Chat error:', error);
			res.status(500).json({ error: `Failed to process message: ${(error as Error).message}` });
		}
	});

	app.post('/chat/with-tools', async (req, res) => {
		const { message, model, provider, tools } = (req.body ?? {}) as {
			message?: string;
			model?: string;
			provider?: ModelProvider;
			tools?: Array<{
				name: string;
				description: string;
				parameters: Record<string, unknown>;
			}>;
		};

		if (typeof message !== 'string') {
			res.status(400).json({ error: 'message is required' });
			return;
		}

		try {
			// Add tools if provided
			if (tools && Array.isArray(tools)) {
				tools.forEach((tool) => agent.addTool(tool));
			}

			const response = await agent.sendWithTools(message, model, provider);
			res.json({ response, memory: agent.getMemory() });
		} catch (error) {
			console.error('Chat with tools error:', error);
			res.status(500).json({ error: `Failed to process message: ${(error as Error).message}` });
		}
	});

	app.post('/web-browse', async (req, res) => {
		const { query, model, provider } = (req.body ?? {}) as {
			query?: string;
			model?: string;
			provider?: ModelProvider;
		};

		if (typeof query !== 'string') {
			res.status(400).json({ error: 'query is required' });
			return;
		}

		try {
			// Set the provider if specified
			if (provider) {
				agent.setProvider(provider);
			}

			// Set the model if specified
			if (model) {
				agent.setModel(model);
			}

			// Create a web browsing agent and use it
			const webAgent = await agent.createWebBrowsingAgent();
			const response = await webAgent.generateContent(query);

			res.json({
				response: response?.text() || 'No response from web browsing agent',
				memory: agent.getMemory(),
			});
		} catch (error) {
			console.error('Web browsing error:', error);
			res.status(500).json({ error: `Failed to browse the web: ${(error as Error).message}` });
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
