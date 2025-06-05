import { Agent } from '../src/agent';
import { OpenAIClient } from '../src/clients/openai';

jest.mock('n8n-workflow', () => ({ ApplicationError: class ApplicationError extends Error {} }), {
	virtual: true,
});

jest.mock('../src/clients/openai');

describe('Agent', () => {
	test('send stores messages and returns response', async () => {
		const chat = jest.fn().mockResolvedValue('world');
		(OpenAIClient as jest.Mock).mockImplementation(() => ({ chat }));

		const agent = new Agent(new OpenAIClient());
		const res = await agent.send('hello');

		expect(res).toBe('world');
		expect(agent.getMemory()).toEqual([
			{ role: 'user', content: 'hello' },
			{ role: 'assistant', content: 'world' },
		]);
	});
});
