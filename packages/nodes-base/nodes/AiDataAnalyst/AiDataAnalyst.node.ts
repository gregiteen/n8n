// AI Data Analyst Node - Intelligent data analysis and insights

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../_ai-shared/base/BaseAiNode';
import { NodeHelpers } from '../_ai-shared/utils/NodeHelpers';

export class AiDataAnalyst extends BaseAiNode {
	constructor() {
		super({
			name: 'aiDataAnalyst',
			displayName: 'AI Data Analyst',
			description: 'AI-powered data analysis, insights, and visualization recommendations',
			icon: 'file:aidataanalyst.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Data Analyst',
				color: '#FF6B6B',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Analysis Type',
					name: 'analysisType',
					type: 'options',
					options: [
						{ name: 'Descriptive Statistics', value: 'descriptive' },
						{ name: 'Trend Analysis', value: 'trends' },
						{ name: 'Correlation Analysis', value: 'correlation' },
						{ name: 'Anomaly Detection', value: 'anomalies' },
						{ name: 'Predictive Insights', value: 'predictive' },
						{ name: 'Custom Query', value: 'custom' },
					],
					default: 'descriptive',
					description: 'Type of data analysis to perform',
				},
				{
					displayName: 'Data Source',
					name: 'dataSource',
					type: 'options',
					options: [
						{ name: 'Input Data', value: 'input' },
						{ name: 'CSV Content', value: 'csv' },
						{ name: 'JSON Data', value: 'json' },
						{ name: 'Database Query Result', value: 'database' },
					],
					default: 'input',
					description: 'Source of the data to analyze',
				},
				{
					displayName: 'Analysis Query',
					name: 'analysisQuery',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					description: 'Specific question or analysis to perform on the data',
					displayOptions: {
						show: {
							analysisType: ['custom'],
						},
					},
				},
				{
					displayName: 'Data Columns',
					name: 'dataColumns',
					type: 'string',
					default: '',
					description: 'Comma-separated list of columns to focus on (leave empty for all)',
				},
				{
					displayName: 'Output Format',
					name: 'outputFormat',
					type: 'options',
					options: [
						{ name: 'Detailed Report', value: 'report' },
						{ name: 'Summary Only', value: 'summary' },
						{ name: 'JSON Data', value: 'json' },
						{ name: 'Visualization Code', value: 'viz' },
					],
					default: 'report',
					description: 'Format of the analysis output',
				},
				{
					displayName: 'Include Recommendations',
					name: 'includeRecommendations',
					type: 'boolean',
					default: true,
					description: 'Whether to include actionable recommendations',
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
				const analysisType = this.getNodeParameter('analysisType', itemIndex) as string;
				const dataSource = this.getNodeParameter('dataSource', itemIndex) as string;
				const analysisQuery = this.getNodeParameter('analysisQuery', itemIndex, '') as string;
				const dataColumns = this.getNodeParameter('dataColumns', itemIndex, '') as string;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
				const includeRecommendations = this.getNodeParameter(
					'includeRecommendations',
					itemIndex,
				) as boolean;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Extract and prepare data
				let analysisData: any[];
				const currentItem = items[itemIndex];

				switch (dataSource) {
					case 'input':
						analysisData = NodeHelpers.formatInputData([currentItem]);
						break;
					case 'csv':
						const csvContent = NodeHelpers.extractText(currentItem.json);
						analysisData = this.parseCsvData(csvContent);
						break;
					case 'json':
						analysisData = Array.isArray(currentItem.json.data)
							? currentItem.json.data
							: [currentItem.json];
						break;
					default:
						analysisData = [currentItem.json];
				}

				// Filter columns if specified
				if (dataColumns) {
					const columns = dataColumns.split(',').map((col) => col.trim());
					analysisData = analysisData.map((row) => {
						const filteredRow: any = {};
						columns.forEach((col) => {
							if (row[col] !== undefined) {
								filteredRow[col] = row[col];
							}
						});
						return filteredRow;
					});
				}

				// Build analysis request
				const analysisRequest = {
					agent: agentConfig,
					data: analysisData,
					analysisType,
					query: analysisQuery || this.getDefaultQuery(analysisType),
					outputFormat,
					includeRecommendations,
					options: {
						sampleSize: Math.min(analysisData.length, 1000), // Limit for performance
					},
				};

				// Make API request
				const response = await this.makeApiRequest(
					'/api/agents/analyze-data',
					'POST',
					analysisRequest,
				);

				// Format output
				const outputData = {
					analysis: response.analysis,
					insights: response.insights,
					recommendations: response.recommendations,
					statistics: response.statistics,
					visualizations: response.visualizations,
					dataQuality: response.dataQuality,
					metadata: {
						recordCount: analysisData.length,
						analysisType,
						timestamp: new Date().toISOString(),
					},
					usage: response.usage,
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
					NodeHelpers.handleApiError(error, 'AI Data Analyst');
				}
			}
		}

		return [returnData];
	}

	private getDefaultQuery(analysisType: string): string {
		const queries = {
			descriptive: 'Provide descriptive statistics and data overview',
			trends: 'Identify trends and patterns in the data',
			correlation: 'Analyze correlations between variables',
			anomalies: 'Detect anomalies and outliers in the data',
			predictive: 'Generate predictive insights and forecasts',
		};
		return queries[analysisType] || 'Analyze the data and provide insights';
	}

	private parseCsvData(csvContent: string): any[] {
		const lines = csvContent.trim().split('\n');
		if (lines.length < 2) return [];

		const headers = lines[0].split(',').map((h) => h.trim());
		return lines.slice(1).map((line) => {
			const values = line.split(',').map((v) => v.trim());
			const row: any = {};
			headers.forEach((header, index) => {
				row[header] = values[index] || '';
			});
			return row;
		});
	}
}
