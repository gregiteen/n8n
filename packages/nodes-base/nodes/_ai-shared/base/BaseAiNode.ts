// Base AI Node - Common functionality for all AI agent nodes

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export interface BaseAiNodeConfig {
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
			icon: config.icon,
			group: config.group as any,
			version: config.version,
			description: config.description,
			defaults: config.defaults,
			inputs: config.inputs,
			outputs: config.outputs,
			credentials: [
				{
					name: 'aiOrchestratorApi',
					required: true,
				},
			],
			properties: [
				{
					displayName: 'Model Provider',
					name: 'modelProvider',
					type: 'options',
					options: [
						{ name: 'OpenAI', value: 'openai' },
						{ name: 'Anthropic', value: 'anthropic' },
						{ name: 'Google Gemini', value: 'gemini' },
					],
					default: 'openai',
					description: 'The AI model provider to use',
				},
				{
					displayName: 'Model',
					name: 'model',
					type: 'string',
					default: 'gpt-4',
					description: 'The specific model to use',
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
					description:
						'Controls randomness in the AI response (0 = deterministic, 2 = very random)',
				},
				{
					displayName: 'Max Tokens',
					name: 'maxTokens',
					type: 'number',
					default: 1000,
					description: 'Maximum number of tokens in the response',
				},
				...config.properties,
			],
		};
	}

	abstract execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;

	protected async makeApiRequest(
		this: IExecuteFunctions,
		endpoint: string,
		method: string = 'POST',
		body?: any,
	) {
		const credentials = await this.getCredentials('aiOrchestratorApi');
		const baseUrl = (credentials.url as string) || 'http://localhost:3001';

		const options = {
			method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${credentials.apiKey}`,
			},
			uri: `${baseUrl}${endpoint}`,
			json: true,
		};

		if (body) {
			options.body = body;
		}

		try {
			return await this.helpers.request(options);
		} catch (error) {
			throw new Error(`AI Orchestrator API request failed: ${error.message}`);
		}
	}

	protected getCommonParameters(this: IExecuteFunctions) {
		return {
			modelProvider: this.getNodeParameter('modelProvider', 0) as string,
			model: this.getNodeParameter('model', 0) as string,
			temperature: this.getNodeParameter('temperature', 0) as number,
			maxTokens: this.getNodeParameter('maxTokens', 0) as number,
		};
	}
}
