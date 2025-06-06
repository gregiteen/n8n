import express from 'express';

import { Agent, ModelProvider } from './agent';
import { AgentFactory, AgentType } from './agent-factory';
import { ModelSelector } from './models/model-selector';

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
			// Use the AgentFactory to create a web browsing agent
			const webBrowsingAgent = AgentFactory.createAgent({
				agentType: 'web-browsing',
				provider: provider || agent.getProvider(),
				model: model || agent.getModel(),
			});

			const response = await webBrowsingAgent.send(query);

			res.json({
				response,
				memory: webBrowsingAgent.getMemory(),
			});
		} catch (error) {
			console.error('Web browsing error:', error);
			res.status(500).json({ error: `Failed to browse the web: ${(error as Error).message}` });
		}
	});

	// Get available models
	app.get('/models', (_req, res) => {
		try {
			const models = ModelSelector.getAllModels();
			res.json({ models });
		} catch (error) {
			console.error('Error fetching models:', error);
			res.status(500).json({ error: `Failed to fetch models: ${(error as Error).message}` });
		}
	});

	// Get models by provider
	app.get('/models/:provider', (req, res) => {
		try {
			const { provider } = req.params;
			if (!['openai', 'anthropic', 'gemini', 'openrouter'].includes(provider)) {
				res.status(400).json({ error: 'Invalid provider' });
				return;
			}

			const models = ModelSelector.getModelsByProvider(provider as ModelProvider);
			res.json({ models });
		} catch (error) {
			console.error('Error fetching models by provider:', error);
			res.status(500).json({ error: `Failed to fetch models: ${(error as Error).message}` });
		}
	});

	// Create a specialized agent
	app.post('/agents', async (req, res) => {
		try {
			const { agentType, model, provider, systemPrompt, tools } = (req.body ?? {}) as {
				agentType?: AgentType;
				model?: string;
				provider?: ModelProvider;
				systemPrompt?: string;
				tools?: any[];
			};

			if (!agentType) {
				res.status(400).json({ error: 'agentType is required' });
				return;
			}

			const specializedAgent = AgentFactory.createAgent({
				agentType,
				provider,
				model,
				systemPrompt,
				tools,
			});

			// For now, just return success - in a real implementation, we would store the agent
			res.json({
				success: true,
				agent: {
					type: agentType,
					provider: provider || 'openai',
					model: model || 'Default model for provider',
				},
			});
		} catch (error) {
			console.error('Error creating agent:', error);
			res.status(500).json({ error: `Failed to create agent: ${(error as Error).message}` });
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
