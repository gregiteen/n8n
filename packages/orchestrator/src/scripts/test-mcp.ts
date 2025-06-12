/**
 * Test Script for MCP Implementation
 *
 * This script can be used to test the MCP implementation:
 * - Tool discovery
 * - Tool registration
 * - Tool execution
 *
 * Usage:
 * $ ts-node src/scripts/test-mcp.ts
 */

import axios from 'axios';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const LOG_ENABLED = true;

// Test cases
const TEST_CASES = [
	{
		name: 'Get MCP Schema',
		method: 'GET',
		url: '/mcp/schema',
		data: null,
	},
	{
		name: 'List All Tools',
		method: 'GET',
		url: '/mcp/tools',
		data: null,
	},
	{
		name: 'Execute HTTP Request Tool',
		method: 'POST',
		url: '/mcp/run',
		data: {
			name: 'HTTP Request',
			parameters: {
				url: 'https://jsonplaceholder.typicode.com/todos/1',
				method: 'GET',
			},
		},
	},
	{
		name: 'Execute Text Manipulation Tool',
		method: 'POST',
		url: '/mcp/run',
		data: {
			name: 'Text Manipulation',
			parameters: {
				text: 'hello world',
				operation: 'uppercase',
			},
		},
	},
	{
		name: 'Test OpenAI-compatible Endpoint',
		method: 'POST',
		url: '/mcp/functions',
		data: {
			name: 'HTTP Request',
			parameters: {
				url: 'https://jsonplaceholder.typicode.com/todos/1',
				method: 'GET',
			},
		},
	},
];

async function runTests() {
	console.log('📡 MCP Implementation Test');
	console.log('===========================');

	let passedTests = 0;
	let failedTests = 0;

	for (const [index, test] of TEST_CASES.entries()) {
		console.log(`\n[${index + 1}/${TEST_CASES.length}] Running: ${test.name}`);
		console.log('-'.repeat(test.name.length + 15));

		try {
			let response;
			if (test.method === 'GET') {
				response = await axios.get(`${API_URL}${test.url}`);
			} else if (test.method === 'POST') {
				response = await axios.post(`${API_URL}${test.url}`, test.data);
			}

			if (LOG_ENABLED) {
				console.log('\nRequest:');
				console.log(test.data ? JSON.stringify(test.data, null, 2) : '(no data)');
				console.log('\nResponse:');
				console.log(JSON.stringify(response?.data, null, 2));
			}

			// Check response status
			if (response?.status && response.status >= 200 && response.status < 300) {
				// Check for error in the response data
				if (response.data && response.data.error) {
					console.log(`❌ Test failed: ${response.data.error}`);
					failedTests++;
				} else {
					console.log('✅ Test passed!');
					passedTests++;
				}
			} else {
				console.log(`❌ Test failed with status ${response?.status || 'unknown'}`);
				failedTests++;
			}
		} catch (error: any) {
			console.log(`❌ Test failed with error: ${error.message}`);
			if (error.response && error.response.data) {
				console.log('Response data:');
				console.log(JSON.stringify(error.response.data, null, 2));
			} else if (error.response) {
				console.log('Response status:', error.response.status);
				console.log('Response headers:', error.response.headers);
			}
			failedTests++;
		}
	}

	console.log('\n===========================');
	console.log(`🧪 Test Results: ${passedTests} passed, ${failedTests} failed`);
	console.log('===========================');

	process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((err) => {
	console.error('Error running tests:', err);
	process.exit(1);
});
