import { Agent, AgentOptions, ModelProvider, ToolDefinition } from './agent';
import { BrowserService } from './services/browser.service';
import { ModelSelector, ModelOption } from './models/model-selector';
import { N8nClient } from './services/n8n-client';

export type AgentType =
	| 'conversational'
	| 'web-browsing'
	| 'workflow'
	| 'data-analysis'
	| 'function-calling';

export interface AgentFactoryOptions extends AgentOptions {
	agentType?: AgentType;
	tools?: ToolDefinition[];
}

/**
 * Factory for creating specialized AI agents
 */
export class AgentFactory {
	private static browserService = new BrowserService();
	private static n8nClient = new N8nClient();

	/**
	 * Create an agent of the specified type with appropriate configuration
	 */
	static createAgent(options: AgentFactoryOptions = {}): Agent {
		const { agentType, provider, model, systemPrompt, tools = [] } = options;

		// Create base agent
		const agent = new Agent({
			provider,
			model,
			systemPrompt,
		});

		// Configure agent based on type
		switch (agentType) {
			case 'web-browsing':
				this.configureWebBrowsingAgent(agent, tools);
				break;
			case 'workflow':
				this.configureWorkflowAgent(agent, tools);
				break;
			case 'data-analysis':
				this.configureDataAnalysisAgent(agent, tools);
				break;
			case 'function-calling':
				this.configureFunctionCallingAgent(agent, tools);
				break;
			case 'conversational':
			default:
				// Basic conversational agent needs no special configuration
				break;
		}

		// Add any additional tools
		tools.forEach((tool) => agent.addTool(tool));

		return agent;
	}

	/**
	 * Create an agent with recommended model based on requirements
	 */
	static createAgentWithRecommendedModel(requirements: {
		capabilities?: string[];
		minContextLength?: number;
		maxCost?: number;
		preferredProvider?: ModelProvider;
		agentType?: AgentType;
		systemPrompt?: string;
		tools?: ToolDefinition[];
	}): Agent {
		const {
			capabilities,
			minContextLength,
			maxCost,
			preferredProvider,
			agentType,
			systemPrompt,
			tools,
		} = requirements;

		// Get recommended model
		const recommendedModel = ModelSelector.recommendModel({
			capabilities,
			minContextLength,
			maxCost,
			preferredProvider,
		});

		if (!recommendedModel) {
			throw new Error('No model matching the requirements was found');
		}

		// Create agent with recommended model
		return this.createAgent({
			provider: recommendedModel.provider,
			model: recommendedModel.id,
			agentType,
			systemPrompt,
			tools,
		});
	}

	/**
	 * Configure agent with web browsing capabilities
	 */
	private static configureWebBrowsingAgent(agent: Agent, _tools: ToolDefinition[]): void {
		// Add system prompt for web browsing
		const webBrowsingPrompt =
			'You are an AI assistant with web browsing capabilities. ' +
			'You can search the web, visit web pages, extract information, and navigate between pages. ' +
			'When asked to find information online, always use your web browsing tools ' +
			'instead of relying on your built-in knowledge.';

		// Add system prompt to agent
		agent.addSystemPrompt(webBrowsingPrompt);

		// Configure web browsing tools
		const webTools: ToolDefinition[] = [
			{
				name: 'web_search',
				description: 'Search the web for information',
				parameters: {
					type: 'object',
					properties: {
						query: {
							type: 'string',
							description: 'The search query',
						},
					},
					required: ['query'],
				},
				execute: async (args) => {
					const results = await this.browserService.search(args.query as string);
					return { results };
				},
			},
			{
				name: 'fetch_webpage',
				description: 'Fetch content from a specific URL',
				parameters: {
					type: 'object',
					properties: {
						url: {
							type: 'string',
							description: 'The URL of the webpage to fetch',
						},
					},
					required: ['url'],
				},
				execute: async (args) => {
					const page = await this.browserService.fetchWebPage(args.url as string);
					return { page };
				},
			},
			{
				name: 'navigate_to_link',
				description: 'Navigate to a link on the current webpage',
				parameters: {
					type: 'object',
					properties: {
						pageUrl: {
							type: 'string',
							description: 'The URL of the current webpage',
						},
						linkText: {
							type: 'string',
							description: 'Text or description of the link to click on',
						},
					},
					required: ['pageUrl', 'linkText'],
				},
				execute: async (args) => {
					const page = await this.browserService.navigateToLink(
						args.pageUrl as string,
						args.linkText as string,
					);
					return { page };
				},
			},
		];

		// Add tools to agent
		webTools.forEach((tool) => agent.addTool(tool));
	}

