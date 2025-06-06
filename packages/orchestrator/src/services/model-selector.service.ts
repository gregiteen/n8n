import { ModelProvider } from '../agent';
import { ApplicationError } from 'n8n-workflow';

export interface ModelInfo {
	id: string;
	name: string;
	provider: ModelProvider;
	description: string;
	capabilities: string[];
	contextWindow: number;
	costPer1kTokens: number;
	maxOutputTokens: number;
}

export class ModelSelectorService {
	private models: ModelInfo[] = [
		{
			id: 'gpt-4o',
			name: 'GPT-4o',
			provider: 'openai',
			description: "OpenAI's most capable model for text, vision, and audio tasks",
			capabilities: ['text', 'images', 'functions', 'browsing', 'vision'],
			contextWindow: 128000,
			costPer1kTokens: 0.01,
			maxOutputTokens: 4096,
		},
		{
			id: 'gpt-4-turbo',
			name: 'GPT-4 Turbo',
			provider: 'openai',
			description: 'Optimized version of GPT-4 with improved performance',
			capabilities: ['text', 'functions', 'browsing'],
			contextWindow: 128000,
			costPer1kTokens: 0.01,
			maxOutputTokens: 4096,
		},
		{
			id: 'gpt-3.5-turbo',
			name: 'GPT-3.5 Turbo',
			provider: 'openai',
			description: 'Fast and efficient model for most text tasks',
			capabilities: ['text', 'functions'],
			contextWindow: 16000,
			costPer1kTokens: 0.0015,
			maxOutputTokens: 4096,
		},
		{
			id: 'claude-3-opus-20240229',
			name: 'Claude 3 Opus',
			provider: 'anthropic',
			description: 'Most powerful Claude model for complex tasks',
			capabilities: ['text', 'images', 'browsing', 'vision'],
			contextWindow: 200000,
			costPer1kTokens: 0.015,
			maxOutputTokens: 4096,
		},
		{
			id: 'claude-3-sonnet-20240229',
			name: 'Claude 3 Sonnet',
			provider: 'anthropic',
			description: 'Balanced Claude model for most tasks',
			capabilities: ['text', 'images', 'browsing', 'vision'],
			contextWindow: 200000,
			costPer1kTokens: 0.003,
			maxOutputTokens: 4096,
		},
		{
			id: 'claude-3-haiku-20240307',
			name: 'Claude 3 Haiku',
			provider: 'anthropic',
			description: 'Fastest Claude model, best for simple tasks',
			capabilities: ['text', 'images', 'vision'],
			contextWindow: 200000,
			costPer1kTokens: 0.00025,
			maxOutputTokens: 4096,
		},
		{
			id: 'gemini-1.5-pro',
			name: 'Gemini 1.5 Pro',
			provider: 'gemini',
			description: "Google's most capable general model with long context",
			capabilities: ['text', 'images', 'functions', 'browsing', 'vision'],
			contextWindow: 1000000,
			costPer1kTokens: 0.0125,
			maxOutputTokens: 8192,
		},
		{
			id: 'gemini-1.5-flash',
			name: 'Gemini 1.5 Flash',
			provider: 'gemini',
			description: "Google's fastest model for general tasks",
			capabilities: ['text', 'images', 'functions', 'vision'],
			contextWindow: 1000000,
			costPer1kTokens: 0.0025,
			maxOutputTokens: 8192,
		},
	];

	getModels(filterOptions?: {
		provider?: ModelProvider;
		capability?: string;
		maxCost?: number;
	}): ModelInfo[] {
		let filteredModels = [...this.models];

		if (filterOptions?.provider) {
			filteredModels = filteredModels.filter((model) => model.provider === filterOptions.provider);
		}

		if (filterOptions?.capability) {
			filteredModels = filteredModels.filter((model) =>
				model.capabilities.includes(filterOptions.capability!),
			);
		}

		if (filterOptions?.maxCost !== undefined) {
			filteredModels = filteredModels.filter(
				(model) => model.costPer1kTokens <= filterOptions.maxCost!,
			);
		}

		return filteredModels;
	}

	getModel(modelId: string): ModelInfo {
		const model = this.models.find((m) => m.id === modelId);
		if (!model) {
			throw new ApplicationError(`Model with ID '${modelId}' not found`);
		}
		return model;
	}

	getDefaultModel(provider?: ModelProvider): ModelInfo {
		if (provider) {
			const models = this.getModels({ provider });
			return models[0] || this.models[0];
		}
		// Return a generally good default
		return this.getModel('gpt-4-turbo');
	}

