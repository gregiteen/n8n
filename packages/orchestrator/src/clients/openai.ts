/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';
import { OpenAI } from 'openai';

dotenv.config();

export class OpenAIClient {
	private client: OpenAI;

	constructor(apiKey = process.env.OPENAI_API_KEY) {
		if (!apiKey) {
			throw new ApplicationError('OPENAI_API_KEY is required');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
		this.client = new OpenAI({ apiKey });
	}

	async chat(
		messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		model = 'gpt-3.5-turbo',
	) {
		const response = await this.client.chat.completions.create({
			model,
			messages,
		});
		return String(response.choices[0]?.message?.content ?? '');
	}

	/**
	 * Chat with function calling capabilities
	 */
	async chatWithFunctions(
		messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		tools: Array<{
			name: string;
			description: string;
			parameters: Record<string, unknown>;
		}>,
		model = 'gpt-4-turbo',
	): Promise<{
		response: string;
		toolResults?: Record<string, unknown>;
	}> {
		try {
			// Convert tools to OpenAI function format
			const openAITools = tools.map((tool) => ({
				type: 'function' as const,
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.parameters,
				},
			}));

			// Create chat completion with tools
			const response = await this.client.chat.completions.create({
				model,
				messages,
				tools: openAITools,
				tool_choice: 'auto',
			});

			const responseMessage = response.choices[0]?.message;

			// Check if model wants to call a function
			if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
				const toolCalls = responseMessage.tool_calls;
				const toolResults: Record<string, unknown> = {};

				// Process each tool call
				for (const toolCall of toolCalls) {
					const functionName = toolCall.function.name;
					let functionArgs;

					try {
						functionArgs = JSON.parse(toolCall.function.arguments);
					} catch {
						functionArgs = {}; // Default to empty object if parsing fails
					}

					toolResults[functionName] = functionArgs;
				}

				return {
					response: String(responseMessage?.content ?? ''),
					toolResults,
				};
			}

			// No function calls
			return {
				response: String(responseMessage?.content ?? ''),
			};
		} catch (error) {
			console.error('Error in OpenAI chat with functions:', error);
			throw new ApplicationError(`OpenAI function calling failed: ${(error as Error).message}`);
		}
	}
}
