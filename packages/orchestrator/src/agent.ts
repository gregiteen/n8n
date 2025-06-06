import type { OpenAIClient as OpenAIClientClass } from './clients/openai';
import type { AnthropicClient as AnthropicClientClass } from './clients/anthropic';
import type { GeminiClient as GeminiClientClass } from './clients/gemini';
import type { OpenRouterClient as OpenRouterClientClass } from './clients/openrouter';
import { OpenAIClient } from './clients/openai';
import { AnthropicClient } from './clients/anthropic';
import { GeminiClient } from './clients/gemini';
import { OpenRouterClient } from './clients/openrouter';
import { AgentMemoryService, MemoryEntry } from './services/agent-memory.service';

export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AgentOptions {
	model?: string;
	provider?: ModelProvider;
	systemPrompt?: string;
	capabilities?: string[];
	agentId?: string;
	persistMemory?: boolean;
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
	private memoryService?: AgentMemoryService;
	private model?: string;
	private tools: ToolDefinition[] = [];
	private agentId?: string;
	private useMemory = false;

	constructor(options: AgentOptions = {}) {
		this.provider = options.provider || 'openai';
		this.model = options.model;
		this.agentId = options.agentId;

		// Initialize clients
		this.openaiClient = new OpenAIClient();
		this.anthropicClient = new AnthropicClient();
		this.geminiClient = new GeminiClient();
		this.openrouterClient = new OpenRouterClient();

		// Initialize memory service if agent ID is provided
		if (this.agentId) {
			try {
				this.memoryService = new AgentMemoryService();
				this.useMemory = true;
			} catch (error) {
				console.warn('Failed to initialize memory service:', error);
				this.useMemory = false;
			}
		}

		// Add system prompt if provided
		if (options.systemPrompt) {
			this.messages.push({ role: 'system', content: options.systemPrompt });
		}
	}

	async send(input: string, model?: string, provider?: ModelProvider) {
		const activeProvider = provider || this.provider;
		const activeModel = model || this.model;

		// If memory is enabled, retrieve relevant memories first
		if (this.useMemory && this.memoryService && this.agentId) {
			try {
				const memories = await this.memoryService.searchMemory({
					agentId: this.agentId,
					query: input,
					limit: 5,
				});

				// If memories are found, add them to context
				if (memories.length > 0) {
					const memoryContext = `
Relevant information from your previous conversations:
${memories.map((m) => `- ${m.content}`).join('\n')}

Given this context, please respond to the user's current message.
`;

					// Add memory context as a system message
					this.messages.push({ role: 'system', content: memoryContext });
				}
			} catch (error) {
				console.warn('Failed to retrieve memories:', error);
			}
		}

		// Add the user input to messages
		this.messages.push({ role: 'user', content: input });

		let response: string;

		// Get response from appropriate model provider
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

		// Add the assistant response to messages
		this.messages.push({ role: 'assistant', content: response });

		// If memory is enabled, save both the user input and assistant response
		if (this.useMemory && this.memoryService && this.agentId) {
			try {
				// Save user message to memory
				await this.memoryService.addMemory({
					agentId: this.agentId,
					content: `User: ${input}`,
					metadata: { type: 'user_message', timestamp: new Date().toISOString() },
				});

				// Save assistant response to memory
				await this.memoryService.addMemory({
					agentId: this.agentId,
					content: `Assistant: ${response}`,
					metadata: { type: 'assistant_message', timestamp: new Date().toISOString() },
				});
			} catch (error) {
				console.warn('Failed to save to memory:', error);
			}
		}

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

	getProvider(): ModelProvider {
		return this.provider;
	}

	setModel(model: string) {
		this.model = model;
		return this;
	}

	getModel(): string | undefined {
		return this.model;
	}

	getTools(): ToolDefinition[] {
		return this.tools;
	}

	/**
	 * Retrieve all memories for this agent
	 */
	async getAllMemories(): Promise<MemoryEntry[]> {
		if (!this.useMemory || !this.memoryService || !this.agentId) {
			throw new Error('Memory service is not available or agent ID is not set');
		}

		return this.memoryService.getAgentMemories(this.agentId);
	}

	/**
	 * Search agent memories by query
	 */
	async searchMemories(query: string, limit = 10): Promise<MemoryEntry[]> {
		if (!this.useMemory || !this.memoryService || !this.agentId) {
			throw new Error('Memory service is not available or agent ID is not set');
		}

		return this.memoryService.searchMemory({
			agentId: this.agentId,
			query,
			limit,
		});
	}

	/**
	 * Add a memory entry explicitly
	 */
	async addMemory(content: string, metadata: Record<string, unknown> = {}): Promise<string> {
		if (!this.useMemory || !this.memoryService || !this.agentId) {
			throw new Error('Memory service is not available or agent ID is not set');
		}

		return this.memoryService.addMemory({
			agentId: this.agentId,
			content,
			metadata: { ...metadata, timestamp: new Date().toISOString() },
		});
	}

	/**
	 * Clear all memories for this agent
	 */
	async clearMemory(): Promise<void> {
		if (!this.useMemory || !this.memoryService || !this.agentId) {
			throw new Error('Memory service is not available or agent ID is not set');
		}

		await this.memoryService.clearAgentMemory(this.agentId);
	}

	/**
	 * Enable or disable memory persistence
	 */
	setMemoryEnabled(enabled: boolean): void {
		this.useMemory = enabled && !!this.memoryService && !!this.agentId;
	}
}
