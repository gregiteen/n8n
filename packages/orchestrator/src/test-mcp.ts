/**
 * Test script for MCP implementation
 */
import 'reflect-metadata';
import { initializeAllServices, getService } from './services';
import { MCPService, MCPRequest } from './mcp/mcp.service';
import { MCPNodeWrapper } from './mcp/mcp-node-wrapper';
import { Logger } from './logger';

// Initialize DI services
initializeAllServices();

// Get service instances
const logger = getService(Logger);
const mcpService = getService(MCPService);
const mcpNodeWrapper = getService(MCPNodeWrapper);

logger.info('Starting MCP test');

async function runTest() {
	try {
		// Initialize MCP service
		await mcpService.initialize();

		// Display available tools
		const tools = mcpNodeWrapper.getAllTools();
		logger.info(`Available MCP tools: ${tools.length}`);

		tools.forEach((tool, index) => {
			logger.info(`Tool ${index + 1}: ${tool.schema.name} - ${tool.schema.description}`);
		});

		// Test HTTP Request tool
		logger.info('Testing HTTP Request tool...');
		const httpRequest: MCPRequest = {
			name: 'HTTP Request',
			parameters: {
				url: 'https://jsonplaceholder.typicode.com/todos/1',
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			},
		};

		const httpResult = await mcpService.handleMCPRequest(httpRequest);
		logger.info('HTTP Request result:', httpResult);

		// Test Data Transformation tool
		logger.info('Testing Transform Data tool...');
		const transformRequest: MCPRequest = {
			name: 'Transform Data',
			parameters: {
				data: {
					name: 'John Doe',
					email: 'john@example.com',
				},
				operations: [
					{
						operation: 'add',
						field: 'status',
						value: 'active',
					},
					{
						operation: 'remove',
						field: 'email',
					},
				],
			},
		};

		const transformResult = await mcpService.handleMCPRequest(transformRequest);
		logger.info('Transform Data result:', transformResult);

		// Get MCP server schema
		const schema = mcpService.getServerSchema('http://localhost:3000/mcp');
		logger.info('MCP server schema:', schema);

		logger.info('MCP test completed successfully');
	} catch (error: any) {
		logger.error('Error in MCP test:', { error: error.message, stack: error.stack });
	}
}

// Run the test
runTest().catch((error: any) => {
	logger.error('Unhandled error in test:', { error: error.message, stack: error.stack });
	process.exit(1);
});
