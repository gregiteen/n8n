import { Agent } from '../src/agent';

jest.mock('n8n-workflow', () => ({ ApplicationError: class ApplicationError extends Error {} }), {
	virtual: true,
});

describe('Agent', () => {
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
