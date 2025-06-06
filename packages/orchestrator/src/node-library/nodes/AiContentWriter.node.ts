// AI Content Writer Node - AI-powered content creation and writing assistance

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../base/BaseAiNode';
import { NodeHelpers } from '../utils/NodeHelpers';

export class AiContentWriter extends BaseAiNode {
	constructor() {
		super({
			name: 'aiContentWriter',
			displayName: 'AI Content Writer',
			description: 'AI-powered content creation for blogs, marketing, emails, and more',
			icon: 'file:aicontentwriter.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Content Writer',
				color: '#9B59B6',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Content Type',
					name: 'contentType',
					type: 'options',
					options: [
						{ name: 'Blog Post', value: 'blog' },
						{ name: 'Email', value: 'email' },
						{ name: 'Social Media Post', value: 'social' },
						{ name: 'Product Description', value: 'product' },
						{ name: 'Marketing Copy', value: 'marketing' },
						{ name: 'Technical Documentation', value: 'technical' },
						{ name: 'Press Release', value: 'press' },
						{ name: 'Newsletter', value: 'newsletter' },
						{ name: 'Landing Page', value: 'landing' },
						{ name: 'Custom Content', value: 'custom' },
					],
					default: 'blog',
					description: 'Type of content to generate',
				},
				{
					displayName: 'Topic/Subject',
					name: 'topic',
					type: 'string',
					default: '',
					required: true,
					description: 'Main topic or subject for the content',
				},
				{
					displayName: 'Writing Style',
					name: 'writingStyle',
					type: 'options',
					options: [
						{ name: 'Professional', value: 'professional' },
						{ name: 'Conversational', value: 'conversational' },
						{ name: 'Persuasive', value: 'persuasive' },
						{ name: 'Educational', value: 'educational' },
						{ name: 'Creative', value: 'creative' },
						{ name: 'Technical', value: 'technical' },
						{ name: 'Casual', value: 'casual' },
						{ name: 'Formal', value: 'formal' },
					],
					default: 'professional',
					description: 'Writing style and tone',
				},
				{
					displayName: 'Target Audience',
					name: 'targetAudience',
					type: 'string',
					default: '',
					description:
						'Target audience for the content (e.g., "small business owners", "developers")',
				},
				{
					displayName: 'Content Length',
					name: 'contentLength',
					type: 'options',
					options: [
						{ name: 'Short (200-400 words)', value: 'short' },
						{ name: 'Medium (400-800 words)', value: 'medium' },
						{ name: 'Long (800-1500 words)', value: 'long' },
						{ name: 'Very Long (1500+ words)', value: 'verylong' },
						{ name: 'Custom Length', value: 'custom' },
					],
					default: 'medium',
					description: 'Desired length of the content',
				},
				{
					displayName: 'Word Count',
					name: 'wordCount',
					type: 'number',
					default: 500,
					description: 'Specific word count target',
					displayOptions: {
						show: {
							contentLength: ['custom'],
						},
					},
				},
				{
					displayName: 'Key Points',
					name: 'keyPoints',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					description: 'Key points to include (one per line)',
				},
				{
					displayName: 'Call to Action',
					name: 'callToAction',
					type: 'string',
					default: '',
					description: 'Specific call to action to include',
				},
				{
					displayName: 'SEO Keywords',
					name: 'seoKeywords',
					type: 'string',
					default: '',
					description: 'Comma-separated SEO keywords to include',
				},
				{
					displayName: 'Include Outline',
					name: 'includeOutline',
					type: 'boolean',
					default: false,
					description: 'Include a content outline in the output',
				},
				{
					displayName: 'Include Meta Description',
					name: 'includeMetaDescription',
					type: 'boolean',
					default: false,
					description: 'Generate meta description for SEO',
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
				NodeHelpers.validateRequiredParams(this, ['topic'], itemIndex);

				// Get parameters
				const contentType = this.getNodeParameter('contentType', itemIndex) as string;
				const topic = this.getNodeParameter('topic', itemIndex) as string;
				const writingStyle = this.getNodeParameter('writingStyle', itemIndex) as string;
				const targetAudience = this.getNodeParameter('targetAudience', itemIndex, '') as string;
				const contentLength = this.getNodeParameter('contentLength', itemIndex) as string;
				const wordCount = this.getNodeParameter('wordCount', itemIndex, 500) as number;
				const keyPoints = this.getNodeParameter('keyPoints', itemIndex, '') as string;
				const callToAction = this.getNodeParameter('callToAction', itemIndex, '') as string;
				const seoKeywords = this.getNodeParameter('seoKeywords', itemIndex, '') as string;
				const includeOutline = this.getNodeParameter('includeOutline', itemIndex) as boolean;
				const includeMetaDescription = this.getNodeParameter(
					'includeMetaDescription',
					itemIndex,
				) as boolean;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Calculate target word count
				let targetWordCount = wordCount;
				if (contentLength !== 'custom') {
					const lengthMap = {
						short: 300,
						medium: 600,
						long: 1200,
						verylong: 2000,
					};
					targetWordCount = lengthMap[contentLength] || 600;
				}

				// Build content generation request
				const contentRequest = {
					agent: agentConfig,
					contentType,
					topic: NodeHelpers.cleanText(topic),
					requirements: {
						writingStyle,
						targetAudience,
						wordCount: targetWordCount,
						keyPoints: keyPoints
							? keyPoints
									.split('\n')
									.map((p) => p.trim())
									.filter((p) => p)
							: [],
						callToAction,
						seoKeywords: seoKeywords
							? seoKeywords
									.split(',')
									.map((k) => k.trim())
									.filter((k) => k)
							: [],
						includeOutline,
						includeMetaDescription,
					},
				};

				// Make API request
				const response = await this.makeApiRequest(
					'/api/agents/generate-content',
					'POST',
					contentRequest,
				);

				// Format output
				const outputData: any = {
					content: response.content,
					title: response.title,
					contentType,
					writingStyle,
					wordCount: response.wordCount,
					readingTime: response.readingTime,
					timestamp: new Date().toISOString(),
					usage: response.usage,
				};

				// Add optional elements
				if (response.outline) {
					outputData.outline = response.outline;
				}

				if (response.metaDescription) {
					outputData.metaDescription = response.metaDescription;
				}

				if (response.tags) {
					outputData.tags = response.tags;
				}

				if (response.socialMediaVersions) {
					outputData.socialMediaVersions = response.socialMediaVersions;
				}

				if (response.seoScore) {
					outputData.seoScore = response.seoScore;
				}

				returnData.push({
					json: outputData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							contentType: this.getNodeParameter('contentType', itemIndex, ''),
							topic: this.getNodeParameter('topic', itemIndex, ''),
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					NodeHelpers.handleApiError(error, 'AI Content Writer');
				}
			}
		}

		return [returnData];
	}
}
