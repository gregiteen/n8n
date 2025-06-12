/**
 * MCP Server Generator Controller
 * Provides REST API endpoints for MCP server generation and management
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { Request, Response } from 'express';
import { MCPServerGeneratorService } from '../services/mcp-server-generator.service';

@Service()
export class MCPServerGeneratorController {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(MCPServerGeneratorService)
		private readonly mcpServerGeneratorService: MCPServerGeneratorService,
	) {
		this.logger = this.logger.scoped('mcp-server-generator-controller');
	}

	/**
	 * Get all MCP server definitions
	 */
	async getAllServers(req: Request, res: Response): Promise<void> {
		try {
			const serverDefinitions = this.mcpServerGeneratorService.getAllServerDefinitions();

			res.json({
				count: serverDefinitions.length,
				servers: serverDefinitions,
			});
		} catch (error: any) {
			this.logger.error('Error getting MCP server definitions:', error);
			res.status(500).json({ error: error.message || 'Failed to get MCP server definitions' });
		}
	}

	/**
	 * Get a specific MCP server definition
	 */
	async getServer(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const serverDefinition = this.mcpServerGeneratorService.getServerDefinition(id);

			if (!serverDefinition) {
				res.status(404).json({ error: `MCP server definition '${id}' not found` });
				return;
			}

			res.json(serverDefinition);
		} catch (error: any) {
			this.logger.error(`Error getting MCP server definition ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to get MCP server definition' });
		}
	}

	/**
	 * Create a new MCP server definition
	 */
	async createServer(req: Request, res: Response): Promise<void> {
		try {
			const { name, description, apiDefinition } = req.body;

			if (!name || !apiDefinition) {
				res.status(400).json({
					error: 'Invalid MCP server definition. Must include name and apiDefinition.',
				});
				return;
			}

			const serverDefinition = {
				id: `server-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
				name,
				description: description || `MCP server for ${name}`,
				apiDefinition,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			this.mcpServerGeneratorService.saveServerDefinition(serverDefinition);

			res.status(201).json(serverDefinition);
		} catch (error: any) {
			this.logger.error('Error creating MCP server definition:', error);
			res.status(500).json({ error: error.message || 'Failed to create MCP server definition' });
		}
	}

	/**
	 * Update an existing MCP server definition
	 */
	async updateServer(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { name, description, apiDefinition } = req.body;

			// Check if server definition exists
			const existingDefinition = this.mcpServerGeneratorService.getServerDefinition(id);
			if (!existingDefinition) {
				res.status(404).json({ error: `MCP server definition '${id}' not found` });
				return;
			}

			// Update the definition
			const updatedDefinition = {
				...existingDefinition,
				name: name || existingDefinition.name,
				description: description || existingDefinition.description,
				apiDefinition: apiDefinition || existingDefinition.apiDefinition,
				updatedAt: new Date(),
			};

			this.mcpServerGeneratorService.saveServerDefinition(updatedDefinition);

			res.json(updatedDefinition);
		} catch (error: any) {
			this.logger.error(`Error updating MCP server definition ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to update MCP server definition' });
		}
	}

	/**
	 * Delete an MCP server definition
	 */
	async deleteServer(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const result = this.mcpServerGeneratorService.deleteServerDefinition(id);

			if (!result) {
				res.status(404).json({ error: `MCP server definition '${id}' not found` });
				return;
			}

			res.status(204).end();
		} catch (error: any) {
			this.logger.error(`Error deleting MCP server definition ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to delete MCP server definition' });
		}
	}

	/**
	 * Generate server code
	 */
	async generateServerCode(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const serverDefinition = this.mcpServerGeneratorService.getServerDefinition(id);
			if (!serverDefinition) {
				res.status(404).json({ error: `MCP server definition '${id}' not found` });
				return;
			}

			const code = this.mcpServerGeneratorService.generateMCPServerCode(serverDefinition);

			res.json({
				id,
				name: serverDefinition.name,
				code,
			});
		} catch (error: any) {
			this.logger.error(`Error generating server code for ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to generate server code' });
		}
	}

	/**
	 * Start an MCP server
	 */
	async startServer(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const result = await this.mcpServerGeneratorService.startMCPServer(id);

			res.json({
				id,
				status: 'running',
				port: result.port,
				url: result.url,
			});
		} catch (error: any) {
			this.logger.error(`Error starting MCP server ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to start MCP server' });
		}
	}

	/**
	 * Stop an MCP server
	 */
	async stopServer(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const result = this.mcpServerGeneratorService.stopMCPServer(id);

			if (!result) {
				res.status(404).json({ error: `MCP server '${id}' not running` });
				return;
			}

			res.json({
				id,
				status: 'stopped',
			});
		} catch (error: any) {
			this.logger.error(`Error stopping MCP server ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to stop MCP server' });
		}
	}

	/**
	 * Get all running MCP servers
	 */
	async getRunningServers(req: Request, res: Response): Promise<void> {
		try {
			const runningServers = this.mcpServerGeneratorService.getRunningServers();

			res.json({
				count: runningServers.length,
				servers: runningServers,
			});
		} catch (error: any) {
			this.logger.error('Error getting running MCP servers:', error);
			res.status(500).json({ error: error.message || 'Failed to get running MCP servers' });
		}
	}

	/**
	 * Generate MCP server from OpenAPI spec
	 */
	async generateFromOpenAPI(req: Request, res: Response): Promise<void> {
		try {
			const { url } = req.body;

			if (!url) {
				res.status(400).json({ error: 'OpenAPI spec URL is required' });
				return;
			}

			const serverDefinition = await this.mcpServerGeneratorService.generateFromOpenAPI(url);

			res.status(201).json(serverDefinition);
		} catch (error: any) {
			this.logger.error('Error generating from OpenAPI spec:', error);
			res.status(500).json({ error: error.message || 'Failed to generate from OpenAPI spec' });
		}
	}
}
