// AI Image Analyzer Node - AI-powered image analysis and understanding

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../base/BaseAiNode';
import { NodeHelpers } from '../utils/NodeHelpers';

export class AiImageAnalyzer extends BaseAiNode {
	constructor() {
		super({
			name: 'aiImageAnalyzer',
			displayName: 'AI Image Analyzer',
			description: 'AI-powered image analysis, description, and content extraction',
			icon: 'file:aiimageanalyzer.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Image Analyzer',
				color: '#E67E22',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Image Source',
					name: 'imageSource',
					type: 'options',
					options: [
						{ name: 'URL', value: 'url' },
						{ name: 'Base64 Data', value: 'base64' },
						{ name: 'File Upload', value: 'file' },
						{ name: 'Input Data', value: 'input' },
					],
					default: 'url',
					description: 'Source of the image to analyze',
				},
				{
					displayName: 'Image URL',
					name: 'imageUrl',
					type: 'string',
					default: '',
					description: 'URL of the image to analyze',
					displayOptions: {
						show: {
							imageSource: ['url'],
						},
					},
				},
				{
					displayName: 'Base64 Image Data',
					name: 'imageBase64',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					description: 'Base64 encoded image data',
					displayOptions: {
						show: {
							imageSource: ['base64'],
						},
					},
				},
				{
					displayName: 'Analysis Type',
					name: 'analysisType',
					type: 'options',
					options: [
						{ name: 'General Description', value: 'description' },
						{ name: 'Object Detection', value: 'objects' },
						{ name: 'Text Extraction (OCR)', value: 'ocr' },
						{ name: 'Scene Analysis', value: 'scene' },
						{ name: 'Face Detection', value: 'faces' },
						{ name: 'Brand/Logo Recognition', value: 'brands' },
						{ name: 'Content Moderation', value: 'moderation' },
						{ name: 'Product Analysis', value: 'product' },
						{ name: 'Custom Analysis', value: 'custom' },
					],
					default: 'description',
					description: 'Type of analysis to perform on the image',
				},
				{
					displayName: 'Custom Analysis Query',
					name: 'customQuery',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					description: 'Specific question about the image',
					displayOptions: {
						show: {
							analysisType: ['custom'],
						},
					},
				},
				{
					displayName: 'Detail Level',
					name: 'detailLevel',
					type: 'options',
					options: [
						{ name: 'Basic', value: 'basic' },
						{ name: 'Detailed', value: 'detailed' },
						{ name: 'Comprehensive', value: 'comprehensive' },
					],
					default: 'detailed',
					description: 'Level of detail in the analysis',
				},
				{
					displayName: 'Extract Colors',
					name: 'extractColors',
					type: 'boolean',
					default: false,
					description: 'Extract dominant colors from the image',
				},
				{
					displayName: 'Generate Alt Text',
					name: 'generateAltText',
					type: 'boolean',
					default: false,
					description: 'Generate accessibility alt text',
				},
				{
					displayName: 'Include Confidence Scores',
					name: 'includeConfidence',
					type: 'boolean',
					default: false,
					description: 'Include confidence scores for detected elements',
				},
				{
					displayName: 'Output Format',
					name: 'outputFormat',
					type: 'options',
					options: [
						{ name: 'Structured JSON', value: 'json' },
						{ name: 'Natural Language', value: 'natural' },
						{ name: 'Detailed Report', value: 'report' },
					],
					default: 'json',
					description: 'Format of the analysis output',
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
				const imageSource = this.getNodeParameter('imageSource', itemIndex) as string;
				const imageUrl = this.getNodeParameter('imageUrl', itemIndex, '') as string;
				const imageBase64 = this.getNodeParameter('imageBase64', itemIndex, '') as string;
				const analysisType = this.getNodeParameter('analysisType', itemIndex) as string;
				const customQuery = this.getNodeParameter('customQuery', itemIndex, '') as string;
				const detailLevel = this.getNodeParameter('detailLevel', itemIndex) as string;
				const extractColors = this.getNodeParameter('extractColors', itemIndex) as boolean;
				const generateAltText = this.getNodeParameter('generateAltText', itemIndex) as boolean;
				const includeConfidence = this.getNodeParameter('includeConfidence', itemIndex) as boolean;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Extract image data based on source
				let imageData = '';
				let imageName = '';

				switch (imageSource) {
					case 'url':
						if (!imageUrl) {
							throw new Error('Image URL is required');
						}
						imageData = imageUrl;
						imageName = imageUrl.split('/').pop() || 'image';
						break;

					case 'base64':
						if (!imageBase64) {
							throw new Error('Base64 image data is required');
						}
						imageData = imageBase64;
						imageName = 'base64_image';
						break;

					case 'file':
					case 'input':
						const fileInfo = NodeHelpers.extractFileInfo(items[itemIndex]);
						if (fileInfo.content) {
							imageData = fileInfo.content;
							imageName = fileInfo.name || 'uploaded_image';
						} else {
							throw new Error('No image data found in input');
						}
						break;
				}

				// Validate custom query for custom analysis
				if (analysisType === 'custom' && !customQuery) {
					throw new Error('Custom analysis query is required');
				}

				// Build image analysis request
				const analysisRequest = {
					agent: agentConfig,
					image: {
						source: imageSource,
						data: imageData,
						name: imageName,
					},
					analysis: {
						type: analysisType,
						customQuery: customQuery,
						detailLevel,
						extractColors,
						generateAltText,
						includeConfidence,
						outputFormat,
					},
				};

				// Make API request
				const response = await this.makeApiRequest(
					'/api/agents/analyze-image',
					'POST',
					analysisRequest,
				);

				// Format output
				const outputData: any = {
					imageName,
					imageSource,
					analysisType,
					description: response.description,
					timestamp: new Date().toISOString(),
					usage: response.usage,
				};

				// Add analysis-specific results
				switch (analysisType) {
					case 'description':
						outputData.description = response.description;
						break;

					case 'objects':
						outputData.objects = response.objects || [];
						outputData.objectCount = response.objects?.length || 0;
						break;

					case 'ocr':
						outputData.text = response.text;
						outputData.textBlocks = response.textBlocks || [];
						break;

					case 'scene':
						outputData.scene = response.scene;
						outputData.setting = response.setting;
						outputData.mood = response.mood;
						break;

					case 'faces':
						outputData.faces = response.faces || [];
						outputData.faceCount = response.faces?.length || 0;
						break;

					case 'brands':
						outputData.brands = response.brands || [];
						outputData.logos = response.logos || [];
						break;

					case 'moderation':
						outputData.moderationResult = response.moderation;
						outputData.isSafe = response.isSafe;
						outputData.categories = response.categories || [];
						break;

					case 'product':
						outputData.productInfo = response.product;
						outputData.category = response.category;
						outputData.features = response.features || [];
						break;

					case 'custom':
						outputData.customAnalysis = response.analysis;
						outputData.answer = response.answer;
						break;
				}

				// Add optional elements
				if (response.colors && extractColors) {
					outputData.dominantColors = response.colors;
				}

				if (response.altText && generateAltText) {
					outputData.altText = response.altText;
				}

				if (response.metadata) {
					outputData.metadata = response.metadata;
				}

				if (response.confidence && includeConfidence) {
					outputData.confidence = response.confidence;
				}

				returnData.push({
					json: outputData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							imageSource: this.getNodeParameter('imageSource', itemIndex, ''),
							analysisType: this.getNodeParameter('analysisType', itemIndex, ''),
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					NodeHelpers.handleApiError(error, 'AI Image Analyzer');
				}
			}
		}

		return [returnData];
	}
}
