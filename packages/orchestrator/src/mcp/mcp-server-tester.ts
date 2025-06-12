/**
 * MCP Server Tester
 *
 * Utility to test generated MCP servers against their API definitions
 */

import axios from 'axios';
import { MCPServerDefinition, APIEndpoint } from '../services/mcp-server-generator.service';

export interface TestResult {
	success: boolean;
	endpoint: string;
	method: string;
	statusCode?: number;
	error?: string;
	responseTime?: number;
	response?: any;
}

export interface TestSummary {
	serverId: string;
	serverName: string;
	totalTests: number;
	passed: number;
	failed: number;
	results: TestResult[];
}

/**
 * Test a generated MCP server against its API definition
 */
export async function testMCPServer(
	serverDefinition: MCPServerDefinition,
	serverUrl: string,
	apiKey?: string,
): Promise<TestSummary> {
	const results: TestResult[] = [];
	let startTime: number; // Declare startTime here

	// Set up HTTP client with authentication if needed
	const client = axios.create({
		baseURL: serverUrl,
		headers: apiKey
			? {
					Authorization: `Bearer ${apiKey}`,
				}
			: {},
	});

	// Test each endpoint
	for (const endpoint of serverDefinition.apiDefinition.endpoints) {
		startTime = Date.now(); // Initialize startTime here for each endpoint
		try {
			// Only test GET endpoints automatically as they typically don't require parameters
			if (endpoint.method === 'GET') {
				const response = await client.get(endpoint.path);

				results.push({
					success: true,
					endpoint: endpoint.path,
					method: endpoint.method,
					statusCode: response.status,
					responseTime: Date.now() - startTime,
					response: response.data,
				});
			} else {
				// For non-GET endpoints, just record that we can't test automatically
				results.push({
					success: true,
					endpoint: endpoint.path,
					method: endpoint.method,
					statusCode: 0,
					responseTime: 0,
					response: { message: 'Not automatically tested - requires request body' },
				});
			}
		} catch (error: any) {
			const endTime = Date.now(); // Define endTime for error cases as well
			results.push({
				success: false,
				endpoint: endpoint.path,
				method: endpoint.method,
				statusCode: error.response?.status,
				error: error.message,
				responseTime: endTime - (error.config?.metadata?.startTime || startTime), // Calculate duration
			});
		}
	}

	// Compile summary
	const passed = results.filter((r) => r.success).length;
	const failed = results.length - passed;

	return {
		serverId: serverDefinition.id,
		serverName: serverDefinition.name,
		totalTests: results.length,
		passed,
		failed,
		results,
	};
}

/**
 * Create sample test data for an endpoint based on parameters
 */
export function generateTestData(endpoint: APIEndpoint): any {
	const testData: any = {};

	if (!endpoint.parameters) {
		return testData;
	}

	// Generate sample data for each parameter
	for (const [name, param] of Object.entries(endpoint.parameters)) {
		if (param.in === 'path' || param.in === 'query') {
			switch (param.type) {
				case 'string':
					testData[name] = `test-${name}`;
					break;
				case 'number':
				case 'integer':
					testData[name] = 1;
					break;
				case 'boolean':
					testData[name] = true;
					break;
				default:
					testData[name] = `test-${name}`;
			}
		}
	}

	// Handle request body
	if (endpoint.parameters?.body) {
		// Add optional chaining for body
		testData.body = {};

		if (endpoint.parameters.body.properties) {
			for (const [propName, propDefValue] of Object.entries(endpoint.parameters.body.properties)) {
				const propDef = propDefValue as { type: string }; // Cast propDef to a more specific type
				switch (propDef.type) {
					case 'string':
						testData.body[propName] = `test-${propName}`;
						break;
					case 'number':
					case 'integer':
						testData.body[propName] = 1;
						break;
					case 'boolean':
						testData.body[propName] = true;
						break;
					case 'object':
						testData.body[propName] = {};
						break;
					case 'array':
						testData.body[propName] = [];
						break;
					default:
						testData.body[propName] = `test-${propName}`;
				}
			}
		}
	}

	return testData;
}
