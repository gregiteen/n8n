import type { OpenAIClient as OpenAIClientClass } from './clients/openai';
import type { AnthropicClient as AnthropicClientClass } from './clients/anthropic';
import type { GeminiClient as GeminiClientClass } from './clients/gemini';
import type { OpenRouterClient as OpenRouterClientClass } from './clients/openrouter';
import { OpenAIClient } from './clients/openai';
import { AnthropicClient } from './clients/anthropic';
import { GeminiClient } from './clients/gemini';
import { OpenRouterClient } from './clients/openrouter';

export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AgentOptions {
	model?: string;
	provider?: ModelProvider;
	systemPrompt?: string;
	capabilities?: string[];
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
	required?: string[];
	execute?: (args: Record<string, unknown>) => Promise<unknown>;
}

export class Agent {
	private messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
	private provider: ModelProvider;
	private openaiClient: OpenAIClientClass;
	private anthropicClient: AnthropicClientClass;
	private geminiClient: GeminiClientClass;
	private openrouterClient: OpenRouterClientClass;
	private model?: string;
	private tools: ToolDefinition[] = [];

	constructor(options: AgentOptions = {}) {
		this.provider = options.provider || 'openai';
		this.model = options.model;

		// Initialize clients
		this.openaiClient = new OpenAIClient();
		this.anthropicClient = new AnthropicClient();
		this.geminiClient = new GeminiClient();
		this.openrouterClient = new OpenRouterClient();

		// Add system prompt if provided
		if (options.systemPrompt) {
			this.messages.push({ role: 'system', content: options.systemPrompt });
		}
	}

	async send(input: string, model?: string, provider?: ModelProvider) {
		const activeProvider = provider || this.provider;
		const activeModel = model || this.model;

		this.messages.push({ role: 'user', content: input });

		let response: string;

		switch (activeProvider) {
			case 'anthropic':
				response = await this.anthropicClient.chat(input, activeModel);
				break;
			case 'gemini':
				response = await this.geminiClient.chat(this.messages, activeModel);
				break;
			case 'openrouter':
				response = await this.openrouterClient.chat(this.messages, activeModel);
				break;
			case 'openai':
			default:
				response = await this.openaiClient.chat(this.messages, activeModel);
				break;
		}

		this.messages.push({ role: 'assistant', content: response });
		return response;
	}

	addTool(tool: ToolDefinition) {
		this.tools.push(tool);
		return this;
	}

	async sendWithTools(input: string, model?: string, provider?: ModelProvider) {
		// This is a placeholder for now - full tools implementation will depend on specific provider APIs
		// Each provider has a different tools implementation
		return this.send(input, model, provider);
	}

	async createWebBrowsingAgent(model?: string) {
		const activeModel = model || this.model;
		switch (this.provider) {
			case 'gemini':
				return this.geminiClient.createWebBrowsingAgent(activeModel);
			case 'openai':
				// OpenAI browsing capability uses their own built-in tools
				// Implementation would depend on OpenAI's browsing agent API
				throw new Error('OpenAI web browsing not yet implemented');
			case 'anthropic':
				// Claude has web browsing capability in newer models
				throw new Error('Anthropic web browsing not yet implemented');
			default:
				throw new Error(`Web browsing not supported for provider: ${this.provider}`);
		}
	}

	getMemory() {
		return this.messages;
	}

	setProvider(provider: ModelProvider) {
		this.provider = provider;
		return this;
	}

	setModel(model: string) {
		this.model = model;
		return this;
	}
}
