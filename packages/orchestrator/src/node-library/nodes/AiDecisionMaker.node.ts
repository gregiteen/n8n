// AI Decision Maker Node - Smart decision support system

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { BaseAiNode } from '../base/BaseAiNode';
import { NodeHelpers } from '../utils/NodeHelpers';

export class AiDecisionMaker extends BaseAiNode {
	constructor() {
		super({
			name: 'aiDecisionMaker',
			displayName: 'AI Decision Maker',
			description: 'AI-powered decision support with multi-criteria analysis',
			icon: 'file:aidecision.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Decision Maker',
				color: '#8E44AD',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Decision Context',
					name: 'decisionContext',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					default: '',
					required: true,
					description: 'Context and background for the decision to be made',
				},
				{
					displayName: 'Decision Options',
					name: 'decisionOptions',
					type: 'json',
					default: '[]',
					description:
						'Array of options to choose from (e.g., ["Option A", "Option B", "Option C"])',
				},
				{
					displayName: 'Evaluation Criteria',
					name: 'evaluationCriteria',
					type: 'json',
					default: '[]',
					description: 'Criteria for evaluation (e.g., ["cost", "time", "quality", "risk"])',
				},
				{
					displayName: 'Weights',
					name: 'criteriaWeights',
					type: 'json',
					default: '{}',
					description:
						'Weights for criteria (e.g., {"cost": 0.3, "time": 0.2, "quality": 0.4, "risk": 0.1})',
				},
				{
					displayName: 'Risk Tolerance',
					name: 'riskTolerance',
					type: 'options',
					options: [
						{ name: 'Low Risk', value: 'low' },
						{ name: 'Medium Risk', value: 'medium' },
						{ name: 'High Risk', value: 'high' },
					],
					default: 'medium',
					description: 'Risk tolerance level for decision making',
				},
				{
					displayName: 'Time Horizon',
					name: 'timeHorizon',
					type: 'options',
					options: [
						{ name: 'Immediate', value: 'immediate' },
						{ name: 'Short Term (1-3 months)', value: 'short' },
						{ name: 'Medium Term (3-12 months)', value: 'medium' },
						{ name: 'Long Term (1+ years)', value: 'long' },
					],
					default: 'medium',
					description: 'Time horizon for the decision impact',
				},
				{
					displayName: 'Include Pros/Cons',
					name: 'includeProsCons',
					type: 'boolean',
					default: true,
					description: 'Include pros and cons analysis for each option',
				},
				{
					displayName: 'Include Risk Analysis',
					name: 'includeRiskAnalysis',
					type: 'boolean',
					default: true,
					description: 'Include risk analysis and mitigation strategies',
				},
				{
					displayName: 'Alternative Solutions',
					name: 'suggestAlternatives',
					type: 'boolean',
					default: false,
					description: 'Ask AI to suggest alternative solutions not in the original options',
				},
				{
					displayName: 'Confidence Requirement',
					name: 'confidenceRequirement',
					type: 'number',
					typeOptions: {
						minValue: 0,
						maxValue: 1,
						numberStepSize: 0.1,
					},
					default: 0.7,
					description: 'Minimum confidence level required for recommendation',
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
				NodeHelpers.validateRequiredParams(this, ['decisionContext'], itemIndex);

				// Get parameters
				const decisionContext = this.getNodeParameter('decisionContext', itemIndex) as string;
				const decisionOptions = NodeHelpers.safeJsonParse(
					this.getNodeParameter('decisionOptions', itemIndex, '[]') as string,
					[],
				);
				const evaluationCriteria = NodeHelpers.safeJsonParse(
					this.getNodeParameter('evaluationCriteria', itemIndex, '[]') as string,
					[],
				);
				const criteriaWeights = NodeHelpers.safeJsonParse(
					this.getNodeParameter('criteriaWeights', itemIndex, '{}') as string,
					{},
				);
				const riskTolerance = this.getNodeParameter('riskTolerance', itemIndex) as string;
				const timeHorizon = this.getNodeParameter('timeHorizon', itemIndex) as string;
				const includeProsCons = this.getNodeParameter('includeProsCons', itemIndex) as boolean;
				const includeRiskAnalysis = this.getNodeParameter(
					'includeRiskAnalysis',
					itemIndex,
				) as boolean;
				const suggestAlternatives = this.getNodeParameter(
					'suggestAlternatives',
					itemIndex,
				) as boolean;
				const confidenceRequirement = this.getNodeParameter(
					'confidenceRequirement',
					itemIndex,
				) as number;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Include input data as additional context
				const inputContext = items[itemIndex].json;

				// Build decision analysis request
				const decisionRequest = {
					agent: agentConfig,
					context: NodeHelpers.cleanText(decisionContext),
					options: decisionOptions,
					criteria: evaluationCriteria,
					weights: criteriaWeights,
					preferences: {
						riskTolerance,
						timeHorizon,
					},
					analysis: {
						includeProsCons,
						includeRiskAnalysis,
						suggestAlternatives,
						confidenceRequirement,
					},
					inputData: inputContext,
				};

				// Make API request
				const response = await this.helpers.request({
					method: 'POST',
					url: '/api/agents/make-decision-analysis',
					body: decisionRequest,
					json: true,
				});

				// Format comprehensive output
				const outputData: any = {
					decisionAnalysis: {
						context: decisionContext,
						recommendedOption: response.recommendation,
						confidence: response.confidence,
						reasoning: response.reasoning,
						timestamp: new Date().toISOString(),
					},
					options: response.optionsAnalysis || [],
					evaluation: response.evaluation || {},
					usage: response.usage,
				};

				// Add detailed analysis components
				if (response.prosCons && includeProsCons) {
					outputData.prosConsAnalysis = response.prosCons;
				}

				if (response.riskAnalysis && includeRiskAnalysis) {
					outputData.riskAnalysis = response.riskAnalysis;
					outputData.mitigationStrategies = response.mitigation;
				}

				if (response.alternatives && suggestAlternatives) {
					outputData.alternativeSolutions = response.alternatives;
				}

				if (response.criteriaScores) {
					outputData.criteriaScores = response.criteriaScores;
				}

				if (response.sensitivityAnalysis) {
					outputData.sensitivityAnalysis = response.sensitivityAnalysis;
				}

				// Add confidence assessment
				outputData.confidenceAssessment = {
					meetsRequirement: response.confidence >= confidenceRequirement,
					confidenceLevel: response.confidence,
					requirement: confidenceRequirement,
					status: response.confidence >= confidenceRequirement ? 'confident' : 'uncertain',
				};

				// Add implementation guidance if available
				if (response.implementation) {
					outputData.implementationGuidance = response.implementation;
				}

				// Include original input data
				outputData.originalInput = inputContext;

				returnData.push({
					json: outputData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							decisionContext: this.getNodeParameter('decisionContext', itemIndex, ''),
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					NodeHelpers.handleApiError(error, 'AI Decision Maker');
				}
			}
		}

		return [returnData];
	}
}
