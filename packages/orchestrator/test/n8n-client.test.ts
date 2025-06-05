import nock from 'nock';

import { N8nClient } from '../src/services/n8n-client';

describe('N8nClient', () => {
	const baseUrl = 'http://localhost:5678/api';
	const client = new N8nClient({ baseUrl, apiKey: 'test' });

	afterEach(() => {
		nock.cleanAll();
	});

	test('getWorkflows requests /workflows', async () => {
		nock(baseUrl)
			.get('/workflows')
			.reply(200, { data: [{ id: '1' }] });
		const workflows = await client.getWorkflows();
		expect(workflows).toEqual([{ id: '1' }]);
	});

	test('createWorkflow posts to /workflows', async () => {
		const workflow = { id: '1', name: 'test', nodes: [], connections: {} };
		nock(baseUrl).post('/workflows').reply(200, workflow);
		const result = await client.createWorkflow({
			name: 'test',
			nodes: [],
			connections: {},
		});
		expect(result).toEqual(workflow);
	});
});
