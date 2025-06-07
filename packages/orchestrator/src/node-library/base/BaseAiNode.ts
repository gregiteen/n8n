// filepath: /workspaces/n8n/packages/orchestrator/src/node-library/base/BaseAiNode.ts
// Base class for AI nodes

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface BaseAiNodeConfig {
	name: string;
	displayName: string;
	description: string;
	icon: string;
	group: string[];
	version: number;
	defaults: {
		name: string;
		color: string;
	};
	inputs: string[];
	outputs: string[];
	properties: INodeProperties[];
}

export abstract class BaseAiNode implements INodeType {
	description: INodeTypeDescription;

	constructor(config: BaseAiNodeConfig) {
		this.description = {
			displayName: config.displayName,
			name: config.name,
			group: config.group as any,
			version: config.version,
			description: config.description,
			defaults: config.defaults,
			icon: config.icon as any,
			inputs: config.inputs as any,
			outputs: config.outputs as any,
			properties: [
				...config.properties,
				{
					displayName: 'Model Provider',
					name: 'modelProvider',
					type: 'options',
					options: [
						{ name: 'OpenAI', value: 'openai' },
						{ name: 'Anthropic', value: 'anthropic' },
						{ name: 'Google Gemini', value: 'gemini' },
						{ name: 'OpenRouter', value: 'openrouter' },
					],
					default: 'openai',
					description: 'AI model provider to use',
				},
				{
					displayName: 'Model',
					name: 'model',
					type: 'string',
					default: 'gpt-3.5-turbo',
					description: 'Specific model to use (e.g., gpt-4, claude-3-sonnet)',
				},
				{
					displayName: 'Temperature',
					name: 'temperature',
					type: 'number',
					typeOptions: {
						minValue: 0,
						maxValue: 2,
						numberStepSize: 0.1,
					},
					default: 0.7,
					description: 'Controls randomness in the AI response',
				},
				{
					displayName: 'Max Tokens',
					name: 'maxTokens',
					type: 'number',
					default: 1000,
					description: 'Maximum number of tokens in the response',
				},
			],
		};
	}

	abstract execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
