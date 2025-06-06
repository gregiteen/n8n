// AI Workflow Orchestrator Node - Smart workflow decision making and routing

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { BaseAiNode } from '../_ai-shared/base/BaseAiNode';
import { NodeHelpers } from '../_ai-shared/utils/NodeHelpers';

export class AiWorkflowOrchestrator extends BaseAiNode {
	constructor() {
		super({
			name: 'aiWorkflowOrchestrator',
			displayName: 'AI Workflow Orchestrator',
			description: 'AI-powered workflow decision making and intelligent routing',
			icon: 'file:aiworkflow.svg',
			group: ['transform'],
			version: 1,
			defaults: {
				name: 'AI Workflow Orchestrator',
				color: '#1ABC9C',
			},
			inputs: ['main'],
			outputs: ['main', 'true', 'false'],
			properties: [
				{
					displayName: 'Decision Type',
					name: 'decisionType',
					type: 'options',
					options: [
						{ name: 'Route Data', value: 'route' },
						{ name: 'Approve/Reject', value: 'approve' },
						{ name: 'Prioritize Tasks', value: 'prioritize' },
						{ name: 'Classify Content', value: 'classify' },
						{ name: 'Quality Check', value: 'quality' },
						{ name: 'Custom Logic', value: 'custom' },
					],
					default: 'route',
					description: 'Type of decision to make',
				},
				{
					displayName: 'Decision Criteria',
					name: 'decisionCriteria',
					type: 'string',
					typeOptions: {
						rows: 4,
					},
					default: '',
					required: true,
					description:
						'Criteria for making the decision (e.g., "Route to sales if mentions pricing, to support if mentions issues")',
				},
				{
					displayName: 'Input Field',
					name: 'inputField',
					type: 'string',
					default: '',
					description: 'Specific field to analyze (leave empty to analyze entire input)',
				},
				{
					displayName: 'Output Routing',
					name: 'outputRouting',
					type: 'options',
					options: [
						{ name: 'Single Output', value: 'single' },
						{ name: 'True/False Outputs', value: 'boolean' },
						{ name: 'Multi-path Routing', value: 'multi' },
					],
					default: 'single',
					description: 'How to route the output',
				},
				{
					displayName: 'Route Definitions',
					name: 'routeDefinitions',
					type: 'json',
					default: '[]',
					description:
						'Array of route definitions for multi-path routing (e.g., [{"condition": "urgent", "output": "priority"}, {"condition": "normal", "output": "standard"}])',
					displayOptions: {
						show: {
							outputRouting: ['multi'],
						},
					},
				},
				{
					displayName: 'Confidence Threshold',
					name: 'confidenceThreshold',
					type: 'number',
					typeOptions: {
						minValue: 0,
						maxValue: 1,
						numberStepSize: 0.1,
					},
					default: 0.7,
					description: 'Minimum confidence level for decisions (0-1)',
				},
				{
					displayName: 'Fallback Action',
					name: 'fallbackAction',
					type: 'options',
					options: [
						{ name: 'Continue to Main Output', value: 'continue' },
						{ name: 'Stop Execution', value: 'stop' },
						{ name: 'Manual Review Required', value: 'manual' },
					],
					default: 'continue',
					description: 'Action when confidence is below threshold',
				},
				{
					displayName: 'Include Reasoning',
					name: 'includeReasoning',
					type: 'boolean',
					default: true,
					description: 'Include AI reasoning in the output',
				},
				{
					displayName: 'Learning Mode',
					name: 'learningMode',
					type: 'boolean',
					default: false,
					description: 'Enable learning from decisions to improve accuracy',
				},
			],
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const mainOutput: INodeExecutionData[] = [];
		const trueOutput: INodeExecutionData[] = [];
		const falseOutput: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Validate required parameters
				NodeHelpers.validateRequiredParams(this, ['decisionCriteria'], itemIndex);

				// Get parameters
				const decisionType = this.getNodeParameter('decisionType', itemIndex) as string;
				const decisionCriteria = this.getNodeParameter('decisionCriteria', itemIndex) as string;
				const inputField = this.getNodeParameter('inputField', itemIndex, '') as string;
				const outputRouting = this.getNodeParameter('outputRouting', itemIndex) as string;
				const routeDefinitions = NodeHelpers.safeJsonParse(
					this.getNodeParameter('routeDefinitions', itemIndex, '[]') as string,
					[],
				);
				const confidenceThreshold = this.getNodeParameter(
					'confidenceThreshold',
					itemIndex,
				) as number;
				const fallbackAction = this.getNodeParameter('fallbackAction', itemIndex) as string;
				const includeReasoning = this.getNodeParameter('includeReasoning', itemIndex) as boolean;
				const learningMode = this.getNodeParameter('learningMode', itemIndex) as boolean;
				const agentConfig = NodeHelpers.buildAgentConfig(this, itemIndex);

				// Extract data to analyze
				const currentItem = items[itemIndex];
				let dataToAnalyze: any;

				if (inputField) {
					dataToAnalyze = currentItem.json[inputField];
				} else {
					dataToAnalyze = currentItem.json;
				}

				// Build decision request
				const decisionRequest = {
					agent: agentConfig,
					decisionType,
					criteria: NodeHelpers.cleanText(decisionCriteria),
					data: dataToAnalyze,
					options: {
						outputRouting,
						routeDefinitions,
						confidenceThreshold,
						includeReasoning,
						learningMode,
					},
				};

				// Make API request
				const response = await this.makeApiRequest(
					'/api/agents/make-decision',
					'POST',
					decisionRequest,
				);

				// Build output data
				const outputData = {
					...currentItem.json,
					decision: {
						result: response.decision,
						confidence: response.confidence,
						reasoning: includeReasoning ? response.reasoning : undefined,
						route: response.route,
						timestamp: new Date().toISOString(),
					},
					usage: response.usage,
				};

				// Route output based on decision and configuration
				const confidence = response.confidence || 0;
				const decision = response.decision;

				if (confidence < confidenceThreshold) {
					// Handle low confidence
					outputData.decision.status = 'low_confidence';
					outputData.decision.fallbackAction = fallbackAction;

					switch (fallbackAction) {
						case 'continue':
							mainOutput.push({ json: outputData });
							break;
						case 'manual':
							outputData.decision.requiresManualReview = true;
							mainOutput.push({ json: outputData });
							break;
						case 'stop':
							// Don't add to any output
							break;
					}
				} else {
					// High confidence decision
					outputData.decision.status = 'confident';

					switch (outputRouting) {
						case 'single':
							mainOutput.push({ json: outputData });
							break;

						case 'boolean':
							if (
								decision === true ||
								decision === 'true' ||
								decision === 'yes' ||
								decision === 'approve'
							) {
								trueOutput.push({ json: outputData });
							} else {
								falseOutput.push({ json: outputData });
							}
							break;

						case 'multi':
							// Find matching route
							const matchedRoute = routeDefinitions.find(
								(route) =>
									response.route === route.output ||
									decision.toString().toLowerCase().includes(route.condition.toLowerCase()),
							);

							if (matchedRoute) {
								outputData.decision.matchedRoute = matchedRoute;
							}

							// For multi-routing, always go to main output with route info
							mainOutput.push({ json: outputData });
							break;
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorData = {
						...items[itemIndex].json,
						error: error.message,
						decision: {
							status: 'error',
							timestamp: new Date().toISOString(),
						},
					};
					mainOutput.push({ json: errorData });
				} else {
					NodeHelpers.handleApiError(error, 'AI Workflow Orchestrator');
				}
			}
		}

		// Return outputs based on routing configuration
		const firstItemRouting = this.getNodeParameter('outputRouting', 0, 'single') as string;

		if (firstItemRouting === 'boolean') {
			return [mainOutput, trueOutput, falseOutput];
		} else {
			return [mainOutput];
		}
	}
}
