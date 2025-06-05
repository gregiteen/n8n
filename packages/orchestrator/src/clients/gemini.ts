import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
	Tool,
	FunctionDeclaration,
} from '@google/generative-ai';
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';

dotenv.config();

export interface GeminiToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
	required?: string[];
}

export class GeminiClient {
	private client: GoogleGenerativeAI;

	constructor(apiKey = process.env.GEMINI_API_KEY) {
		if (!apiKey) {
			throw new ApplicationError('GEMINI_API_KEY is required');
		}
		this.client = new GoogleGenerativeAI(apiKey);
	}

	async chat(
		messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
		model = 'gemini-1.5-pro',
		tools: GeminiToolDefinition[] = [],
	) {
		try {
			// Convert OpenAI-style messages to Gemini format
			const geminiMessages = this.convertToGeminiFormat(messages);

			// Convert tool definitions to Gemini tools format
			const geminiTools = this.convertToolsToGeminiFormat(tools);

			// Get the generative model with tools if provided
			const modelConfig: any = {
				model,
				systemInstruction: this.extractSystemMessage(messages),
			};

			if (tools.length > 0) {
				modelConfig.tools = geminiTools;
			}

			const generativeModel = this.client.getGenerativeModel(modelConfig);

			// Start a chat session
			const chat = generativeModel.startChat();

			// Send each message in order to build the conversation context
			let response;
			for (const msg of geminiMessages) {
				response = await chat.sendMessage(msg.parts);
			}

			return response?.response?.text() ?? '';
		} catch (error) {
			console.error('Error in Gemini chat:', error);
			throw new ApplicationError(`Gemini chat failed: ${(error as Error).message}`);
		}
	}

	// Extract system message from the messages array
	private extractSystemMessage(messages: Array<{ role: string; content: string }>) {
		const systemMessage = messages.find((msg) => msg.role === 'system');
		return systemMessage?.content ?? '';
	}

	// Convert OpenAI-style messages to Gemini format
	private convertToGeminiFormat(messages: Array<{ role: string; content: string }>) {
		// Filter out system messages as they're handled separately
		const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

		// Create conversation pairs
		return nonSystemMessages.map((msg) => ({
			role: msg.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: msg.content }],
		}));
	}

	// Convert tool definitions to Gemini tools format
	private convertToolsToGeminiFormat(tools: GeminiToolDefinition[]): Tool[] {
		return tools.map((tool) => ({
			functionDeclarations: [
				{
					name: tool.name,
					description: tool.description,
					parameters: tool.parameters,
				} as FunctionDeclaration,
			],
		}));
	}

	// Create a web browsing agent
	async createWebBrowsingAgent(model = 'gemini-1.5-pro') {
		try {
			// Gemini's web browsing capability uses their built-in tool system
			const webBrowsingTool: GeminiToolDefinition = {
				name: 'web_search',
				description: 'Search the web for information',
				parameters: {
					type: 'object',
					properties: {
						query: {
							type: 'string',
							description: 'The search query to use',
						},
					},
					required: ['query'],
				},
			};

			// Configure the model with web browsing capabilities
			const generativeModel = this.client.getGenerativeModel({
				model,
				tools: this.convertToolsToGeminiFormat([webBrowsingTool]),
			});

			return generativeModel;
		} catch (error) {
			console.error('Error creating web browsing agent:', error);
			throw new ApplicationError(
				`Failed to create web browsing agent: ${(error as Error).message}`,
			);
		}
	}

	// Execute an agent with specific tools
	async runAgent(query: string, tools: GeminiToolDefinition[], model = 'gemini-1.5-pro') {
		try {
			const generativeModel = this.client.getGenerativeModel({
				model,
				tools: this.convertToolsToGeminiFormat(tools),
			});

			const result = await generativeModel.generateContent(query);
			return result.response.text();
		} catch (error) {
			console.error('Error running Gemini agent:', error);
			throw new ApplicationError(`Gemini agent execution failed: ${(error as Error).message}`);
		}
	}
}
