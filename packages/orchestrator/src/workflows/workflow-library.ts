export interface WorkflowTemplate {
	id: string;
	name: string;
	description: string;
	category: 'ai-agents' | 'data-processing' | 'automation' | 'integration';
	tags: string[];
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedTime: string;
	template: any; // n8n workflow JSON
	requiredCredentials: string[];
	agentTypes?: AgentType[];
	metadata: {
		version: string;
		author: string;
		lastUpdated: Date;
		usageCount: number;
		rating: number;
	};
}

export interface AgentType {
	type: 'conversational' | 'web-browsing' | 'workflow' | 'data-analysis' | 'function-calling';
	modelProvider: 'openai' | 'anthropic' | 'gemini';
	description: string;
}

export interface WorkflowLibraryFilters {
	category?: WorkflowTemplate['category'];
	difficulty?: WorkflowTemplate['difficulty'];
	tags?: string[];
	agentTypes?: string[];
	searchTerm?: string;
}

export class WorkflowLibrary {
	private templates: Map<string, WorkflowTemplate> = new Map();

	constructor() {
		this.initializeDefaultTemplates();
	}

	/**
	 * Get all workflow templates with optional filtering
	 */
	getTemplates(filters?: WorkflowLibraryFilters): WorkflowTemplate[] {
		let templates = Array.from(this.templates.values());

		if (filters) {
			if (filters.category) {
				templates = templates.filter((t) => t.category === filters.category);
			}
			if (filters.difficulty) {
				templates = templates.filter((t) => t.difficulty === filters.difficulty);
			}
			if (filters.tags && filters.tags.length > 0) {
				templates = templates.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)));
			}
			if (filters.agentTypes && filters.agentTypes.length > 0) {
				templates = templates.filter((t) =>
					t.agentTypes?.some((at) => filters.agentTypes!.includes(at.type)),
				);
			}
			if (filters.searchTerm) {
				const term = filters.searchTerm.toLowerCase();
				templates = templates.filter(
					(t) =>
						t.name.toLowerCase().includes(term) ||
						t.description.toLowerCase().includes(term) ||
						t.tags.some((tag) => tag.toLowerCase().includes(term)),
				);
			}
		}

		return templates.sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Get a specific template by ID
	 */
	getTemplate(id: string): WorkflowTemplate | undefined {
		return this.templates.get(id);
	}

	/**
	 * Add a new template to the library
	 */
	addTemplate(template: WorkflowTemplate): void {
		this.templates.set(template.id, template);
	}

	/**
	 * Update an existing template
	 */
	updateTemplate(id: string, updates: Partial<WorkflowTemplate>): boolean {
		const template = this.templates.get(id);
		if (!template) return false;

		const updatedTemplate = { ...template, ...updates };
		updatedTemplate.metadata.lastUpdated = new Date();
		this.templates.set(id, updatedTemplate);
		return true;
	}

	/**
	 * Remove a template from the library
	 */
	removeTemplate(id: string): boolean {
		return this.templates.delete(id);
	}

	/**
	 * Get templates by category
	 */
	getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
		return this.getTemplates({ category });
	}

	/**
	 * Get featured/popular templates
	 */
	getFeaturedTemplates(limit: number = 10): WorkflowTemplate[] {
		return Array.from(this.templates.values())
			.sort((a, b) => {
				// Sort by rating and usage count
				const scoreA = a.metadata.rating * 0.7 + (a.metadata.usageCount / 100) * 0.3;
				const scoreB = b.metadata.rating * 0.7 + (b.metadata.usageCount / 100) * 0.3;
				return scoreB - scoreA;
			})
			.slice(0, limit);
	}

	/**
	 * Increment usage count for a template
	 */
	trackUsage(id: string): void {
		const template = this.templates.get(id);
		if (template) {
			template.metadata.usageCount++;
			this.templates.set(id, template);
		}
	}

	/**
	 * Initialize default workflow templates
	 */
	private initializeDefaultTemplates(): void {
		const defaultTemplates: WorkflowTemplate[] = [
			{
				id: 'customer-support-agent',
				name: 'Customer Support AI Agent',
				description:
					'An intelligent customer support agent that can handle common queries, escalate complex issues, and maintain conversation context.',
				category: 'ai-agents',
				tags: ['customer-service', 'support', 'conversational', 'escalation'],
				difficulty: 'beginner',
				estimatedTime: '15 minutes',
				requiredCredentials: ['aiOrchestratorApi'],
				agentTypes: [
					{
						type: 'conversational',
						modelProvider: 'openai',
						description: 'GPT-4 powered conversational agent with support knowledge base',
					},
				],
				template: {
					// n8n workflow JSON would go here
					nodes: [],
					connections: {},
				},
				metadata: {
					version: '1.0.0',
					author: 'AI Orchestrator Team',
					lastUpdated: new Date(),
					usageCount: 0,
					rating: 4.8,
				},
			},
			{
				id: 'data-analysis-pipeline',
				name: 'AI Data Analysis Pipeline',
				description:
					'Automated data analysis workflow that processes CSV files, generates insights, and creates visualizations using AI.',
				category: 'data-processing',
				tags: ['data-analysis', 'csv', 'insights', 'automation'],
				difficulty: 'intermediate',
				estimatedTime: '30 minutes',
				requiredCredentials: ['aiOrchestratorApi'],
				agentTypes: [
					{
						type: 'data-analysis',
						modelProvider: 'anthropic',
						description: 'Claude-powered data analysis with statistical insights',
					},
				],
				template: {
					nodes: [],
					connections: {},
				},
				metadata: {
					version: '1.0.0',
					author: 'AI Orchestrator Team',
					lastUpdated: new Date(),
					usageCount: 0,
					rating: 4.6,
				},
			},
			{
				id: 'web-research-agent',
				name: 'Web Research Agent',
				description:
					'An AI agent that can browse the web, research topics, and compile comprehensive reports.',
				category: 'ai-agents',
				tags: ['research', 'web-browsing', 'reports', 'information-gathering'],
				difficulty: 'advanced',
				estimatedTime: '45 minutes',
				requiredCredentials: ['aiOrchestratorApi'],
				agentTypes: [
					{
						type: 'web-browsing',
						modelProvider: 'gemini',
						description: 'Gemini-powered web browsing agent with research capabilities',
					},
				],
				template: {
					nodes: [],
					connections: {},
				},
				metadata: {
					version: '1.0.0',
					author: 'AI Orchestrator Team',
					lastUpdated: new Date(),
					usageCount: 0,
					rating: 4.9,
				},
			},
			{
				id: 'function-calling-integration',
				name: 'Function Calling Integration',
				description:
					'AI agent with custom function calling capabilities for complex integrations and automations.',
				category: 'integration',
				tags: ['function-calling', 'integration', 'api', 'automation'],
				difficulty: 'advanced',
				estimatedTime: '60 minutes',
				requiredCredentials: ['aiOrchestratorApi'],
				agentTypes: [
					{
						type: 'function-calling',
						modelProvider: 'openai',
						description: 'GPT-4 with custom function definitions for external API calls',
					},
				],
				template: {
					nodes: [],
					connections: {},
				},
				metadata: {
					version: '1.0.0',
					author: 'AI Orchestrator Team',
					lastUpdated: new Date(),
					usageCount: 0,
					rating: 4.7,
				},
			},
		];

		defaultTemplates.forEach((template) => {
			this.templates.set(template.id, template);
		});
	}
}

// Export singleton instance
export const workflowLibrary = new WorkflowLibrary();
