import { Agent, AgentOptions, ModelProvider, ToolDefinition } from '../agent';
import { ModelInfo, ModelSelectorService } from './model-selector.service';
import { ApplicationError } from 'n8n-workflow';

export interface AgentConfig {
	type: 'chat' | 'web-browsing' | 'workflow-automation' | 'data-analysis';
	model?: string;
	provider?: ModelProvider;
	systemPrompt?: string;
	tools?: ToolDefinition[];
	capabilities?: string[];
}

export class AgentFactoryService {
	private modelSelector: ModelSelectorService;

	constructor(modelSelector = new ModelSelectorService()) {
		this.modelSelector = modelSelector;
	}

	async createAgent(config: AgentConfig): Promise<Agent> {
		// Determine provider and model to use
		let provider = config.provider;
		let modelId = config.model;

		if (!provider || !modelId) {
			// If no specific model is requested, select an appropriate model based on agent type
			const requiredCapability = this.getRequiredCapabilityForAgentType(config.type);
			const models = this.modelSelector.getModelsByCapability(requiredCapability);

			if (models.length === 0) {
				throw new ApplicationError(
					`No models support the capability required for agent type: ${config.type}`,
				);
			}

			// Use the first matching model
			const model = models[0];
			provider = model.provider;
			modelId = model.id;
		}

		// Create agent options
		const options: AgentOptions = {
			provider,
			model: modelId,
			systemPrompt: config.systemPrompt || this.getDefaultSystemPromptForAgentType(config.type),
			capabilities: config.capabilities || [],
		};

		// Create the agent
		const agent = new Agent(options);

		// Add tools if specified
		if (config.tools && config.tools.length > 0) {
			config.tools.forEach((tool) => agent.addTool(tool));
		}

		return agent;
	}

	private getRequiredCapabilityForAgentType(type: string): string {
		switch (type) {
			case 'web-browsing':
				return 'browsing';
			case 'workflow-automation':
				return 'functions';
			case 'data-analysis':
				return 'text';
			case 'chat':
			default:
				return 'text';
		}
	}

	private getDefaultSystemPromptForAgentType(type: string): string {
		switch (type) {
			case 'web-browsing':
				return 'You are a helpful web browsing assistant. You can search the web for information and summarize the results.';
			case 'workflow-automation':
				return 'You are a workflow automation assistant. You help users create and optimize automation workflows.';
			case 'data-analysis':
				return 'You are a data analysis assistant. You help users understand and extract insights from their data.';
			case 'chat':
			default:
				return "You are a helpful AI assistant. You provide clear and accurate information to the user's questions.";
		}
	}

	async createWebBrowsingAgent(model?: string, provider?: ModelProvider): Promise<Agent> {
		return this.createAgent({
			type: 'web-browsing',
			model,
			provider,
			capabilities: ['browsing'],
		});
	}

	async createWorkflowAgent(model?: string, provider?: ModelProvider): Promise<Agent> {
		const workflowTools: ToolDefinition[] = [
			{
				name: 'create_workflow',
				description: 'Create a new workflow in n8n',
				parameters: {
					name: { type: 'string', description: 'The name of the workflow' },
					nodes: { type: 'array', description: 'The nodes in the workflow' },
					connections: { type: 'object', description: 'The connections between nodes' },
				},
				required: ['name'],
			},
			{
				name: 'run_workflow',
				description: 'Run an existing workflow in n8n',
				parameters: {
					workflowId: { type: 'string', description: 'The ID of the workflow to run' },
					data: { type: 'object', description: 'Input data for the workflow' },
				},
				required: ['workflowId'],
			},
		];

		return this.createAgent({
			type: 'workflow-automation',
			model,
			provider,
			tools: workflowTools,
			capabilities: ['functions'],
		});
	}
}
