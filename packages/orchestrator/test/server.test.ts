import request from 'supertest';

jest.mock('n8n-workflow', () => ({ ApplicationError: class ApplicationError extends Error {} }), {
	virtual: true,
});
jest.mock('../src/clients/openai');

import { Agent } from '../src/agent';
import { OpenAIClient } from '../src/clients/openai';
import { createApp } from '../src/server';

describe('server /chat', () => {
	test('returns chat response', async () => {
		const chat = jest.fn().mockResolvedValue('pong');
		(OpenAIClient as jest.Mock).mockImplementation(() => ({ chat }));

		const app = createApp(new Agent(new OpenAIClient()));
		const res = await request(app).post('/chat').send({ message: 'ping' });
		expect(res.status).toBe(200);
		expect(res.body.response).toBe('pong');
		expect(res.body.memory).toEqual([
			{ role: 'user', content: 'ping' },
			{ role: 'assistant', content: 'pong' },
		]);
	});

	test('rejects invalid body', async () => {
		const app = createApp(new Agent(new OpenAIClient()));
		const res = await request(app).post('/chat').send({});
		expect(res.status).toBe(400);
	});
});
