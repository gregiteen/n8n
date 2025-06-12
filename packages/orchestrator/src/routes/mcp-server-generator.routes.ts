/**
 * MCP Server Generator Routes
 * API routes for MCP server generation and management
 */

import { Express, Request, Response } from 'express';
import { getService } from '../services';
import { MCPServerGeneratorController } from '../controllers/mcp-server-generator.controller';

/**
 * Configure MCP server generator routes
 */
export function configureMCPServerGeneratorRoutes(app: Express): void {
	// Get the MCP server generator controller
	const mcpServerGeneratorController = getService(MCPServerGeneratorController);

	// Get all MCP server definitions
	app.get('/api/mcp-servers', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.getAllServers(req, res);
	});

	// Get a specific MCP server definition by ID
	app.get('/api/mcp-servers/:id', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.getServer(req, res);
	});

	// Create a new MCP server definition
	app.post('/api/mcp-servers', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.createServer(req, res);
	});

	// Update an existing MCP server definition
	app.put('/api/mcp-servers/:id', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.updateServer(req, res);
	});

	// Delete a MCP server definition
	app.delete('/api/mcp-servers/:id', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.deleteServer(req, res);
	});

	// Start a MCP server
	app.post('/api/mcp-servers/:id/start', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.startServer(req, res);
	});

	// Stop a running MCP server
	app.post('/api/mcp-servers/:id/stop', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.stopServer(req, res);
	});

	// Generate server code
	app.get('/api/mcp-servers/:id/code', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.generateServerCode(req, res);
	});

	// Generate server from OpenAPI spec
	app.post('/api/mcp-servers/generate-from-openapi', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.generateFromOpenAPI(req, res);
	});

	// Get all running MCP servers
	app.get('/api/mcp-servers/running', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.getRunningServers(req, res);
	});

	// Get MCP server status - THIS ROUTE IS DUPLICATED AND THE CONTROLLER METHOD DOES NOT EXIST
	// app.get('/api/mcp-servers/:id/status', async (req: Request, res: Response) => {
	//   await mcpServerGeneratorController.getServerStatus(req, res);
	// });

	// Generate a new MCP server from OpenAPI spec
	app.post('/api/mcp-servers/generate-from-openapi', async (req: Request, res: Response) => {
		await mcpServerGeneratorController.generateFromOpenAPI(req, res);
	});
}
