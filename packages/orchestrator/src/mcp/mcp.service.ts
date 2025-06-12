/**
 * MCP Service
 * Handles Model Context Protocol (MCP) requests and responses
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { MCPNodeWrapper, MCPToolSchema, MCPToolResult } from './mcp-node-wrapper';
import { NodeDiscoveryService } from './node-discovery.service';
import axios from 'axios';
import { z } from 'zod';

/**
 * MCP request format
 */
export interface MCPRequest {
	name: string;
	parameters: Record<string, any>;
}

/**
 * MCP response format
 */
export interface MCPResponse {
	content?: string;
	error?: string;
}

/**
 * MCP server schema
 */
export interface MCPServerSchema {
	schema_version: string;
	server_path: string;
	name: string;
	description: string;
	auth_mode: 'none' | 'bearer';
	tools: MCPToolSchema[];
}

// Request validation schema using Zod
const mcpRequestSchema = z.object({
	name: z.string().min(1, 'Tool name is required'),
	parameters: z.record(z.any()),
});

/**
 * Service to handle MCP requests
 */
@Service()
export class MCPService {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(MCPNodeWrapper) private readonly mcpNodeWrapper: MCPNodeWrapper,
		@Inject(NodeDiscoveryService) private readonly nodeDiscoveryService: NodeDiscoveryService,
	) {
		this.logger = this.logger.scoped('mcp-service');
	}

	/**
	 * Initialize the MCP service with default tools
	 */
	async initialize(): Promise<void> {
		this.logger.info('Initializing MCP service');

		// Register default tools - immediate availability
		this.registerDefaultTools();

		// Discover and register n8n nodes
		await this.nodeDiscoveryService.initialize();
	}

	/**
	 * Register default MCP tools
	 */
	private registerDefaultTools(): void {
		// Example: HTTP Request tool
		this.mcpNodeWrapper.registerNodeAsTool(
			'n8n-nodes-base.httpRequest',
			'HTTP Request',
			'Make an HTTP request to any URL',
			{
				url: {
					name: 'url',
					type: 'string',
					description: 'The URL to make the request to',
					required: true,
				},
				method: {
					name: 'method',
					type: 'string',
					description: 'The HTTP method to use',
					default: 'GET',
					enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
				},
				headers: {
					name: 'headers',
					type: 'object',
					description: 'HTTP headers to include in the request',
					properties: {},
				},
				body: {
					name: 'body',
					type: 'string',
					description: 'Body content for POST/PUT requests',
				},
			},
			async (parameters: Record<string, any>) => {
				try {
					const { url, method = 'GET', headers = {}, body } = parameters;

					const response = await axios({
						url,
						method,
						headers,
						data: body,
					});

					return {
						result: {
							status: response.status,
							headers: response.headers,
							data: response.data,
						},
					};
				} catch (error: any) {
					return {
						result: null,
						error: error.message,
					};
				}
			},
		);

		// Example: Data Transformation tool
		this.mcpNodeWrapper.registerNodeAsTool(
			'n8n-nodes-base.set',
			'Transform Data',
			'Transform and manipulate data',
			{
				data: {
					name: 'data',
					type: 'object',
					description: 'The data to transform',
					required: true,
				},
				operations: {
					name: 'operations',
					type: 'array',
					description: 'Operations to perform on the data',
					items: {
						name: 'item',
						type: 'object',
						properties: {
							operation: {
								name: 'operation',
								type: 'string',
								enum: ['add', 'remove', 'transform'],
							},
							field: {
								name: 'field',
								type: 'string',
							},
							value: {
								name: 'value',
								type: 'string',
							},
						},
					},
				},
			},
			async (parameters: Record<string, any>) => {
				try {
					const { data, operations = [] } = parameters;
					let result = { ...data };

					for (const op of operations) {
						if (op.operation === 'add') {
							result[op.field] = op.value;
						} else if (op.operation === 'remove') {
							delete result[op.field];
						} else if (op.operation === 'transform' && op.field in result) {
							// Simple transformation (in reality, this would be more sophisticated)
							result[op.field] = op.value.replace('{{value}}', result[op.field]);
						}
					}

					return { result };
				} catch (error: any) {
					return {
						result: null,
						error: error.message,
					};
				}
			},
		);
	}

	/**
	 * Handle an MCP request
	 * @param request The MCP request to handle
	 */
	async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
		try {
			this.logger.debug('Handling MCP request:', request);

			// Validate the request format
			try {
				mcpRequestSchema.parse(request);
			} catch (validationError: any) {
				this.logger.warn('MCP request validation failed:', validationError);
				return {
					error: `Invalid MCP request: ${validationError.message}`,
				};
			}

			const { name, parameters } = request;

			// Check if the tool exists
			const tool = this.mcpNodeWrapper.getTool(name);
			if (!tool) {
				const availableTools = this.mcpNodeWrapper
					.getAllTools()
					.map((t) => t.schema.name)
					.slice(0, 10) // Limit to first 10 tools to prevent excessive response size
					.join(', ');

				this.logger.warn(
					`Tool '${name}' not found. Available tools: ${availableTools}${this.mcpNodeWrapper.getAllTools().length > 10 ? '...' : ''}`,
				);

				return {
					error: `Tool '${name}' not found. Available tools: ${availableTools}${this.mcpNodeWrapper.getAllTools().length > 10 ? ' and more...' : ''}`,
				};
			}

			// Validate parameters against tool schema if applicable
			if (tool.schema.parameters) {
				const parameterErrors = this.validateParameters(parameters, tool.schema.parameters);
				if (parameterErrors.length > 0) {
					const errorMessage = `Invalid parameters: ${parameterErrors.join(', ')}`;
					this.logger.warn(errorMessage);
					return { error: errorMessage };
				}
			}

			// Execute the tool with timeout protection
			const timeoutMs = 30000; // 30 seconds timeout
			let timeoutId: NodeJS.Timeout;

			const timeoutPromise = new Promise<MCPToolResult>((_, reject) => {
				timeoutId = setTimeout(() => {
					reject(
						new Error(`Execution of tool '${name}' timed out after ${timeoutMs / 1000} seconds`),
					);
				}, timeoutMs);
			});

			try {
				// Race between tool execution and timeout
				const result = await Promise.race([
					this.mcpNodeWrapper.executeTool(name, parameters),
					timeoutPromise,
				]);

				clearTimeout(timeoutId!);

				if (result.error) {
					this.logger.warn(`Tool '${name}' execution failed:`, { error: result.error });
					return { error: result.error };
				}

				// Format the response with proper JSON handling
				try {
					return {
						content:
							typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
					};
				} catch (jsonError: any) {
					this.logger.error(`Error stringifying result from tool '${name}':`, jsonError);
					return {
						error: `Error formatting tool result: ${jsonError.message}`,
						content: `${result.result}`, // Force string conversion
					};
				}
			} catch (executionError: any) {
				clearTimeout(timeoutId!);
				throw executionError;
			}
		} catch (error: any) {
			this.logger.error('Error handling MCP request:', error);
			return {
				error: error.message || 'Failed to handle MCP request',
			};
		}
	}

	/**
	 * Validate parameters against schema
	 * @param parameters The parameters to validate
	 * @param schema The parameter schema to validate against
	 */
	private validateParameters(
		parameters: Record<string, any>,
		schema: Record<string, any>,
	): string[] {
		const errors: string[] = [];

		// Check for required parameters
		Object.entries(schema).forEach(([key, def]) => {
			if (def.required && (parameters[key] === undefined || parameters[key] === null)) {
				errors.push(`Missing required parameter: ${key}`);
			}
		});

		// Could add more validation here for parameter types, etc.

		return errors;
	}

	/**
	 * Get the MCP server schema
	 * @param serverPath The path where the MCP server is hosted
	 */
	getServerSchema(serverPath: string): MCPServerSchema {
		return {
			schema_version: '1.0',
			server_path: serverPath,
			name: 'n8n MCP Server',
			description: 'MCP server for n8n nodes',
			auth_mode: 'none',
			tools: this.mcpNodeWrapper.getToolSchemas(),
		};
	}
}
