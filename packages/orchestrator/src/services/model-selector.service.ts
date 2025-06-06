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
}
