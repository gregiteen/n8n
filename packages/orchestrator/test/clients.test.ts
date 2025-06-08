// Mock all AI clients before any imports
jest.mock('openai', () => ({
	OpenAI: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [{ message: { content: 'mocked openai response' } }],
				}),
			},
		},
	})),
}));

jest.mock('@anthropic-ai/sdk', () => ({
	Anthropic: jest.fn().mockImplementation(() => ({
		messages: {
			create: jest.fn().mockResolvedValue({
				content: [{ text: 'mocked anthropic response' }],
			}),
		},
	})),
}));

jest.mock('openrouter-client', () => ({
	OpenRouter: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [{ message: { content: 'mocked openrouter response' } }],
				}),
			},
		},
	})),
}));

jest.mock('n8n-workflow', () => ({
	ApplicationError: class ApplicationError extends Error {
		constructor(message: string) {
			super(message);
			this.name = 'ApplicationError';
		}
	},
}));

// Set environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

import { AnthropicClient } from '../src/clients/anthropic';
import { OpenAIClient } from '../src/clients/openai';
import { OpenRouterClient } from '../src/clients/openrouter';

describe('LLM clients', () => {
	test('OpenAIClient initializes', () => {
		const client = new OpenAIClient();
		expect(client).toBeInstanceOf(OpenAIClient);
	});

	test('AnthropicClient initializes', () => {
		const client = new AnthropicClient();
		expect(client).toBeInstanceOf(AnthropicClient);
	});

	test('OpenRouterClient initializes', () => {
		const client = new OpenRouterClient();
		expect(client).toBeInstanceOf(OpenRouterClient);
	});
});
