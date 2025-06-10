import express from 'express';

import type { ModelProvider } from './agent';
import { Agent } from './agent';
import type { AgentType } from './agent-factory';
import { AgentFactory } from './agent-factory';
import { ModelSelector } from './models/model-selector';
import { ModelSelectorService } from './services/model-selector.service';
import { ApiKeyService } from './services/api-key.service';
import { TaskQueueService } from './services/task-queue.service';
import { TaskController } from './controllers/task.controller';
import { Logger } from './logger';

export function createApp(agent = new Agent()) {
	const app = express();
	const apiKeyService = new ApiKeyService();
	const logger = new Logger('orchestrator');
	const taskQueueService = new TaskQueueService(logger);
	const taskController = new TaskController(logger, taskQueueService);

	// Helper function for error logging
	const logError = (message: string, error: unknown) => {
		logger.error(message, { error: error instanceof Error ? error.message : String(error) });
	};

	app.use(express.json());

	// Health check endpoint
	app.get('/health', (_req, res) => {
		res.json({ status: 'ok' });
	});

	// API Key Management endpoints
	app.get('/api/user/api-keys', async (req, res) => {
		try {
			// In production, get userId from authenticated session
			const userId = (req.headers['user-id'] as string) || 'default-user';
			const keys = await apiKeyService.getAllKeys(userId);
			res.json(keys);
		} catch (error) {
			console.error('Error getting API keys:', error);
			res.status(500).json({ error: `Failed to get API keys: ${(error as Error).message}` });
		}
	});

	app.post('/api/user/api-keys', async (req, res) => {
		try {
			const { serviceName, apiKey } = req.body;
			// In production, get userId from authenticated session
			const userId = (req.headers['user-id'] as string) || 'default-user';

			const result = await apiKeyService.saveKey(userId, { serviceName, apiKey });
			res.json(result);
		} catch (error) {
			console.error('Error saving API key:', error);
			res.status(500).json({ error: `Failed to save API key: ${(error as Error).message}` });
		}
	});

	app.delete('/api/user/api-keys/:serviceName', async (req, res) => {
		try {
			const { serviceName } = req.params;
			// In production, get userId from authenticated session
			const userId = (req.headers['user-id'] as string) || 'default-user';

			await apiKeyService.deleteKey(userId, serviceName);
			res.json({ success: true });
		} catch (error) {
			console.error('Error deleting API key:', error);
			res.status(500).json({ error: `Failed to delete API key: ${(error as Error).message}` });
		}
	});

	app.post('/api/user/api-keys/validate', async (req, res) => {
		try {
			const { serviceName, apiKey } = req.body;
			const result = await apiKeyService.validateKey({ serviceName, apiKey });
			res.json(result);
		} catch (error) {
			console.error('Error validating API key:', error);
			res.status(500).json({ error: `Failed to validate API key: ${(error as Error).message}` });
		}
	});

	app.post('/api/user/api-keys/revalidate', async (req, res) => {
		try {
			// In production, get userId from authenticated session
			const userId = (req.headers['user-id'] as string) || 'default-user';

			// Get all keys for user
			const keys = await apiKeyService.getAllKeys(userId);
			const updatedKeys: any[] = [];

			// Revalidate each key
			for (const key of keys) {
				try {
					// Get the decrypted key
					const apiKey = await apiKeyService.getKey(userId, key.serviceName);

					if (!apiKey) {
						// Key couldn't be retrieved, mark as invalid
						updatedKeys.push({
							...key,
							isConnected: false,
						});
						continue;
					}

					// Validate the key
					const validation = await apiKeyService.validateKey({
						serviceName: key.serviceName,
						apiKey,
					});

					// Update key status
					await apiKeyService.updateKeyStatus(userId, key.serviceName, validation.isValid);

					// Add updated key to result
					updatedKeys.push({
						serviceName: key.serviceName,
						isConnected: validation.isValid,
						lastValidated: new Date(),
					});
				} catch (keyError) {
					// If validation fails, mark key as invalid
					console.error(`Error validating key ${key.serviceName}:`, keyError);
					updatedKeys.push({
						serviceName: key.serviceName,
						isConnected: false,
						lastValidated: new Date(),
					});
				}
			}

			res.json(updatedKeys);
		} catch (error) {
			console.error('Error revalidating API keys:', error);
			res.status(500).json({ error: `Failed to revalidate API keys: ${(error as Error).message}` });
		}
	});

	// Chat endpoint
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
	}); // Task management endpoints

	// Create a task
	app.post('/tasks', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.createTask(req, res);
		} catch (error) {
			logError('Error creating task:', error);
			res.status(500).json({ error: `Failed to create task: ${(error as Error).message}` });
		}
	});

	// Get a task by ID
	app.get('/tasks/:id', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.getTaskById(req, res);
		} catch (error) {
			logError('Error getting task:', error);
			res.status(500).json({ error: `Failed to get task: ${(error as Error).message}` });
		}
	});

	// Get all tasks
	app.get('/tasks', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.getAllTasks(req, res);
		} catch (error) {
			logError('Error getting tasks:', error);
			res.status(500).json({ error: `Failed to get tasks: ${(error as Error).message}` });
		}
	});

	// Update a task
	app.put('/tasks/:id', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.updateTask(req, res);
		} catch (error) {
			logError('Error updating task:', error);
			res.status(500).json({ error: `Failed to update task: ${(error as Error).message}` });
		}
	});

	// Delete a task
	app.delete('/tasks/:id', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.deleteTask(req, res);
		} catch (error) {
			logError('Error deleting task:', error);
			res.status(500).json({ error: `Failed to delete task: ${(error as Error).message}` });
		}
	});

	// Task actions

	// Pause task
	app.post('/tasks/:id/pause', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.pauseTask(req, res);
		} catch (error) {
			logError(`Error pausing task ${req.params.id}:`, error);
			if ((error as Error).message.includes('not found')) {
				res.status(404).json({ error: (error as Error).message });
			} else {
				res.status(500).json({ error: `Failed to pause task: ${(error as Error).message}` });
			}
		}
	});

	// Resume task
	app.post('/tasks/:id/resume', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.resumeTask(req, res);
		} catch (error) {
			logError(`Error resuming task ${req.params.id}:`, error);
			if ((error as Error).message.includes('not found')) {
				res.status(404).json({ error: (error as Error).message });
			} else {
				res.status(500).json({ error: `Failed to resume task: ${(error as Error).message}` });
			}
		}
	});

	// Cancel task
	app.post('/tasks/:id/cancel', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.cancelTask(req, res);
		} catch (error) {
			logError(`Error cancelling task ${req.params.id}:`, error);
			if ((error as Error).message.includes('not found')) {
				res.status(404).json({ error: (error as Error).message });
			} else {
				res.status(500).json({ error: `Failed to cancel task: ${(error as Error).message}` });
			}
		}
	});

	// Retry task
	app.post('/tasks/:id/retry', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.retryTask(req, res);
		} catch (error) {
			logError(`Error retrying task ${req.params.id}:`, error);
			if ((error as Error).message.includes('not found')) {
				res.status(404).json({ error: (error as Error).message });
			} else {
				res.status(500).json({ error: `Failed to retry task: ${(error as Error).message}` });
			}
		}
	});

	// Queue statistics
	app.get('/tasks/stats', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.getQueueStats(req, res);
		} catch (error) {
			logError('Error getting queue stats:', error);
			res
				.status(500)
				.json({ error: `Failed to get queue statistics: ${(error as Error).message}` });
		}
	});

	// Batch operations

	// Cancel all tasks
	app.post('/tasks/cancel-all', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.cancelAllTasks(req, res);
		} catch (error) {
			logError('Error cancelling all tasks:', error);
			res.status(500).json({ error: `Failed to cancel all tasks: ${(error as Error).message}` });
		}
	});

	// Pause all tasks
	app.post('/tasks/pause-all', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.pauseAllTasks(req, res);
		} catch (error) {
			logError('Error pausing all tasks:', error);
			res.status(500).json({ error: `Failed to pause all tasks: ${(error as Error).message}` });
		}
	});

	// Resume all tasks
	app.post('/tasks/resume-all', async (req, res) => {
		try {
			// Pass the request and response directly to the controller
			await taskController.resumeAllTasks(req, res);
		} catch (error) {
			logError('Error resuming all tasks:', error);
			res.status(500).json({ error: `Failed to resume all tasks: ${(error as Error).message}` });
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
