import type { OpenAIClient as OpenAIClientClass } from './clients/openai';
import type { AnthropicClient as AnthropicClientClass } from './clients/anthropic';
import type { GeminiClient as GeminiClientClass } from './clients/gemini';
import type { OpenRouterClient as OpenRouterClientClass } from './clients/openrouter';
import { OpenAIClient } from './clients/openai';
import { AnthropicClient } from './clients/anthropic';
import { GeminiClient } from './clients/gemini';
import { OpenRouterClient } from './clients/openrouter';
import { AgentMemoryService, MemoryEntry } from './services/agent-memory.service';
import { libraryManager, type LibraryAnalysis, type SmartAgentConfig } from './libraries';

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
		const activeProvider = provider || this.provider;
		const activeModel = model || this.model;

		// Add the user input to messages
		this.messages.push({ role: 'user', content: input });

		let response: string;
		let toolResults: Record<string, unknown> | null = null;

		// Process with appropriate model provider, passing tools if available
		switch (activeProvider) {
			case 'anthropic':
				// Anthropic Claude supports tools via their API
				if (this.tools.length > 0) {
					try {
						const result = await this.anthropicClient.chatWithTools(
							this.messages,
							this.tools,
							activeModel,
						);
						response = result.response;
						toolResults = result.toolResults || null;
					} catch (err) {
						console.warn('Anthropic tool calling failed, falling back to regular chat:', err);
						response = await this.anthropicClient.chat(input, activeModel);
					}
				} else {
					response = await this.anthropicClient.chat(input, activeModel);
				}
				break;
			case 'gemini':
				// Google Gemini supports function calling
				if (this.tools.length > 0) {
					try {
						const result = await this.geminiClient.chatWithTools(
							this.messages,
							this.tools,
							activeModel,
						);
						response = result.response;
						toolResults = result.toolResults || null;
					} catch (err) {
						console.warn('Gemini tool calling failed, falling back to regular chat:', err);
						response = await this.geminiClient.chat(this.messages, activeModel);
					}
				} else {
					response = await this.geminiClient.chat(this.messages, activeModel);
				}
				break;
			case 'openai':
			default:
				// OpenAI has the most mature function calling
				if (this.tools.length > 0) {
					try {
						const result = await this.openaiClient.chatWithFunctions(
							this.messages,
							this.tools,
							activeModel,
						);
						response = result.response;
						toolResults = result.toolResults || null;
					} catch (err) {
						console.warn('OpenAI function calling failed, falling back to regular chat:', err);
						response = await this.openaiClient.chat(this.messages, activeModel);
					}
				} else {
					response = await this.openaiClient.chat(this.messages, activeModel);
				}
				break;
		}

		// If tool calls were made, execute the tools and get the results
		if (toolResults) {
			// Store tool usage in memory if enabled
			if (this.useMemory && this.memoryService && this.agentId) {
				try {
					await this.memoryService.addMemory({
						agentId: this.agentId,
						content: `Tool usage: ${JSON.stringify(toolResults)}`,
						metadata: {
							type: 'tool_usage',
							timestamp: new Date().toISOString(),
							tools: Object.keys(toolResults),
						},
					});
				} catch (error) {
					console.warn('Failed to save tool usage to memory:', error);
				}
			}

			// Add tool results as a system message for context
			this.messages.push({
				role: 'system',
				content: `Tool execution results: ${JSON.stringify(toolResults)}`,
			});
		}

		// Add the assistant response to messages
		this.messages.push({ role: 'assistant', content: response });

		// If memory is enabled, save the assistant response
		if (this.useMemory && this.memoryService && this.agentId) {
			try {
				await this.memoryService.addMemory({
					agentId: this.agentId,
					content: `Assistant: ${response}`,
					metadata: {
						type: 'assistant_message',
						timestamp: new Date().toISOString(),
						hasToolUsage: toolResults !== null,
					},
				});
			} catch (error) {
				console.warn('Failed to save to memory:', error);
			}
		}

		return response;
	}

	/**
	 * Execute a specific tool by name with the provided arguments
	 */
	async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
		const tool = this.tools.find((t) => t.name === toolName);

		if (!tool) {
			throw new Error(`Tool "${toolName}" not found`);
		}

		if (!tool.execute) {
			throw new Error(`Tool "${toolName}" does not have an execute function`);
		}

		// Execute the tool
		try {
			const result = await tool.execute(args);

			// Save tool execution to memory if enabled
			if (this.useMemory && this.memoryService && this.agentId) {
				await this.memoryService.addMemory({
					agentId: this.agentId,
					content: `Executed tool "${toolName}" with args: ${JSON.stringify(args)}`,
					metadata: {
						type: 'tool_execution',
						timestamp: new Date().toISOString(),
						tool: toolName,
						args,
					},
				});
			}

			return result;
		} catch (error) {
			console.error(`Error executing tool "${toolName}":`, error);
			throw error;
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
	 * Add a system prompt to guide agent behavior
	 */
	addSystemPrompt(systemPrompt: string): Agent {
		this.messages.push({ role: 'system', content: systemPrompt });
		return this;
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

	/**
	 * Analyze the current agent configuration and usage
	 */
	async analyze(): Promise<LibraryAnalysis> {
		if (!this.agentId) {
			throw new Error('Agent ID is not set');
		}

		// Gather memory usage data
		let memoryUsage: MemoryEntry[] = [];
		if (this.useMemory && this.memoryService) {
			try {
				memoryUsage = await this.memoryService.getAgentMemories(this.agentId);
			} catch (error) {
				console.warn('Failed to retrieve memory usage data:', error);
			}
		}

		// Gather tool usage data
		let toolUsage = [];
		if (this.useMemory && this.memoryService) {
			try {
				const allMemories = await this.memoryService.getAgentMemories(this.agentId);
				toolUsage = allMemories.filter((m) => m.metadata?.type === 'tool_usage');
			} catch (error) {
				console.warn('Failed to retrieve tool usage data:', error);
			}
		}

		// Analyze capabilities based on provider
		let capabilities: string[] = [];
		switch (this.provider) {
			case 'openai':
				capabilities = ['chat', 'functions', 'memory'];
				break;
			case 'anthropic':
				capabilities = ['chat', 'tools', 'memory'];
				break;
			case 'gemini':
				capabilities = ['chat', 'functions'];
				break;
			default:
				capabilities = ['chat'];
		}

		// Analyze library usage
		const libraryUsage = await libraryManager.analyzeAgentLibraries(this.agentId);

		return {
			agentId: this.agentId,
			provider: this.provider,
			model: this.model,
			memoryUsage,
			toolUsage,
			capabilities,
			libraryUsage,
		};
	}

	/**
	 * Configure smart agent settings
	 */
	configureSmartAgent(config: SmartAgentConfig): void {
		// TODO: Implement smart agent configuration
		console.log('Configuring smart agent with:', config);
	}
}
