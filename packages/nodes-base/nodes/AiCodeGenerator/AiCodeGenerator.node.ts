// AI Code Generator Node - AI-powered code generation and programming assistance

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../_ai-shared/base/BaseAiNode';
import { NodeHelpers } from '../_ai-shared/utils/NodeHelpers';

export class AiCodeGenerator extends BaseAiNode {
	constructor() {
		super({
			name: 'aiCodeGenerator',
			displayName: 'AI Code Generator',
			description: 'AI-powered code generation, refactoring, and programming assistance',
			icon: 'file:aicodegen.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Code Generator',
				color: '#95A5A6',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					options: [
						{ name: 'Generate Code', value: 'generate' },
						{ name: 'Explain Code', value: 'explain' },
						{ name: 'Refactor Code', value: 'refactor' },
						{ name: 'Debug Code', value: 'debug' },
						{ name: 'Generate Tests', value: 'tests' },
						{ name: 'Code Review', value: 'review' },
						{ name: 'Convert Language', value: 'convert' },
					],
					default: 'generate',
					description: 'Code operation to perform',
				},
				{
					displayName: 'Programming Language',
					name: 'language',
					type: 'options',
					options: [
						{ name: 'JavaScript', value: 'javascript' },
						{ name: 'TypeScript', value: 'typescript' },
						{ name: 'Python', value: 'python' },
						{ name: 'Java', value: 'java' },
						{ name: 'C#', value: 'csharp' },
						{ name: 'Go', value: 'go' },
						{ name: 'Rust', value: 'rust' },
						{ name: 'PHP', value: 'php' },
						{ name: 'Ruby', value: 'ruby' },
						{ name: 'SQL', value: 'sql' },
						{ name: 'HTML/CSS', value: 'html' },
						{ name: 'Shell/Bash', value: 'bash' },
					],
					default: 'javascript',
					description: 'Programming language for the code',
				},
				{
					displayName: 'Description/Requirements',
					name: 'description',
					type: 'string',
					typeOptions: {
						rows: 4,
					},
					default: '',
					description: 'Describe what you want the code to do',
					displayOptions: {
						show: {
							operation: ['generate'],
						},
					},
				},
				{
					displayName: 'Existing Code',
					name: 'existingCode',
					type: 'string',
					typeOptions: {
						rows: 6,
					},
					default: '',
					description: 'Existing code to work with',
					displayOptions: {
						show: {
							operation: ['explain', 'refactor', 'debug', 'tests', 'review', 'convert'],
						},
					},
				},
				{
					displayName: 'Target Language',
					name: 'targetLanguage',
					type: 'options',
					options: [
						{ name: 'JavaScript', value: 'javascript' },
						{ name: 'TypeScript', value: 'typescript' },
						{ name: 'Python', value: 'python' },
						{ name: 'Java', value: 'java' },
						{ name: 'C#', value: 'csharp' },
						{ name: 'Go', value: 'go' },
						{ name: 'Rust', value: 'rust' },
						{ name: 'PHP', value: 'php' },
						{ name: 'Ruby', value: 'ruby' },
					],
					default: 'python',
					description: 'Target language for conversion',
					displayOptions: {
						show: {
							operation: ['convert'],
						},
					},
				},
				{
					displayName: 'Code Style',
					name: 'codeStyle',
					type: 'options',
					options: [
						{ name: 'Clean & Simple', value: 'clean' },
						{ name: 'Production Ready', value: 'production' },
						{ name: 'Educational', value: 'educational' },
						{ name: 'Performance Focused', value: 'performance' },
						{ name: 'Functional Style', value: 'functional' },
						{ name: 'Object-Oriented', value: 'oop' },
					],
					default: 'clean',
					description: 'Coding style and approach',
				},
				{
					displayName: 'Include Comments',
					name: 'includeComments',
					type: 'boolean',
					default: true,
					description: 'Include explanatory comments in the code',
				},
				{
					displayName: 'Include Examples',
					name: 'includeExamples',
					type: 'boolean',
					default: false,
					description: 'Include usage examples',
				},
				{
					displayName: 'Framework/Library',
					name: 'framework',
					type: 'string',
					default: '',
					description: 'Specific framework or library to use (e.g., React, Express, FastAPI)',
				},
			],
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get parameters
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const language = this.getNodeParameter('language', itemIndex) as string;
				const description = this.getNodeParameter('description', itemIndex, '') as string;
				const existingCode = this.getNodeParameter('existingCode', itemIndex, '') as string;
				const targetLanguage = this.getNodeParameter('targetLanguage', itemIndex, '') as string;
				const codeStyle = this.getNodeParameter('codeStyle', itemIndex) as string;
				const includeComments = this.getNodeParameter('includeComments', itemIndex) as boolean;
				const includeExamples = this.getNodeParameter('includeExamples', itemIndex) as boolean;
				const framework = this.getNodeParameter('framework', itemIndex, '') as string;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Validate required inputs based on operation
				if (operation === 'generate' && !description) {
					throw new Error('Description is required for code generation');
				}
				if (
					['explain', 'refactor', 'debug', 'tests', 'review', 'convert'].includes(operation) &&
					!existingCode
				) {
					throw new Error('Existing code is required for this operation');
				}

				// Build code generation request
				const codeRequest = {
					agent: agentConfig,
					operation,
					language,
					targetLanguage: operation === 'convert' ? targetLanguage : language,
					description: NodeHelpers.cleanText(description),
					existingCode: NodeHelpers.cleanText(existingCode),
					options: {
						codeStyle,
						includeComments,
						includeExamples,
						framework,
					},
				};

				// Make API request
				const response = await this.makeApiRequest(
					'/api/agents/generate-code',
					'POST',
					codeRequest,
				);

				// Format output based on operation
				const outputData: any = {
					operation,
					language,
					timestamp: new Date().toISOString(),
					usage: response.usage,
				};

				switch (operation) {
					case 'generate':
						outputData.code = response.code;
						outputData.explanation = response.explanation;
						outputData.examples = response.examples;
						break;

					case 'explain':
						outputData.originalCode = existingCode;
						outputData.explanation = response.explanation;
						outputData.codeStructure = response.structure;
						outputData.keyFeatures = response.features;
						break;

					case 'refactor':
						outputData.originalCode = existingCode;
						outputData.refactoredCode = response.code;
						outputData.improvements = response.improvements;
						outputData.explanation = response.explanation;
						break;

					case 'debug':
						outputData.originalCode = existingCode;
						outputData.issues = response.issues;
						outputData.fixedCode = response.code;
						outputData.explanation = response.explanation;
						break;

					case 'tests':
						outputData.originalCode = existingCode;
						outputData.testCode = response.code;
						outputData.testFramework = response.framework;
						outputData.coverage = response.coverage;
						break;

					case 'review':
						outputData.originalCode = existingCode;
						outputData.review = response.review;
						outputData.suggestions = response.suggestions;
						outputData.rating = response.rating;
						break;

					case 'convert':
						outputData.originalCode = existingCode;
						outputData.convertedCode = response.code;
						outputData.sourceLanguage = language;
						outputData.targetLanguage = targetLanguage;
						outputData.conversionNotes = response.notes;
						break;
				}

				returnData.push({
					json: outputData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							operation: this.getNodeParameter('operation', itemIndex, ''),
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					NodeHelpers.handleApiError(error, 'AI Code Generator');
				}
			}
		}

		return [returnData];
	}
}
