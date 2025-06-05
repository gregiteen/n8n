import request from 'supertest';

import { app } from '../src/server';

describe('orchestrator server', () => {
	test('GET /health returns ok', async () => {
		const response = await request(app).get('/health');
		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});
});