	/**
	 * Configure agent with workflow capabilities
	 */
	private static configureWorkflowAgent(agent: Agent, _tools: ToolDefinition[]): void {
		// Add system prompt for workflow agent
		const workflowSystemPrompt =
			'You are an AI assistant specialized in creating and managing n8n workflows. ' +
			'You can help users build, modify, and optimize automation workflows. ' +
			'When asked to create or modify workflows, always use the workflow tools ' +
			'to interact with the n8n API.';

		// Add system prompt to agent
		agent.addSystemPrompt(workflowSystemPrompt);

		// Configure workflow tools
		const workflowTools: ToolDefinition[] = [
			{
				name: 'list_workflows',
				description: 'Get a list of existing workflows',
				parameters: {
					type: 'object',
					properties: {
						tags: {
							type: 'array',
							items: {
								type: 'string',
							},
							description: 'Optional tags to filter workflows by',
						},
						active: {
							type: 'boolean',
							description: 'Filter by active status',
						},
					},
				},
				execute: async (_args) => {
					// Implementation would call n8n API to list workflows
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						workflows: [
							{ id: 'workflow-1', name: 'Example Workflow 1', active: true },
							{ id: 'workflow-2', name: 'Example Workflow 2', active: false },
						],
					};
				},
			},
			{
				name: 'get_workflow',
				description: 'Get details of a specific workflow by ID',
				parameters: {
					type: 'object',
					properties: {
						workflowId: {
							type: 'string',
							description: 'The ID of the workflow to retrieve',
						},
					},
					required: ['workflowId'],
				},
				execute: async (args) => {
					// Implementation would call n8n API to get workflow details
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						workflow: {
							id: args.workflowId,
							name: 'Example Workflow',
							nodes: [],
							connections: {},
							active: true,
						},
					};
				},
			},
			{
				name: 'create_workflow',
				description: 'Create a new workflow',
				parameters: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: 'The name of the workflow',
						},
						nodes: {
							type: 'array',
							description: 'The nodes in the workflow',
						},
						connections: {
							type: 'object',
							description: 'The connections between nodes',
						},
						active: {
							type: 'boolean',
							description: 'Whether the workflow should be active',
						},
					},
					required: ['name'],
				},
				execute: async (args) => {
					// Implementation would call n8n API to create a workflow
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						workflow: {
							id: 'new-workflow-id',
							name: args.name,
							nodes: args.nodes || [],
							connections: args.connections || {},
							active: args.active || false,
						},
					};
				},
			},
			{
				name: 'update_workflow',
				description: 'Update an existing workflow',
				parameters: {
					type: 'object',
					properties: {
						workflowId: {
							type: 'string',
							description: 'The ID of the workflow to update',
						},
						name: {
							type: 'string',
							description: 'The new name of the workflow',
						},
						nodes: {
							type: 'array',
							description: 'The updated nodes in the workflow',
						},
						connections: {
							type: 'object',
							description: 'The updated connections between nodes',
						},
						active: {
							type: 'boolean',
							description: 'Whether the workflow should be active',
						},
					},
					required: ['workflowId'],
				},
				execute: async (args) => {
					// Implementation would call n8n API to update a workflow
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						workflow: {
							id: args.workflowId,
							name: args.name || 'Updated Workflow',
							nodes: args.nodes || [],
							connections: args.connections || {},
							active: args.active || false,
						},
					};
				},
			},
			{
				name: 'execute_workflow',
				description: 'Execute a workflow by ID',
				parameters: {
					type: 'object',
					properties: {
						workflowId: {
							type: 'string',
							description: 'The ID of the workflow to execute',
						},
						input: {
							type: 'object',
							description: 'Input data for the workflow execution',
						},
					},
					required: ['workflowId'],
				},
				execute: async (args) => {
					// Implementation would call n8n API to execute a workflow
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						executionId: 'execution-id-123',
						message: `Workflow ${args.workflowId} executed successfully`,
					};
				},
			},
		];

		// Add workflow tools to agent
		workflowTools.forEach((tool) => agent.addTool(tool));
	}

	/**
	 * Configure agent with data analysis capabilities
	 */
	private static configureDataAnalysisAgent(agent: Agent, _tools: ToolDefinition[]): void {
		// Add system prompt for data analysis
		const dataAnalysisSystemPrompt =
			'You are an AI assistant specialized in data analysis. ' +
			'You can process, analyze, and visualize data to extract insights. ' +
			'When presented with data, analyze it for trends, patterns, and anomalies. ' +
			'Provide statistical summaries and visualizations when appropriate.';

		// Add system prompt to agent
		agent.addSystemPrompt(dataAnalysisSystemPrompt);

		// Configure data analysis tools
		const dataAnalysisTools: ToolDefinition[] = [
			{
				name: 'analyze_data',
				description: 'Analyze data to extract insights, statistics, and patterns',
				parameters: {
					type: 'object',
					properties: {
						data: {
							type: 'string',
							description: 'The data to analyze in JSON or CSV format',
						},
						dataType: {
							type: 'string',
							description: 'The type of data (e.g., "csv", "json", "table")',
							enum: ['csv', 'json', 'table'],
						},
						analysisType: {
							type: 'string',
							description: 'The type of analysis to perform',
							enum: ['summary', 'correlation', 'trend', 'outliers', 'clustering', 'prediction'],
						},
					},
					required: ['data', 'dataType'],
				},
				execute: async (args) => {
					// Implementation would depend on data analysis libraries
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						analysis: `Analysis of ${args.dataType} data completed`,
						summary: 'Data analysis summary would appear here',
					};
				},
			},
			{
				name: 'create_visualization',
				description: 'Create a visualization based on the provided data',
				parameters: {
					type: 'object',
					properties: {
						data: {
							type: 'string',
							description: 'The data to visualize in JSON or CSV format',
						},
						vizType: {
							type: 'string',
							description: 'The type of visualization to create',
							enum: ['bar', 'line', 'scatter', 'pie', 'heatmap', 'histogram', 'boxplot'],
						},
						title: {
							type: 'string',
							description: 'The title of the visualization',
						},
						xAxis: {
							type: 'string',
							description: 'The data field to use for the x-axis',
						},
						yAxis: {
							type: 'string',
							description: 'The data field to use for the y-axis',
						},
					},
					required: ['data', 'vizType'],
				},
				execute: async (args) => {
					// Implementation would depend on visualization libraries
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						visualization: `${args.vizType} visualization created`,
						imageUrl: 'https://example.com/visualization.png',
					};
				},
			},
			{
				name: 'query_data',
				description: 'Run a SQL-like query on the provided data',
				parameters: {
					type: 'object',
					properties: {
						data: {
							type: 'string',
							description: 'The data to query in JSON or CSV format',
						},
						query: {
							type: 'string',
							description: 'The SQL-like query to execute',
						},
					},
					required: ['data', 'query'],
				},
				execute: async (args) => {
					// Implementation would depend on query parsing libraries
					// This is a placeholder for the actual implementation
					return {
						status: 'success',
						result: `Query results for: ${args.query}`,
						rows: 'Query result rows would appear here',
					};
				},
			},
		];

		// Add data analysis tools to agent
		dataAnalysisTools.forEach((tool) => agent.addTool(tool));
	}

	/**
	 * Configure agent with function calling capabilities
	 */
	private static configureFunctionCallingAgent(agent: Agent, _tools: ToolDefinition[]): void {
		// Add system prompt for function calling
		const functionCallingSystemPrompt =
			'You are an AI assistant with function calling capabilities. ' +
			'You can use a variety of tools to accomplish tasks by calling functions. ' +
			'When you need to perform an action or access external data, use the appropriate function. ' +
			'Be efficient in your function calling and only use functions when necessary.';

		// Add system prompt to agent
		agent.addSystemPrompt(functionCallingSystemPrompt);

		// Function calling requires no special tools by default
		// The tools will be provided by the user
	}

	/**
	 * Register a new tool for an agent
	 */
	static registerToolForAgent(agent: Agent, tool: ToolDefinition): Agent {
		agent.addTool(tool);
		return agent;
	}

	/**
	 * Create a specialized agent for a specific task
	 */
	static createSpecializedAgent(options: {
		task: string;
		description: string;
		capabilities?: string[];
		preferredProvider?: ModelProvider;
		tools?: ToolDefinition[];
	}): Agent {
		const { task, description, capabilities = [], preferredProvider, tools = [] } = options;

		// Determine agent type based on task
		let agentType: AgentType = 'conversational';
		if (task.includes('browse') || task.includes('web') || task.includes('search')) {
			agentType = 'web-browsing';
		} else if (task.includes('workflow') || task.includes('automation')) {
			agentType = 'workflow';
		} else if (task.includes('analyze') || task.includes('data') || task.includes('statistics')) {
			agentType = 'data-analysis';
		} else if (task.includes('function') || task.includes('tool') || task.includes('api')) {
			agentType = 'function-calling';
		}

		// Create system prompt based on task and description
		const systemPrompt = `You are an AI assistant specialized in ${task}. ${description}`;

		// Get recommended model based on the task requirements
		const recommendedModel = ModelSelector.recommendModel({
			capabilities,
			preferredProvider,
			minContextLength: 8000, // Default minimum context length
		});

		if (!recommendedModel) {
			throw new Error('No model matching the requirements was found');
		}

		// Create agent
		return this.createAgent({
			provider: recommendedModel.provider,
			model: recommendedModel.id,
			agentType,
			systemPrompt,
			tools,
		});
	}

	/**
	 * Create an agent with a memory system
	 */
	static createAgentWithMemory(
		options: AgentFactoryOptions & {
			agentId: string;
			persistMemory?: boolean;
		},
	): Agent {
		// Ensure agentId is provided
		if (!options.agentId) {
			throw new Error('agentId is required to create an agent with memory');
		}

		// Create agent with memory options
		return this.createAgent({
			...options,
			persistMemory: options.persistMemory ?? true,
		});
	}
}
