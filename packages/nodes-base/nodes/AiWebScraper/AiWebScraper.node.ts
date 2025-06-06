// AI Web Scraper Node - Intelligent web scraping with AI analysis

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../_ai-shared/base/BaseAiNode';
import { NodeHelpers } from '../_ai-shared/utils/NodeHelpers';

export class AiWebScraper extends BaseAiNode {
	constructor() {
		super({
			name: 'aiWebScraper',
			displayName: 'AI Web Scraper',
			description: 'AI-powered web scraping with intelligent content extraction and analysis',
			icon: 'file:aiwebscraper.svg',
			group: ['input'],
			version: 1,
			defaults: {
				name: 'AI Web Scraper',
				color: '#4ECDC4',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'URL',
					name: 'url',
					type: 'string',
					default: '',
					required: true,
					description: 'URL of the webpage to scrape',
				},
				{
					displayName: 'Extraction Type',
					name: 'extractionType',
					type: 'options',
					options: [
						{ name: 'Smart Content', value: 'smart' },
						{ name: 'Specific Elements', value: 'elements' },
						{ name: 'Full Page Text', value: 'full' },
						{ name: 'Links and URLs', value: 'links' },
						{ name: 'Images and Media', value: 'media' },
						{ name: 'Structured Data', value: 'structured' },
					],
					default: 'smart',
					description: 'Type of content to extract from the webpage',
				},
				{
					displayName: 'CSS Selector',
					name: 'cssSelector',
					type: 'string',
					default: '',
					description: 'CSS selector for specific elements (when using Specific Elements)',
					displayOptions: {
						show: {
							extractionType: ['elements'],
						},
					},
				},
				{
					displayName: 'Content Analysis',
					name: 'contentAnalysis',
					type: 'options',
					options: [
						{ name: 'None', value: 'none' },
						{ name: 'Summarize', value: 'summarize' },
						{ name: 'Extract Key Points', value: 'keypoints' },
						{ name: 'Sentiment Analysis', value: 'sentiment' },
						{ name: 'Topic Classification', value: 'classify' },
						{ name: 'Custom Analysis', value: 'custom' },
					],
					default: 'none',
					description: 'AI analysis to perform on extracted content',
				},
				{
					displayName: 'Analysis Query',
					name: 'analysisQuery',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					description: 'Specific analysis question for the AI to answer about the content',
					displayOptions: {
						show: {
							contentAnalysis: ['custom'],
						},
					},
				},
				{
					displayName: 'Follow Links',
					name: 'followLinks',
					type: 'boolean',
					default: false,
					description: 'Whether to follow and scrape linked pages',
				},
				{
					displayName: 'Max Pages',
					name: 'maxPages',
					type: 'number',
					default: 1,
					description: 'Maximum number of pages to scrape',
					displayOptions: {
						show: {
							followLinks: [true],
						},
					},
				},
				{
					displayName: 'Wait for Content',
					name: 'waitForContent',
					type: 'boolean',
					default: false,
					description: 'Wait for dynamic content to load (slower but more complete)',
				},
				{
					displayName: 'Remove Noise',
					name: 'removeNoise',
					type: 'boolean',
					default: true,
					description: 'Remove navigation, ads, and other non-content elements',
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
				NodeHelpers.validateRequiredParams(this, ['url'], itemIndex);

				// Get parameters
				const url = this.getNodeParameter('url', itemIndex) as string;
				const extractionType = this.getNodeParameter('extractionType', itemIndex) as string;
				const cssSelector = this.getNodeParameter('cssSelector', itemIndex, '') as string;
				const contentAnalysis = this.getNodeParameter('contentAnalysis', itemIndex) as string;
				const analysisQuery = this.getNodeParameter('analysisQuery', itemIndex, '') as string;
				const followLinks = this.getNodeParameter('followLinks', itemIndex) as boolean;
				const maxPages = this.getNodeParameter('maxPages', itemIndex, 1) as number;
				const waitForContent = this.getNodeParameter('waitForContent', itemIndex) as boolean;
				const removeNoise = this.getNodeParameter('removeNoise', itemIndex) as boolean;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Build scraping request
				const scrapingRequest = {
					agent: agentConfig,
					url: url.trim(),
					options: {
						extractionType,
						cssSelector,
						contentAnalysis,
						analysisQuery,
						followLinks,
						maxPages: Math.min(maxPages, 10), // Safety limit
						waitForContent,
						removeNoise,
						timeout: 30000,
					},
				};

				// Make API request
				const response = await this.makeApiRequest(
					'/api/agents/scrape-web',
					'POST',
					scrapingRequest,
				);

				// Format output
				const outputData = {
					url: response.url,
					title: response.title,
					content: response.content,
					links: response.links || [],
					images: response.images || [],
					metadata: response.metadata || {},
					analysis: response.analysis || null,
					scrapedPages: response.scrapedPages || 1,
					extractionType,
					timestamp: new Date().toISOString(),
					usage: response.usage,
				};

				// Add structured data if available
				if (response.structuredData) {
					outputData['structuredData'] = response.structuredData;
				}

				// Add sentiment if analyzed
				if (response.sentiment) {
					outputData['sentiment'] = response.sentiment;
				}

				returnData.push({
					json: outputData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							url: this.getNodeParameter('url', itemIndex, ''),
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					NodeHelpers.handleApiError(error, 'AI Web Scraper');
				}
			}
		}

		return [returnData];
	}
}
