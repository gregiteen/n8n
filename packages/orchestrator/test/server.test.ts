import request from 'supertest';

jest.mock('n8n-workflow', () => ({ ApplicationError: class ApplicationError extends Error {} }), {
	virtual: true,
});

import { Agent } from '../src/agent';
import { createApp } from '../src/server';

describe('server /chat', () => {
	test('returns chat response', async () => {
		const agent = new Agent({
			provider: 'openai',
			model: 'gpt-3.5-turbo',
		});

		// Mock the send method
		const mockSend = jest.fn().mockResolvedValue('pong');
		agent.send = mockSend;

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
