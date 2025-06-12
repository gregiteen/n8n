/**
 * Model Context Protocol (MCP) Service
 *
 * Implements the Model Context Protocol for standardized tool integration with AI models.
 * This service handles:
 * - MCP request parsing and validation
 * - Tool registration and discovery
 * - Tool execution via n8n nodes
 * - Response formatting according to MCP specs
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { WorkflowExecutionService } from './workflow-execution.service';
import axios from 'axios';

/**
 * Interface for tool parameter
 */
export interface ToolParameter {
	name: string;
	type: string;
	description: string;
	required: boolean;
	schema?: Record<string, any>;
	enum?: any[];
}

/**
 * Interface for MCP tool definition
 */
export interface McpTool {
	name: string;
	description: string;
	parameters: ToolParameter[];
	workflowId?: string; // Optional ID of n8n workflow to execute
	nodeId?: string; // Optional ID of n8n node to execute
	handler?: (params: Record<string, any>) => Promise<any>; // Optional custom handler function
}

/**
 * Interface for MCP request
 */
export interface McpRequest {
	tools: {
		name: string;
		parameters: Record<string, any>;
	}[];
}

/**
 * Interface for MCP response
 */
export interface McpResponse {
	results: {
		tool: string;
		success: boolean;
		result?: any;
		error?: string;
	}[];
}

/**
 * Service for handling MCP requests
 */
@Service()
export class McpService {
	private tools: Map<string, McpTool> = new Map();

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(WorkflowExecutionService)
		private readonly workflowExecutionService: WorkflowExecutionService,
	) {
		this.logger = this.logger.scoped('mcp-service');

		// Register some default tools
		this.registerDefaultTools();
	}

	/**
	 * Register a new MCP tool
	 * @param tool The tool definition
	 */
	registerTool(tool: McpTool): void {
		if (this.tools.has(tool.name)) {
			this.logger.warn(`Tool with name ${tool.name} already exists, overwriting`);
		}

		this.tools.set(tool.name, tool);
		this.logger.info(`Registered MCP tool: ${tool.name}`);
	}

	/**
	 * Get all registered tools
	 */
	getAllTools(): McpTool[] {
		return Array.from(this.tools.values());
	}

	/**
	 * Get tool by name
	 */
	getTool(name: string): McpTool | undefined {
		return this.tools.get(name);
	}

	/**
	 * Unregister a tool
	 */
	unregisterTool(name: string): boolean {
		if (!this.tools.has(name)) {
			return false;
		}

		this.tools.delete(name);
		this.logger.info(`Unregistered MCP tool: ${name}`);
		return true;
	}

	/**
	 * Execute an MCP request
	 * @param request The MCP request
	 */
	async execute(request: McpRequest): Promise<McpResponse> {
		const response: McpResponse = {
			results: [],
		};

		// Process each tool call in the request
		for (const toolCall of request.tools) {
			const toolName = toolCall.name;
			const parameters = toolCall.parameters;

			// Get the tool
			const tool = this.tools.get(toolName);
			if (!tool) {
				response.results.push({
					tool: toolName,
					success: false,
					error: `Tool ${toolName} not found`,
				});
				continue;
			}

			try {
				// Validate parameters
				this.validateParameters(tool, parameters);

				// Execute the tool
				let result;
				if (tool.workflowId) {
					// Execute via n8n workflow
					const executionResult = await this.workflowExecutionService.executeWorkflow(
						tool.workflowId,
						{ parameters },
						{ waitForCompletion: true },
					);

					if (executionResult.status === 'error') {
						throw new Error(executionResult.error?.message || 'Workflow execution failed');
					}

					result = executionResult.data;
				} else if (tool.handler) {
					// Execute via custom handler
					result = await tool.handler(parameters);
				} else {
					throw new Error('Tool has no execution method defined');
				}

				// Add result to response
				response.results.push({
					tool: toolName,
					success: true,
					result,
				});
			} catch (error: any) {
				this.logger.error(`Error executing tool ${toolName}: ${error.message}`, { error });

				// Add error to response
				response.results.push({
					tool: toolName,
					success: false,
					error: error.message,
				});
			}
		}

		return response;
	}

	/**
	 * Validate parameters for a tool
	 */
	private validateParameters(tool: McpTool, parameters: Record<string, any>): void {
		// Check required parameters
		for (const param of tool.parameters) {
			if (
				param.required &&
				(parameters[param.name] === undefined || parameters[param.name] === null)
			) {
				throw new Error(`Required parameter ${param.name} missing for tool ${tool.name}`);
			}

			// Type validation could be added here
		}
	}

	/**
	 * Register default tools
	 */
	private registerDefaultTools(): void {
		// HTTP Request tool
		this.registerTool({
			name: 'http_request',
			description: 'Make an HTTP request to a URL',
			parameters: [
				{
					name: 'url',
					type: 'string',
					description: 'The URL to request',
					required: true,
				},
				{
					name: 'method',
					type: 'string',
					description: 'The HTTP method to use',
					required: false,
					enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
				},
				{
					name: 'headers',
					type: 'object',
					description: 'HTTP headers to include',
					required: false,
				},
				{
					name: 'body',
					type: 'object',
					description: 'Body of the request for POST/PUT/PATCH',
					required: false,
				},
			],
			handler: async (params) => {
				const { url, method = 'GET', headers = {}, body } = params;

				try {
					const response = await axios({
						url,
						method,
						headers,
						data: body,
					});

					return {
						status: response.status,
						statusText: response.statusText,
						headers: response.headers,
						data: response.data,
					};
				} catch (error: any) {
					if (error.response) {
						throw new Error(
							`HTTP request failed with status ${error.response.status}: ${error.response.statusText}`,
						);
					}
					throw error;
				}
			},
		});

		// Date and time tool
		this.registerTool({
			name: 'get_current_datetime',
			description: 'Get the current date and time',
			parameters: [
				{
					name: 'format',
					type: 'string',
					description: 'Format string for date (e.g., "yyyy-MM-dd")',
					required: false,
				},
				{
					name: 'timezone',
					type: 'string',
					description: 'Timezone to use (e.g., "UTC", "America/New_York")',
					required: false,
				},
			],
			handler: async (params) => {
				const { format, timezone } = params;
				const now = new Date();

				return {
					iso: now.toISOString(),
					unix: Math.floor(now.getTime() / 1000),
					formatted: format
						? formatDate(now, format, timezone)
						: now.toLocaleString(undefined, { timeZone: timezone }),
				};
			},
		});
	}
}

/**
 * Helper function to format a date
 */
function formatDate(date: Date, format: string, timezone?: string): string {
	// Simple date formatter - in a real implementation, use a proper date library
	return date.toLocaleString(undefined, { timeZone: timezone });
}
