import { Agent, AgentOptions, ModelProvider, ToolDefinition } from './agent';
import { BrowserService } from './services/browser.service';
import { ModelSelector, ModelOption } from './models/model-selector';

export type AgentType = 'conversational' | 'web-browsing' | 'workflow' | 'data-analysis';

export interface AgentFactoryOptions extends AgentOptions {
	agentType?: AgentType;
	tools?: ToolDefinition[];
}

/**
 * Factory for creating specialized AI agents
 */
export class AgentFactory {
	private static browserService = new BrowserService();

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
	private static configureWebBrowsingAgent(agent: Agent, tools: ToolDefinition[]): void {
		// Add system prompt for web browsing
		const webSystemPrompt =
			'You are an AI assistant with web browsing capabilities. ' +
			'You can search the web, visit web pages, extract information, and navigate between pages. ' +
			'When asked to find information online, always use your web browsing tools ' +
			'instead of relying on your built-in knowledge.';

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
	private static configureWorkflowAgent(agent: Agent, tools: ToolDefinition[]): void {
		// Add system prompt for workflow agent
		const workflowSystemPrompt =
			'You are an AI assistant specialized in creating and managing n8n workflows. ' +
			'You can help users build, modify, and optimize automation workflows.';

		// Workflow tools would be added here...
		// (Implementation would depend on the specifics of n8n workflow API)
	}

	/**
	 * Configure agent with data analysis capabilities
	 */
	private static configureDataAnalysisAgent(agent: Agent, tools: ToolDefinition[]): void {
		// Add system prompt for data analysis
		const dataAnalysisSystemPrompt =
			'You are an AI assistant specialized in data analysis. ' +
			'You can process, analyze, and visualize data to extract insights.';

		// Data analysis tools would be added here...
	}
}
