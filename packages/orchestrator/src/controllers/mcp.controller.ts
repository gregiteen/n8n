/**
 * MCP Controller
 * REST API controller for Model Context Protocol (MCP) endpoints
 */

import { Service, Inject } from '../di';
import { Request, Response } from 'express';
import { Logger } from '../logger';
import { MCPService, MCPRequest } from '../mcp/mcp.service';
import { MCPNodeWrapper } from '../mcp/mcp-node-wrapper';
import { NodeDiscoveryService } from '../mcp/node-discovery.service';

@Service()
export class MCPController {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(MCPService) private readonly mcpService: MCPService,
		@Inject(MCPNodeWrapper) private readonly mcpNodeWrapper: MCPNodeWrapper,
		@Inject(NodeDiscoveryService) private readonly nodeDiscoveryService: NodeDiscoveryService,
	) {
		this.logger = this.logger.scoped('mcp-controller');
	}

	/**
	 * Get the MCP server schema
	 */
	async getSchema(req: Request, res: Response): Promise<void> {
		try {
			// Get the server URL from the request
			const protocol = req.headers['x-forwarded-proto'] || req.protocol;
			const host = req.headers['x-forwarded-host'] || req.headers.host;
			const basePath = `${protocol}://${host}`;
			const serverPath = `${basePath}/mcp`;

			// Get the schema
			const schema = this.mcpService.getServerSchema(serverPath);

			res.json(schema);
		} catch (error: any) {
			this.logger.error('Error getting MCP schema:', error);
			res.status(500).json({ error: error.message || 'Failed to get MCP schema' });
		}
	}

	/**
	 * Get all available tools
	 */
	async getTools(req: Request, res: Response): Promise<void> {
		try {
			const tools = this.mcpNodeWrapper.getAllTools();

			// Optional category filtering
			const category = req.query.category as string;
			const filteredTools = category
				? tools.filter((tool) =>
						tool.schema.description?.toLowerCase().includes(category.toLowerCase()),
					)
				: tools;

			res.json({
				count: filteredTools.length,
				tools: filteredTools.map((tool) => ({
					name: tool.schema.name,
					description: tool.schema.description,
					nodeName: tool.nodeName,
					parameters: Object.keys(tool.schema.parameters || {}),
				})),
			});
		} catch (error: any) {
			this.logger.error('Error getting tools:', error);
			res.status(500).json({ error: error.message || 'Failed to get tools' });
		}
	}

	/**
	 * Get a specific tool by name
	 */
	async getToolByName(req: Request, res: Response): Promise<void> {
		try {
			const { name } = req.params;
			const tool = this.mcpNodeWrapper.getTool(name);

			if (!tool) {
				res.status(404).json({ error: `Tool '${name}' not found` });
				return;
			}

			res.json({
				name: tool.schema.name,
				description: tool.schema.description,
				parameters: tool.schema.parameters,
				nodeName: tool.nodeName,
			});
		} catch (error: any) {
			this.logger.error(`Error getting tool ${req.params.name}:`, error);
			res.status(500).json({ error: error.message || 'Failed to get tool' });
		}
	}

	/**
	 * Handle an MCP request
	 */
	async handleRequest(req: Request, res: Response): Promise<void> {
		const requestId = Math.random().toString(36).substring(2, 15);
		const startTime = Date.now();

		try {
			this.logger.info(`[${requestId}] Processing MCP request from ${req.ip}`);

			const clientIp = req.ip;
			// Apply basic rate limiting
			// In a production environment, use a proper rate limiter like express-rate-limit
			if (clientIp && !this.canProcessRequest(clientIp)) {
				this.logger.warn(`[${requestId}] Rate limit exceeded for ${clientIp}`);
				res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
				return;
			}

			// Validate the request
			if (!req.body?.name) {
				res.status(400).json({ error: 'Invalid MCP request. Must include "name" property.' });
				return;
			}

			// Ensure parameters is an object (defaults to empty object)
			const parameters =
				typeof req.body.parameters === 'object' && req.body.parameters !== null
					? req.body.parameters
					: {};

			// Handle different request formats based on the endpoint
			let mcpRequest: MCPRequest;

			if (req.path.includes('/anthropic')) {
				// Anthropic-compatible endpoint
				mcpRequest = {
					name: req.body.name,
					parameters: parameters,
				};
			} else if (req.path.includes('/functions')) {
				// OpenAI-compatible endpoint
				mcpRequest = {
					name: req.body.name,
					parameters: parameters,
				};
			} else {
				// Standard MCP endpoint
				mcpRequest = {
					name: req.body.name,
					parameters: parameters,
				};
			}

			this.logger.debug(`[${requestId}] Executing tool "${mcpRequest.name}"`);

			// Handle the MCP request
			const response = await this.mcpService.handleMCPRequest(mcpRequest);

			// Return the response with appropriate format for the endpoint
			if (response.error) {
				this.logger.warn(`[${requestId}] Error executing tool: ${response.error}`);

				if (req.path.includes('/anthropic')) {
					res.status(400).json({ error: { message: response.error } });
				} else {
					res.status(400).json({ error: response.error });
				}
			} else {
				const executionTime = Date.now() - startTime;
				this.logger.info(`[${requestId}] Successfully executed tool in ${executionTime}ms`);

				if (req.path.includes('/anthropic')) {
					// Format for Anthropic
					res.json({
						type: 'tool_result',
						content: response.content,
						tool_name: mcpRequest.name,
					});
				} else if (req.path.includes('/functions')) {
					// Format for OpenAI
					res.json({
						role: 'function',
						name: mcpRequest.name,
						content: response.content,
					});
				} else {
					// Standard MCP format
					res.json({ content: response.content });
				}
			}
		} catch (error: any) {
			const executionTime = Date.now() - startTime;
			this.logger.error(`[${requestId}] Error handling MCP request (${executionTime}ms):`, error);

			// Return appropriate error format
			if (req.path.includes('/anthropic')) {
				res.status(500).json({
					error: { message: error.message || 'Internal server error' },
				});
			} else {
				res.status(500).json({
					error: error.message || 'Failed to handle MCP request',
				});
			}
		}
	}

	// Simple in-memory rate limiting
	private ipRequestCounts: Map<string, { count: number; timestamp: number }> = new Map();
	private MAX_REQUESTS_PER_MINUTE = 60;

	private canProcessRequest(ip: string): boolean {
		const now = Date.now();
		const minute = 60 * 1000;

		// Clean up old entries
		if (now % 10000 < 100) {
			// Occasionally clean up old entries
			for (const [storedIp, data] of this.ipRequestCounts.entries()) {
				if (now - data.timestamp > minute) {
					this.ipRequestCounts.delete(storedIp);
				}
			}
		}

		// Get or create the request count for this IP
		const data = this.ipRequestCounts.get(ip) || { count: 0, timestamp: now };

		// Reset if outside the window
		if (now - data.timestamp > minute) {
			data.count = 0;
			data.timestamp = now;
		}

		// Increment and check
		data.count++;
		this.ipRequestCounts.set(ip, data);

		return data.count <= this.MAX_REQUESTS_PER_MINUTE;
	}
}
