import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class AiAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Agent',
		name: 'aiAgent',
		icon: 'fa:robot',
		group: ['transform'],
		version: 1,
		description: 'Interact with AI agents from the AI Orchestrator',
		defaults: {
			name: 'AI Agent',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'aiOrchestratorApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a message to an AI agent',
						action: 'Send a message to an AI agent',
					},
					{
						name: 'Create Agent',
						value: 'createAgent',
						description: 'Create a new AI agent',
						action: 'Create a new AI agent',
					},
					{
						name: 'List Agents',
						value: 'listAgents',
						description: 'List all available AI agents',
						action: 'List all available AI agents',
					},
					{
						name: 'Execute Tool',
						value: 'executeTool',
						description: 'Execute a tool with an AI agent',
						action: 'Execute a tool with an AI agent',
					},
				],
				default: 'sendMessage',
			},
			// Send Message fields
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage', 'executeTool'],
					},
				},
				default: '',
				description: 'The ID of the agent to interact with',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: '',
				description: 'The message to send to the agent',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName: 'Use Tools',
				name: 'useTools',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: false,
				description: 'Whether to enable tool usage for this message',
			},
			// Create Agent fields
			{
				displayName: 'Agent Type',
				name: 'agentType',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['createAgent'],
					},
				},
				options: [
					{
						name: 'Conversational',
						value: 'conversational',
						description: 'General purpose conversational agent',
					},
					{
						name: 'Web Browsing',
						value: 'web-browsing',
						description: 'Agent with web browsing capabilities',
					},
					{
						name: 'Workflow',
						value: 'workflow',
						description: 'Agent specialized for n8n workflow management',
					},
					{
						name: 'Data Analysis',
						value: 'data-analysis',
						description: 'Agent specialized for data analysis tasks',
					},
					{
						name: 'Function Calling',
						value: 'function-calling',
						description: 'Agent with advanced function calling capabilities',
					},
				],
				default: 'conversational',
			},
			{
				displayName: 'Model Provider',
				name: 'provider',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['createAgent'],
					},
				},
				options: [
					{
						name: 'OpenAI',
						value: 'openai',
					},
					{
						name: 'Anthropic',
						value: 'anthropic',
					},
					{
						name: 'Google Gemini',
						value: 'gemini',
					},
					{
						name: 'OpenRouter',
						value: 'openrouter',
					},
				],
				default: 'openai',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createAgent'],
					},
				},
				default: 'gpt-4-turbo',
				description:
					'The specific model to use (e.g., gpt-4-turbo, claude-3-opus-20240229, gemini-1.5-pro)',
			},
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createAgent'],
					},
				},
				default: '',
				description: 'Optional system prompt to configure the agent behavior',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName: 'Enable Memory',
				name: 'enableMemory',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['createAgent'],
					},
				},
				default: false,
				description: 'Whether to enable memory for this agent',
			},
			// Execute Tool fields
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['executeTool'],
					},
				},
				default: '',
				description: 'The name of the tool to execute',
			},
			{
				displayName: 'Tool Arguments',
				name: 'toolArguments',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['executeTool'],
					},
				},
				default: '{}',
				description: 'Arguments to pass to the tool (as JSON)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('aiOrchestratorApi', i);

				const baseUrl = (credentials.url as string) || 'http://localhost:3001';
				const apiKey = credentials.apiKey as string;

				const headers = {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				};

				let responseData: any;

				switch (operation) {
					case 'sendMessage':
						const agentId = this.getNodeParameter('agentId', i) as string;
						const message = this.getNodeParameter('message', i) as string;
						const useTools = this.getNodeParameter('useTools', i) as boolean;

						const sendUrl = useTools
							? `${baseUrl}/api/agents/${agentId}/send-with-tools`
							: `${baseUrl}/api/agents/${agentId}/send`;

						const sendResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: sendUrl,
							headers,
							body: { message },
						});

						responseData = {
							agentId,
							message,
							response: sendResponse.response,
							toolResults: sendResponse.toolResults || null,
						};
						break;

					case 'createAgent':
						const agentType = this.getNodeParameter('agentType', i) as string;
						const provider = this.getNodeParameter('provider', i) as string;
						const model = this.getNodeParameter('model', i) as string;
						const systemPrompt = this.getNodeParameter('systemPrompt', i) as string;
						const enableMemory = this.getNodeParameter('enableMemory', i) as boolean;

						const createResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/agents`,
							headers,
							body: {
								agentType,
								provider,
								model,
								systemPrompt: systemPrompt || undefined,
								enableMemory,
							},
						});

						responseData = createResponse;
						break;

					case 'listAgents':
						const listResponse = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/api/agents`,
							headers,
						});

						responseData = listResponse;
						break;

					case 'executeTool':
						const toolAgentId = this.getNodeParameter('agentId', i) as string;
						const toolName = this.getNodeParameter('toolName', i) as string;
						const toolArgumentsStr = this.getNodeParameter('toolArguments', i) as string;

						let toolArguments;
						try {
							toolArguments = JSON.parse(toolArgumentsStr);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid JSON in tool arguments: ${error.message}`,
								{ itemIndex: i },
							);
						}

						const toolResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/agents/${toolAgentId}/execute-tool`,
							headers,
							body: {
								toolName,
								arguments: toolArguments,
							},
						});

						responseData = {
							agentId: toolAgentId,
							toolName,
							arguments: toolArguments,
							result: toolResponse,
						};
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
