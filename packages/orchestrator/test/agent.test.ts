// Mock all AI clients before any imports
jest.mock('openai', () => ({
	OpenAI: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [{ message: { content: 'world' } }],
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

jest.mock('@google/generative-ai', () => ({
	GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
		getGenerativeModel: jest.fn().mockReturnValue({
			generateContent: jest.fn().mockResolvedValue({
				response: {
					text: jest.fn().mockReturnValue('mocked gemini response'),
				},
			}),
		}),
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

import { Agent } from '../src/agent';

describe('Agent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('send stores messages and returns response', async () => {
		const mockChat = jest.fn().mockResolvedValue('world');

		const agent = new Agent({
			provider: 'openai',
			model: 'gpt-3.5-turbo',
		});

		// Mock the chat method directly on the agent
		(agent as any).openaiClient = { chat: mockChat };

		const res = await agent.send('hello');

		expect(res).toBe('world');
		expect(agent.getMemory()).toEqual([
			{ role: 'user', content: 'hello' },
			{ role: 'assistant', content: 'world' },
		]);
	});
});
