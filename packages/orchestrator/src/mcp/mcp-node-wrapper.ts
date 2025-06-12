/**
 * MCP Node Wrapper
 * Provides Model Context Protocol (MCP) support for n8n nodes
 *
 * This wrapper converts n8n nodes into MCP-compatible tools that can be
 * discovered and used by AI models through the standardized MCP interface.
 *
 * Features:
 * - Automatic schema generation from n8n node metadata
 * - Parameter validation and transformation
 * - Execution of n8n nodes via workflows
 * - Error handling and result formatting
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import { MCPTool, MCPToolExecutorFn } from './types';

/**
 * Schema for MCP tool parameter
 */
export interface MCPParameterSchema {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	description?: string;
	required?: boolean;
	default?: any;
	enum?: any[];
	items?: MCPParameterSchema; // For array types
	properties?: Record<string, MCPParameterSchema>; // For object types
}

/**
 * Schema for MCP tool
 */
export interface MCPToolSchema {
	name: string;
	description: string;
	parameters?: Record<string, MCPParameterSchema>;
}

/**
 * MCP tool execution result
 */
export interface MCPToolResult {
	result: any;
	error?: string;
}

/**
 * Service for wrapping n8n nodes as MCP tools
 */
@Service()
export class MCPNodeWrapper {
	private tools: Map<string, MCPTool> = new Map();

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(WorkflowExecutionService)
		private readonly workflowExecutionService: WorkflowExecutionService,
	) {
		this.logger = this.logger.scoped('mcp-node-wrapper');

		// Load available node types
		this.loadNodeTypes();
	}

	/**
	 * Load available node types from n8n
	 */
	private async loadNodeTypes(): Promise<void> {
		try {
			// In a real implementation, this would load from n8n API
			// For now, we'll just register a few common nodes manually
			this.registerCommonNodes();

			this.logger.info('Node types loaded successfully');
		} catch (error: any) {
			this.logger.error('Failed to load node types', { error });
		}
	}

	/**
	 * Register common n8n nodes as MCP tools
	 */
	private registerCommonNodes(): void {
		// HTTP Request node
		this.registerNodeAsTool(
			'n8n-nodes-base.httpRequest',
			'HTTPRequest',
			'Make an HTTP request to a URL',
			{
				url: {
					name: 'url',
					type: 'string',
					description: 'The URL to request',
					required: true,
				},
				method: {
					name: 'method',
					type: 'string',
					description: 'The HTTP method to use',
					required: false,
					default: 'GET',
					enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
				},
				headers: {
					name: 'headers',
					type: 'object',
					description: 'HTTP headers to include',
					required: false,
				},
				body: {
					name: 'body',
					type: 'object',
					description: 'Body of the request for POST/PUT/PATCH',
					required: false,
				},
			},
			async (params: Record<string, any>) => {
				// Execute via a workflow that uses the HTTP Request node
				// This requires WorkflowExecutionService to be fully implemented
				// and a workflow named \'http-request-workflow\' to exist.
				this.logger.info('Executing HTTPRequest tool via WorkflowExecutionService', { params });
				try {
					const result = await this.workflowExecutionService.executeWorkflow(
						'http-request-workflow', // This would be a pre-created workflow ID
						{ httpRequestParams: params }, // Pass params in a way the workflow can consume them
						{ waitForCompletion: true },
					);

					if (result.status === 'error') {
						this.logger.error('HTTP request workflow execution failed', {
							error: result.error,
							params,
						});
						throw new Error(result.error?.message || 'HTTP request workflow failed');
					}
					this.logger.info('HTTP request workflow execution successful', {
						resultData: result.data,
					});
					return { result: result.data }; // Ensure result is wrapped in MCPToolResult structure
				} catch (error: any) {
					this.logger.error('Error during HTTPRequest tool execution:', {
						error: error.message,
						params,
					});
					return { result: null, error: error.message || 'Failed to execute HTTPRequest tool' };
				}
			},
		);

		// CSV node
		this.registerNodeAsTool(
			'n8n-nodes-base.spreadsheetFile',
			'ParseCSV',
			'Parse a CSV string into structured data',
			{
				data: {
					name: 'data',
					type: 'string',
					description: 'The CSV data to parse',
					required: true,
				},
				options: {
					name: 'options',
					type: 'object',
					description: 'CSV parsing options',
					required: false,
					properties: {
						delimiter: {
							name: 'delimiter',
							type: 'string',
							description: 'The delimiter character',
							default: ',',
						},
						hasHeader: {
							name: 'hasHeader',
							type: 'boolean',
							description: 'Whether the CSV has a header row',
							default: true,
						},
					},
				},
			},
			async (params: Record<string, any>) => {
				// In a real implementation, this would execute a workflow
				// For now, we'll simulate CSV parsing
				const { data, options = {} } = params;
				const delimiter = options.delimiter || ',';
				const hasHeader = options.hasHeader !== false;

				const rows = data.split('\n').filter((row: string) => row.trim() !== '');
				if (rows.length === 0) {
					return { result: { data: [] } }; // Ensure result is wrapped
				}

				if (hasHeader) {
					const headers = rows[0].split(delimiter);
					const result = rows.slice(1).map((row: string) => {
						const values = row.split(delimiter);
						const rowObj: Record<string, string> = {};
						headers.forEach((header: string, index: number) => {
							rowObj[header] = values[index] || '';
						});
						return rowObj;
					});
					return { result: { data: result } }; // Ensure result is wrapped
				} else {
					const resultData = rows.map((row: string) => row.split(delimiter));
					return { result: { data: resultData } }; // Ensure result is wrapped
				}
			},
		);
	}

	/**
	 * Register a node as an MCP tool
	 * @param nodeName The name of the n8n node
	 * @param toolName The name of the MCP tool
	 * @param description The description of the tool
	 * @param parameters The parameters for the tool
	 * @param executor The function that executes the tool
	 */
	public registerNodeAsTool(
		nodeName: string,
		toolName: string,
		description: string,
		parameters: Record<string, MCPParameterSchema>,
		executor: MCPToolExecutorFn,
	): void {
		const toolKey = toolName.toLowerCase().replace(/\s+/g, '-');

		if (this.tools.has(toolKey)) {
			throw new Error(`Tool with name '${toolName}' already exists`);
		}

		const tool: MCPTool = {
			schema: {
				name: toolName,
				description,
				parameters,
			},
			executor,
			nodeName,
		};

		this.tools.set(toolKey, tool);
		this.logger.debug(`Registered node '${nodeName}' as MCP tool '${toolName}'`);
	}

	/**
	 * Get all registered MCP tools
	 */
	getAllTools(): MCPTool[] {
		return Array.from(this.tools.values());
	}

	/**
	 * Get an MCP tool by name
	 * @param toolName The name of the tool to get
	 */
	getTool(toolName: string): MCPTool | undefined {
		const toolKey = toolName.toLowerCase().replace(/\s+/g, '-');
		return this.tools.get(toolKey);
	}

	/**
	 * Execute an MCP tool
	 * @param toolName The name of the tool to execute
	 * @param parameters The parameters to pass to the tool
	 */
	async executeTool(toolName: string, parameters: Record<string, any>): Promise<MCPToolResult> {
		const tool = this.getTool(toolName);

		if (!tool) {
			this.logger.warn(`Tool '${toolName}' not found during execution.`);
			return {
				result: null,
				error: `Tool '${toolName}' not found`,
			};
		}

		try {
			this.logger.debug(`Executing tool '${toolName}' with parameters:`, parameters);
			const executionResult = await tool.executor(parameters);
			// Ensure the executor's return value is an MCPToolResult
			if (
				typeof executionResult === 'object' &&
				executionResult !== null &&
				('result' in executionResult || 'error' in executionResult)
			) {
				return executionResult as MCPToolResult;
			}
			// If executor returns raw data, wrap it
			this.logger.warn(
				`Tool '${toolName}' executor did not return a standard MCPToolResult. Wrapping response.`,
			);
			return { result: executionResult, error: undefined };
		} catch (error: any) {
			this.logger.error(`Error executing tool '${toolName}':`, {
				errorMessage: error.message,
				toolName,
				parameters,
			});
			return {
				result: null,
				error: error.message || `Failed to execute tool '${toolName}'`,
			};
		}
	}

	/**
	 * Get MCP schemas for all registered tools
	 */
	getToolSchemas(): MCPToolSchema[] {
		return Array.from(this.tools.values()).map((tool) => tool.schema);
	}

	/**
	 * Remove a tool registration
	 * @param toolName The name of the tool to remove
	 */
	unregisterTool(toolName: string): boolean {
		const toolKey = toolName.toLowerCase().replace(/\s+/g, '-');
		return this.tools.delete(toolKey);
	}
}
