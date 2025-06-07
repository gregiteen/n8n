// AI Chat Agent Node - Conversational AI agent for n8n workflows

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../_ai-shared/base/BaseAiNode';
import { NodeHelpers } from '../_ai-shared/utils/NodeHelpers';

export class AiChatAgent extends BaseAiNode {
	constructor() {
		super({
			name: 'aiChatAgent',
			displayName: 'AI Chat Agent',
			description: 'Conversational AI agent for interactive chat experiences',
			icon: 'file:aichat.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Chat Agent',
				color: '#4A90E2',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Agent Name',
					name: 'agentName',
					type: 'string',
					default: 'Chat Assistant',
					description: 'Name for this chat agent',
				},
				{
					displayName: 'System Prompt',
					name: 'systemPrompt',
					type: 'string',
					typeOptions: {
						rows: 4,
					},
					default:
						'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
					description: "System prompt that defines the agent's behavior and personality",
				},
				{
					displayName: 'Message',
					name: 'message',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					description: 'The message to send to the AI agent',
				},
				{
					displayName: 'Conversation History',
					name: 'conversationHistory',
					type: 'json',
					default: '[]',
					description: 'Previous messages in the conversation (JSON array)',
				},
				{
					displayName: 'Enable Memory',
					name: 'enableMemory',
					type: 'boolean',
					default: false,
					description: 'Whether to maintain conversation memory across workflow runs',
				},
				{
					displayName: 'Response Format',
					name: 'responseFormat',
					type: 'options',
					options: [
						{ name: 'Text', value: 'text' },
						{ name: 'JSON', value: 'json' },
						{ name: 'Structured', value: 'structured' },
					],
					default: 'text',
					description: 'Format of the AI response',
				},
			],
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Validate required parameters
				NodeHelpers.validateRequiredParams(this, ['message'], itemIndex);

				// Get parameters
				const message = this.getNodeParameter('message', itemIndex) as string;
				const systemPrompt = this.getNodeParameter('systemPrompt', itemIndex) as string;
				const conversationHistory = NodeHelpers.safeJsonParse(
					this.getNodeParameter('conversationHistory', itemIndex, '[]') as string,
					[],
				);
				const responseFormat = this.getNodeParameter('responseFormat', itemIndex) as string;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Build conversation messages
				const messages = [
					{ role: 'system', content: systemPrompt },
					...conversationHistory,
					{ role: 'user', content: NodeHelpers.cleanText(message) },
				];

				// Make API request
				const requestOptions = {
					method: 'POST' as const,
					url: '/api/agents/chat',
					json: true,
					body: {
						agent: agentConfig,
						messages: messages,
						format: responseFormat,
					},
				};

				const response = await this.helpers.request(requestOptions);

				// Format response
				const outputData = {
					message: response.message,
					agent: response.agent,
					usage: response.usage,
					conversationHistory: [
						...conversationHistory,
						{ role: 'user', content: message, timestamp: new Date().toISOString() },
						{
							role: 'assistant',
							content: response.message,
							timestamp: new Date().toISOString(),
						},
					],
					timestamp: new Date().toISOString(),
				};

				returnData.push({
					json: outputData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					NodeHelpers.handleApiError(error, 'AI Chat Agent');
				}
			}
		}

		return [returnData];
	}
}
