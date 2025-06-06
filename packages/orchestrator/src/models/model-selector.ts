import { ModelProvider } from '../agent';

export interface ModelOption {
	id: string;
	name: string;
	provider: ModelProvider;
	description: string;
	capabilities: string[];
	contextLength: number;
	costPer1kTokens: number;
}

export const modelOptions: ModelOption[] = [
	// OpenAI models
	{
		id: 'gpt-4o',
		name: 'GPT-4o',
		provider: 'openai',
		description: 'Most capable GPT-4 model optimized for speed and cost',
		capabilities: ['text', 'vision', 'function-calling', 'json-mode', 'tools'],
		contextLength: 128000,
		costPer1kTokens: 0.01,
	},
	{
		id: 'gpt-4-turbo',
		name: 'GPT-4 Turbo',
		provider: 'openai',
		description: 'GPT-4 Turbo with improved capabilities',
		capabilities: ['text', 'vision', 'function-calling', 'json-mode', 'tools'],
		contextLength: 128000,
		costPer1kTokens: 0.01,
	},
	{
		id: 'gpt-3.5-turbo',
		name: 'GPT-3.5 Turbo',
		provider: 'openai',
		description: 'Fast and efficient model for most tasks',
		capabilities: ['text', 'function-calling', 'json-mode', 'tools'],
		contextLength: 16000,
		costPer1kTokens: 0.0015,
	},

	// Anthropic models
	{
		id: 'claude-3-opus-20240229',
		name: 'Claude 3 Opus',
		provider: 'anthropic',
		description: 'Most powerful Claude model for complex tasks',
		capabilities: ['text', 'vision', 'tool-use'],
		contextLength: 200000,
		costPer1kTokens: 0.015,
	},
	{
		id: 'claude-3-sonnet-20240229',
		name: 'Claude 3 Sonnet',
		provider: 'anthropic',
		description: 'Balanced model for most tasks',
		capabilities: ['text', 'vision', 'tool-use'],
		contextLength: 200000,
		costPer1kTokens: 0.003,
	},
	{
		id: 'claude-3-haiku-20240307',
		name: 'Claude 3 Haiku',
		provider: 'anthropic',
		description: 'Fast and efficient model for simpler tasks',
		capabilities: ['text', 'vision', 'tool-use'],
		contextLength: 200000,
		costPer1kTokens: 0.00025,
	},

	// Gemini models
	{
		id: 'gemini-1.5-pro',
		name: 'Gemini 1.5 Pro',
		provider: 'gemini',
		description: 'Most powerful Gemini model with long context',
		capabilities: ['text', 'vision', 'tool-use', 'function-calling'],
		contextLength: 1000000,
		costPer1kTokens: 0.0025,
	},
	{
		id: 'gemini-1.5-flash',
		name: 'Gemini 1.5 Flash',
		provider: 'gemini',
		description: 'Faster, more efficient Gemini model',
		capabilities: ['text', 'vision', 'tool-use', 'function-calling'],
		contextLength: 1000000,
		costPer1kTokens: 0.0005,
	},
	{
		id: 'gemini-pro',
		name: 'Gemini Pro',
		provider: 'gemini',
		description: 'Previous generation Gemini model',
		capabilities: ['text', 'function-calling'],
		contextLength: 32000,
		costPer1kTokens: 0.0005,
	},
];

export class ModelSelector {
	// Get all available models
	static getAllModels(): ModelOption[] {
		return modelOptions;
	}

	// Get models by provider
	static getModelsByProvider(provider: ModelProvider): ModelOption[] {
		return modelOptions.filter((model) => model.provider === provider);
	}

	// Get model by ID
	static getModelById(id: string): ModelOption | undefined {
		return modelOptions.find((model) => model.id === id);
	}

	// Get models by capability
	static getModelsByCapability(capability: string): ModelOption[] {
		return modelOptions.filter((model) => model.capabilities.includes(capability));
	}

	// Get models sorted by cost (cheapest first)
	static getModelsByCost(ascending = true): ModelOption[] {
		return [...modelOptions].sort((a, b) =>
			ascending ? a.costPer1kTokens - b.costPer1kTokens : b.costPer1kTokens - a.costPer1kTokens,
		);
	}

	// Get models sorted by context length (highest first by default)
	static getModelsByContextLength(descending = true): ModelOption[] {
		return [...modelOptions].sort((a, b) =>
			descending ? b.contextLength - a.contextLength : a.contextLength - b.contextLength,
		);
	}

	// Recommend a model based on requirements
	static recommendModel(requirements: {
		capabilities?: string[];
		minContextLength?: number;
		maxCost?: number;
		preferredProvider?: ModelProvider;
	}): ModelOption | undefined {
		const { capabilities, minContextLength, maxCost, preferredProvider } = requirements;

		let filteredModels = [...modelOptions];

		// Filter by capabilities
		if (capabilities && capabilities.length > 0) {
			filteredModels = filteredModels.filter((model) =>
				capabilities.every((cap) => model.capabilities.includes(cap)),
			);
		}

		// Filter by context length
		if (minContextLength) {
			filteredModels = filteredModels.filter((model) => model.contextLength >= minContextLength);
		}

		// Filter by cost
		if (maxCost) {
			filteredModels = filteredModels.filter((model) => model.costPer1kTokens <= maxCost);
		}

		// Filter by preferred provider
		if (preferredProvider) {
			const providerModels = filteredModels.filter((model) => model.provider === preferredProvider);
			if (providerModels.length > 0) {
				filteredModels = providerModels;
			}
		}

		// Sort by cost and return the cheapest option that meets all requirements
		return filteredModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)[0];
	}
}
