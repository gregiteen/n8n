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

import request from 'supertest';
import { Agent } from '../src/agent';
import { createApp } from '../src/server';

describe('server /chat', () => {
	test('returns chat response', async () => {
		const agent = new Agent({
			provider: 'openai',
			model: 'gpt-3.5-turbo',
		});

		// Mock the send method and getMemory method
		const mockSend = jest.fn().mockResolvedValue('pong');
		const mockGetMemory = jest.fn().mockReturnValue([
			{ role: 'user', content: 'ping' },
			{ role: 'assistant', content: 'pong' },
		]);
		agent.send = mockSend;
		agent.getMemory = mockGetMemory;

		const app = createApp(agent);
		const res = await request(app).post('/chat').send({ message: 'ping' });
		expect(res.status).toBe(200);
		expect(res.body.response).toBe('pong');
		expect(res.body.memory).toEqual([
			{ role: 'user', content: 'ping' },
			{ role: 'assistant', content: 'pong' },
		]);
	});

	test('rejects invalid body', async () => {
		const agent = new Agent({
			provider: 'openai',
			model: 'gpt-3.5-turbo',
		});

		const app = createApp(agent);
		const res = await request(app).post('/chat').send({});
		expect(res.status).toBe(400);
	});
});
