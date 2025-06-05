import { AnthropicClient } from '../src/clients/anthropic';
import { OpenAIClient } from '../src/clients/openai';
import { OpenRouterClient } from '../src/clients/openrouter';

jest.mock('n8n-workflow', () => ({ ApplicationError: class ApplicationError extends Error {} }), {
	virtual: true,
});

describe('LLM clients', () => {
	const env = process.env;

	beforeEach(() => {
		process.env = {
			...env,
			OPENAI_API_KEY: 'test',
			ANTHROPIC_API_KEY: 'test',
			OPENROUTER_API_KEY: 'test',
		};
	});

	afterEach(() => {
		process.env = env;
	});

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
