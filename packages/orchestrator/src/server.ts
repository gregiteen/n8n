import express from 'express';

import { Agent, ModelProvider } from './agent';
import { AgentFactory, AgentType } from './agent-factory';
import { ModelSelector } from './models/model-selector';
import { ModelSelectorService } from './model-selector-service';

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

			AgentFactory.createAgent({
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

	// Memory management endpoints
	app.get('/agents/:agentId/memory', async (req, res) => {
		try {
			const { agentId } = req.params;

			if (!agentId) {
				res.status(400).json({ error: 'agentId is required' });
				return;
			}

			// Create an agent with the specified ID
			const memoryAgent = new Agent({ agentId });

			// Get all memories
			const memories = await memoryAgent.getAllMemories();

			res.json({ memories });
		} catch (error) {
			console.error('Error retrieving memories:', error);
			res.status(500).json({ error: `Failed to retrieve memories: ${(error as Error).message}` });
		}
	});

	// Search agent memories
	app.post('/agents/:agentId/memory/search', async (req, res) => {
		try {
			const { agentId } = req.params;
			const { query, limit } = (req.body ?? {}) as {
				query?: string;
				limit?: number;
			};

			if (!agentId) {
				res.status(400).json({ error: 'agentId is required' });
				return;
			}

			if (!query) {
				res.status(400).json({ error: 'query is required' });
				return;
			}

			// Create an agent with the specified ID
			const memoryAgent = new Agent({ agentId });

			// Search memories
			const memories = await memoryAgent.searchMemories(query, limit);

			res.json({ memories });
		} catch (error) {
			console.error('Error searching memories:', error);
			res.status(500).json({ error: `Failed to search memories: ${(error as Error).message}` });
		}
	});

	// Add a memory explicitly
	app.post('/agents/:agentId/memory', async (req, res) => {
		try {
			const { agentId } = req.params;
			const { content, metadata } = (req.body ?? {}) as {
				content?: string;
				metadata?: Record<string, unknown>;
			};

			if (!agentId) {
				res.status(400).json({ error: 'agentId is required' });
				return;
			}

			if (!content) {
				res.status(400).json({ error: 'content is required' });
				return;
			}

			// Create an agent with the specified ID
			const memoryAgent = new Agent({ agentId });

			// Add memory
			const memoryId = await memoryAgent.addMemory(content, metadata || {});

			res.json({ success: true, memoryId });
		} catch (error) {
			console.error('Error adding memory:', error);
			res.status(500).json({ error: `Failed to add memory: ${(error as Error).message}` });
		}
	});

	// Clear agent memories
	app.delete('/agents/:agentId/memory', async (req, res) => {
		try {
			const { agentId } = req.params;

			if (!agentId) {
				res.status(400).json({ error: 'agentId is required' });
				return;
			}

			// Create an agent with the specified ID
			const memoryAgent = new Agent({ agentId });

			// Clear memories
			await memoryAgent.clearMemory();

			res.json({ success: true });
		} catch (error) {
			console.error('Error clearing memories:', error);
			res.status(500).json({ error: `Failed to clear memories: ${(error as Error).message}` });
		}
	});

	// Model selector service endpoints

	// Initialize model selector service
	const modelSelectorService = new ModelSelectorService();

	// Get filtered models
	app.get('/model-selector/models', (req, res) => {
		try {
			const { provider, capability, maxCost } = req.query as {
				provider?: ModelProvider;
				capability?: string;
				maxCost?: string;
			};

			const filteredModels = modelSelectorService.getModels({
				provider,
				capability,
				maxCost: maxCost ? parseFloat(maxCost) : undefined,
			});

			res.json({ models: filteredModels });
		} catch (error) {
			console.error('Error getting models:', error);
			res.status(500).json({ error: `Failed to get models: ${(error as Error).message}` });
		}
	});

	// Get model by ID
	app.get('/model-selector/models/:modelId', (req, res) => {
		try {
			const { modelId } = req.params;

			if (!modelId) {
				res.status(400).json({ error: 'modelId is required' });
				return;
			}

			const model = modelSelectorService.getModel(modelId);
			res.json({ model });
		} catch (error) {
			console.error('Error getting model by ID:', error);
			res.status(500).json({ error: `Failed to get model: ${(error as Error).message}` });
		}
	});

	// Get model for task type
	app.get('/model-selector/task/:taskType', (req, res) => {
		try {
			const { taskType } = req.params as {
				taskType: 'conversation' | 'code' | 'summarization' | 'data-analysis' | 'agent';
			};

			if (!['conversation', 'code', 'summarization', 'data-analysis', 'agent'].includes(taskType)) {
				res.status(400).json({ error: 'Invalid taskType' });
				return;
			}

			const model = modelSelectorService.getModelForTaskType(taskType);
			res.json({ model });
		} catch (error) {
			console.error('Error getting model for task:', error);
			res.status(500).json({ error: `Failed to get model for task: ${(error as Error).message}` });
		}
	});

	// Select model for agent
	app.post('/model-selector/select-for-agent', (req, res) => {
		try {
			const {
				taskDescription,
				agentType,
				requiredCapabilities,
				estimatedContextSize,
				budgetConstrained,
				preferredProvider,
			} = req.body as {
				taskDescription: string;
				agentType?: string;
				requiredCapabilities?: string[];
				estimatedContextSize?: number;
				budgetConstrained?: boolean;
				preferredProvider?: ModelProvider;
			};

			if (!taskDescription) {
				res.status(400).json({ error: 'taskDescription is required' });
				return;
			}

			const model = modelSelectorService.selectModelForAgent({
				taskDescription,
				agentType,
				requiredCapabilities,
				estimatedContextSize,
				budgetConstrained,
				preferredProvider,
			});

			res.json({ model });
		} catch (error) {
			console.error('Error selecting model for agent:', error);
			res.status(500).json({ error: `Failed to select model: ${(error as Error).message}` });
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