	// Add a new model to the catalog
	addModel(model: ModelInfo): void {
		// Check if model with same ID already exists
		if (this.models.some((m) => m.id === model.id)) {
			throw new ApplicationError(`Model with ID '${model.id}' already exists`);
		}
		this.models.push(model);
	}

	// Compare costs between models for a specific task
	estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
		const model = this.getModel(modelId);
		return (
			(inputTokens / 1000) * model.costPer1kTokens +
			(outputTokens / 1000) * model.costPer1kTokens * 1.5 // Output tokens often cost more
		);
	}

	// Get models that support a specific capability
	getModelsByCapability(capability: string): ModelInfo[] {
		return this.models.filter((model) => model.capabilities.includes(capability));
	}

	/**
	 * Select the best model for an agent based on task requirements
	 */
	selectModelForAgent(requirements: {
		taskDescription: string;
		agentType?: string;
		requiredCapabilities?: string[];
		estimatedContextSize?: number;
		budgetConstrained?: boolean;
		preferredProvider?: ModelProvider;
	}): ModelInfo {
		const {
			// taskDescription is reserved for future semantic model selection
			agentType,
			requiredCapabilities = [],
			estimatedContextSize = 0,
			budgetConstrained = false,
			preferredProvider,
		} = requirements;

		// Add capability requirements based on agent type
		const capabilities: string[] = [...requiredCapabilities];
		if (agentType === 'web-browsing') {
			capabilities.push('browsing');
		}
		if (agentType === 'data-analysis' || agentType === 'function-calling') {
			capabilities.push('functions');
		}

		// Calculate minimum context window size
		// Add 25% buffer to the estimated context size
		const minContextWindow = Math.ceil(estimatedContextSize * 1.25);

		// Filter models based on requirements
		let candidateModels = [...this.models];

		// Filter by required capabilities
		if (capabilities.length > 0) {
			candidateModels = candidateModels.filter((model) =>
				capabilities.every((cap) => model.capabilities.includes(cap)),
			);
		}

		// Filter by context window
		if (minContextWindow > 0) {
			candidateModels = candidateModels.filter((model) => model.contextWindow >= minContextWindow);
		}

		// Filter by preferred provider if specified
		if (preferredProvider) {
			const providerModels = candidateModels.filter(
				(model) => model.provider === preferredProvider,
			);

			// Only use provider models if there are any that meet requirements
			if (providerModels.length > 0) {
				candidateModels = providerModels;
			}
		}

		// If budget constrained, sort by cost and take cheapest option
		if (budgetConstrained) {
			candidateModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);
			if (candidateModels.length > 0) {
				return candidateModels[0];
			}
		}

		// Otherwise, prioritize models with the largest context windows for flexibility
		candidateModels.sort((a, b) => {
			// Context window is the primary sorting factor
			const contextWindowDiff = b.contextWindow - a.contextWindow;

			// If context windows are similar (within 20%), prefer cheaper model
			if (Math.abs(contextWindowDiff) / Math.max(a.contextWindow, b.contextWindow) < 0.2) {
				return a.costPer1kTokens - b.costPer1kTokens;
			}

			return contextWindowDiff;
		});

		// Return best candidate or default to a generally capable model
		return candidateModels[0] || this.getDefaultModel(preferredProvider);
	}

	/**
	 * Get best model for a specific task type
	 */
	getModelForTaskType(
		taskType: 'conversation' | 'code' | 'summarization' | 'data-analysis' | 'agent',
	): ModelInfo {
		switch (taskType) {
			case 'code':
				return this.selectModelForAgent({
					taskDescription: 'Code generation and analysis',
					requiredCapabilities: ['text', 'functions'],
					estimatedContextSize: 16000, // Assuming code tasks need moderate context
				});

			case 'summarization':
				return this.selectModelForAgent({
					taskDescription: 'Text summarization',
					requiredCapabilities: ['text'],
					estimatedContextSize: 32000, // Summarization may need larger context
				});

			case 'data-analysis':
				return this.selectModelForAgent({
					taskDescription: 'Data analysis and visualization',
					requiredCapabilities: ['text', 'functions'],
					estimatedContextSize: 16000,
				});

			case 'agent':
				return this.selectModelForAgent({
					taskDescription: 'Autonomous agent operation',
					requiredCapabilities: ['text', 'functions'],
					estimatedContextSize: 32000,
				});

			case 'conversation':
			default:
				return this.selectModelForAgent({
					taskDescription: 'Conversational assistant',
					requiredCapabilities: ['text'],
					estimatedContextSize: 8000,
					budgetConstrained: true, // Use cheaper models for basic conversation
				});
		}
	}
}
