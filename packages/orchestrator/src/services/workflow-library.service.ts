/**
 * Workflow Library Service
 * Manages saving, retrieving, and executing workflows for AI agents
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { WorkflowExecutionService } from './workflow-execution.service';
import { N8nClient } from './n8n-client';
import * as fs from 'fs';
import * as path from 'path';

export interface WorkflowMetadata {
	id: string;
	name: string;
	description: string;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
	createdBy?: string;
	category?: string;
}

export interface Workflow {
	metadata: WorkflowMetadata;
	definition: any; // The actual workflow definition with nodes and connections
}

@Service()
export class WorkflowLibraryService {
	private workflowsDir: string;
	private workflows: Map<string, Workflow> = new Map();

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(WorkflowExecutionService)
		private readonly workflowExecutionService: WorkflowExecutionService,
		// Will be used in future implementation for direct n8n API integration
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		@Inject(N8nClient) private readonly n8nClient: N8nClient,
	) {
		this.logger = this.logger.scoped('workflow-library');

		// Set up workflows directory
		this.workflowsDir = path.resolve(__dirname, '../../workflows');

		// Create directory if it doesn't exist
		if (!fs.existsSync(this.workflowsDir)) {
			fs.mkdirSync(this.workflowsDir, { recursive: true });
			this.logger.info(`Created workflows directory at ${this.workflowsDir}`);
		}

		// Load existing workflows
		this.loadWorkflows();
	}

	/**
	 * Load workflows from the filesystem
	 */
	private async loadWorkflows(): Promise<void> {
		try {
			this.logger.info('Loading workflows from library');

			// Read workflow files from directory
			const files = fs.readdirSync(this.workflowsDir).filter((file) => file.endsWith('.json'));

			// Load each workflow
			for (const file of files) {
				try {
					const filePath = path.join(this.workflowsDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const workflow = JSON.parse(content);

					// Basic validation
					if (!workflow.metadata || !workflow.metadata.id || !workflow.definition) {
						this.logger.warn(`Invalid workflow format in ${filePath}, skipping`);
						continue;
					}

					// Add to workflows map
					this.workflows.set(workflow.metadata.id, workflow);
					this.logger.debug(`Loaded workflow: ${workflow.metadata.name} (${workflow.metadata.id})`);
				} catch (error) {
					this.logger.error(`Error loading workflow file ${file}:`, { error });
				}
			}

			this.logger.info(`Loaded ${this.workflows.size} workflows from library`);

			// If no workflows exist, create example workflows
			if (this.workflows.size === 0) {
				await this.createExampleWorkflows();
			}
		} catch (error) {
			this.logger.error('Error loading workflows:', { error });
		}
	}

	/**
	 * Create example workflows
	 */
	private async createExampleWorkflows(): Promise<void> {
		this.logger.info('Creating example workflows');

		// Example 1: HTTP Request workflow
		const httpWorkflow = {
			metadata: {
				id: `http-request-${Date.now()}`,
				name: 'HTTP Request',
				description: 'Make HTTP requests to external APIs',
				tags: ['http', 'api', 'request'],
				createdAt: new Date(),
				updatedAt: new Date(),
				category: 'API',
			},
			definition: {
				nodes: [
					{
						name: 'Start',
						type: 'n8n-nodes-base.start',
						position: [100, 300],
					},
					{
						name: 'HTTP Request',
						type: 'n8n-nodes-base.httpRequest',
						position: [300, 300],
						parameters: {
							url: '={{ $parameters.url }}',
							method: '={{ $parameters.method }}',
							headers: '={{ $parameters.headers }}',
							body: '={{ $parameters.body }}',
						},
					},
				],
				connections: {
					Start: {
						main: [
							[
								{
									node: 'HTTP Request',
									type: 'main',
									index: 0,
								},
							],
						],
					},
				},
			},
		};

		// Example 2: Data Processing workflow
		const dataWorkflow = {
			metadata: {
				id: `data-processing-${Date.now()}`,
				name: 'Data Processing',
				description: 'Extract, transform and clean data from various sources',
				tags: ['data', 'processing', 'transformation'],
				createdAt: new Date(),
				updatedAt: new Date(),
				category: 'Data',
			},
			definition: {
				nodes: [
					{
						name: 'Start',
						type: 'n8n-nodes-base.start',
						position: [100, 300],
					},
					{
						name: 'CSV Parse',
						type: 'n8n-nodes-base.spreadsheetFile',
						position: [300, 300],
						parameters: {
							options: {
								read: true,
								includeEmpty: true,
							},
							sourceData: 'string',
							string: '={{ $parameters.data }}',
						},
					},
					{
						name: 'Set',
						type: 'n8n-nodes-base.set',
						position: [500, 300],
						parameters: {
							values: {
								number: [
									{
										name: 'total',
										value: '={{ $node["CSV Parse"].json.length }}',
									},
								],
								string: [
									{
										name: 'summary',
										value: '={{ "Processed " + $node["CSV Parse"].json.length + " records" }}',
									},
								],
							},
						},
					},
				],
				connections: {
					Start: {
						main: [
							[
								{
									node: 'CSV Parse',
									type: 'main',
									index: 0,
								},
							],
						],
					},
					'CSV Parse': {
						main: [
							[
								{
									node: 'Set',
									type: 'main',
									index: 0,
								},
							],
						],
					},
				},
			},
		};

		// Save the example workflows
		await this.saveWorkflow(httpWorkflow);
		await this.saveWorkflow(dataWorkflow);
	}

	/**
	 * Get all workflows in the library
	 */
	getAllWorkflows(): WorkflowMetadata[] {
		return Array.from(this.workflows.values()).map((workflow) => workflow.metadata);
	}

	/**
	 * Get workflows by tags or category
	 */
	getWorkflowsByTag(tag: string): WorkflowMetadata[] {
		return Array.from(this.workflows.values())
			.filter(
				(workflow) =>
					workflow.metadata.tags.includes(tag.toLowerCase()) ||
					workflow.metadata.category?.toLowerCase() === tag.toLowerCase(),
			)
			.map((workflow) => workflow.metadata);
	}

	/**
	 * Get a workflow by ID
	 */
	getWorkflow(id: string): Workflow | undefined {
		return this.workflows.get(id);
	}

	/**
	 * Save a new or updated workflow
	 */
	async saveWorkflow(workflow: Workflow): Promise<void> {
		try {
			// Ensure workflow has required fields
			if (!workflow.metadata || !workflow.metadata.id || !workflow.definition) {
				throw new Error('Invalid workflow format');
			}

			// Update timestamps
			workflow.metadata.updatedAt = new Date();

			// Save to map
			this.workflows.set(workflow.metadata.id, workflow);

			// Save to file
			const filePath = path.join(this.workflowsDir, `${workflow.metadata.id}.json`);
			fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');

			this.logger.info(`Saved workflow: ${workflow.metadata.name} (${workflow.metadata.id})`);
		} catch (error) {
			this.logger.error(`Error saving workflow:`, { error });
			throw error;
		}
	}

	/**
	 * Delete a workflow
	 */
	deleteWorkflow(id: string): boolean {
		try {
			// Remove from map
			if (!this.workflows.has(id)) {
				return false;
			}

			// Get name for logging
			const name = this.workflows.get(id)?.metadata.name || id;

			this.workflows.delete(id);

			// Remove file
			const filePath = path.join(this.workflowsDir, `${id}.json`);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}

			this.logger.info(`Deleted workflow: ${name} (${id})`);
			return true;
		} catch (error) {
			this.logger.error(`Error deleting workflow ${id}:`, { error });
			return false;
		}
	}

	/**
	 * Execute a workflow from the library
	 */
	async executeWorkflow(id: string, parameters: Record<string, any>): Promise<any> {
		try {
			// Get workflow
			const workflow = this.workflows.get(id);
			if (!workflow) {
				throw new Error(`Workflow not found: ${id}`);
			}

			this.logger.info(`Executing workflow: ${workflow.metadata.name} (${id})`);

			// Convert library workflow to format needed by execution service
			// Create executable workflow format - this will be used in a future implementation
			/*const executableWorkflow = {
        id: workflow.metadata.id,
        name: workflow.metadata.name,
        nodes: workflow.definition.nodes,
        connections: workflow.definition.connections
      };*/

			// Execute using workflow execution service
			const result = await this.workflowExecutionService.executeWorkflow(
				workflow.metadata.id,
				{ parameters },
				{ waitForCompletion: true },
			);

			return result;
		} catch (error) {
			this.logger.error(`Error executing workflow ${id}:`, { error });
			throw error;
		}
	}

	/**
	 * Search for workflows
	 */
	searchWorkflows(query: string): WorkflowMetadata[] {
		const lowerQuery = query.toLowerCase();

		return Array.from(this.workflows.values())
			.filter((workflow) => {
				const metadata = workflow.metadata;
				return (
					metadata.name.toLowerCase().includes(lowerQuery) ||
					metadata.description.toLowerCase().includes(lowerQuery) ||
					metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
					metadata.category?.toLowerCase().includes(lowerQuery)
				);
			})
			.map((workflow) => workflow.metadata);
	}
}
