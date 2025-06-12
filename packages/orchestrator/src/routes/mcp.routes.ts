/**
 * MCP Routes
 * API routes for Model Context Protocol (MCP) endpoints
 */

import { Express, Request, Response } from 'express';
import { getService } from '../services';
import { MCPController } from '../controllers/mcp.controller';

/**
 * Configure MCP routes
 */
export function configureMCPRoutes(app: Express): void {
	// Get the MCP controller
	const mcpController = getService(MCPController);

	// MCP API endpoint to get server schema
	app.get('/mcp/schema', async (req: Request, res: Response) => {
		await mcpController.getSchema(req, res);
	});

	// Get all available tools
	app.get('/mcp/tools', async (req: Request, res: Response) => {
		await mcpController.getTools(req, res);
	});

	// Get a specific tool by name
	app.get('/mcp/tools/:name', async (req: Request, res: Response) => {
		await mcpController.getToolByName(req, res);
	});

	// MCP API endpoint to handle requests
	app.post('/mcp/run', async (req: Request, res: Response) => {
		await mcpController.handleRequest(req, res);
	});

	// OpenAI-compatible function calling endpoint for AI providers that don't natively support MCP
	app.post('/mcp/functions', async (req: Request, res: Response) => {
		await mcpController.handleRequest(req, res);
	});

	// Anthropic-compatible MCP endpoint
	app.post('/mcp/anthropic', async (req: Request, res: Response) => {
		await mcpController.handleRequest(req, res);
	});
}
