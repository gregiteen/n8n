/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';

dotenv.config();

export class AnthropicClient {
	private client: Anthropic;

	constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
		if (!apiKey) {
			throw new ApplicationError('ANTHROPIC_API_KEY is required');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
		this.client = new Anthropic({ apiKey });
	}

	async chat(prompt: string, model = 'claude-3-opus-20240229') {
		interface MessageResponse {
			content?: Array<{ text?: string }>;
		}

		const response = (await this.client.messages.create({
			model,
			max_tokens: 1024,
			messages: [{ role: 'user', content: prompt }],
		})) as MessageResponse;
		return String(response.content?.[0]?.text ?? '');
	}

	/**
	 * Chat with tools for Claude models that support function calling/tools
	 */
	async chatWithTools(
		messages: Array<{ role: string; content: string }>,
		tools: Array<{
			name: string;
			description: string;
			parameters: Record<string, unknown>;
		}>,
		model = 'claude-3-opus-20240229',
	): Promise<{
		response: string;
		toolResults?: Record<string, unknown>;
	}> {
		try {
			// Convert to Anthropic message format
			const anthropicMessages = messages.map((msg) => {
				// Anthropic only supports user and assistant roles in messages
				const role =
					msg.role === 'system'
						? 'user'
						: msg.role === 'user'
							? 'user'
							: msg.role === 'assistant'
								? 'assistant'
								: 'user';
				return { role: role as 'user' | 'assistant', content: msg.content };
			});

			// Convert tools to Anthropic tool format
			const anthropicTools = tools.map((tool) => ({
				name: tool.name,
				description: tool.description,
				input_schema: {
					type: 'object' as const,
					properties: tool.parameters.properties as Record<string, unknown>,
					required: (tool.parameters.required as string[]) || [],
				},
			}));

			// Create message with tools
			const response = await this.client.messages.create({
				model,
				max_tokens: 4096,
				messages: anthropicMessages,
				tools: anthropicTools,
			});

			let toolResults: Record<string, unknown> | undefined;

			// Check for tool use
			if (response.content && response.content.length > 0) {
				for (const item of response.content) {
					if (item.type === 'tool_use') {
						// Store tool call information
						toolResults = {
							[item.name]: item.input,
						};
						break;
					}
				}
			}

			// Extract text from response
			const textContent =
				response.content
					?.filter((item) => item.type === 'text')
					.map((item) => item.text)
					.join('') ?? '';

			return {
				response: textContent,
				toolResults,
			};
		} catch (error) {
			console.error('Error in Anthropic chat with tools:', error);
			throw new ApplicationError(`Anthropic chat with tools failed: ${(error as Error).message}`);
		}
	}
}
