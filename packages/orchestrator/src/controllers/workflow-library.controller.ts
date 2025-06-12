/**
 * Workflow Library Controller
 * Provides REST API endpoints for workflow library management
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { Request, Response } from 'express';
import { WorkflowLibraryService } from '../services/workflow-library.service';

@Service()
export class WorkflowLibraryController {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(WorkflowLibraryService) private readonly workflowLibraryService: WorkflowLibraryService,
	) {
		this.logger = this.logger.scoped('workflow-library-controller');
	}

	/**
	 * Get all workflows
	 */
	async getAllWorkflows(req: Request, res: Response): Promise<void> {
		try {
			const category = req.query.category as string;
			const tag = req.query.tag as string;

			let workflows;

			if (category) {
				workflows = this.workflowLibraryService.getWorkflowsByTag(category);
			} else if (tag) {
				workflows = this.workflowLibraryService.getWorkflowsByTag(tag);
			} else {
				workflows = this.workflowLibraryService.getAllWorkflows();
			}

			res.json({
				count: workflows.length,
				workflows,
			});
		} catch (error: any) {
			this.logger.error('Error getting workflows:', error);
			res.status(500).json({ error: error.message || 'Failed to get workflows' });
		}
	}

	/**
	 * Get a specific workflow
	 */
	async getWorkflow(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const workflow = this.workflowLibraryService.getWorkflow(id);

			if (!workflow) {
				res.status(404).json({ error: `Workflow '${id}' not found` });
				return;
			}

			res.json(workflow);
		} catch (error: any) {
			this.logger.error(`Error getting workflow ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to get workflow' });
		}
	}

	/**
	 * Create a new workflow
	 */
	async createWorkflow(req: Request, res: Response): Promise<void> {
		try {
			const { metadata, definition } = req.body;

			if (!metadata || !definition) {
				res.status(400).json({ error: 'Invalid workflow. Must include metadata and definition.' });
				return;
			}

			// Generate an ID if not provided
			if (!metadata.id) {
				metadata.id = `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			}

			// Set timestamps
			metadata.createdAt = new Date();
			metadata.updatedAt = new Date();

			const workflow = { metadata, definition };

			await this.workflowLibraryService.saveWorkflow(workflow);

			res.status(201).json(workflow);
		} catch (error: any) {
			this.logger.error('Error creating workflow:', error);
			res.status(500).json({ error: error.message || 'Failed to create workflow' });
		}
	}

	/**
	 * Update an existing workflow
	 */
	async updateWorkflow(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { metadata, definition } = req.body;

			if (!metadata || !definition) {
				res.status(400).json({ error: 'Invalid workflow. Must include metadata and definition.' });
				return;
			}

			// Check if workflow exists
			const existingWorkflow = this.workflowLibraryService.getWorkflow(id);
			if (!existingWorkflow) {
				res.status(404).json({ error: `Workflow '${id}' not found` });
				return;
			}

			// Ensure ID in the URL matches the ID in the body
			if (metadata.id !== id) {
				res.status(400).json({ error: 'Workflow ID in URL does not match ID in request body' });
				return;
			}

			// Update timestamps
			metadata.createdAt = existingWorkflow.metadata.createdAt;
			metadata.updatedAt = new Date();

			const workflow = { metadata, definition };

			await this.workflowLibraryService.saveWorkflow(workflow);

			res.json(workflow);
		} catch (error: any) {
			this.logger.error(`Error updating workflow ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to update workflow' });
		}
	}

	/**
	 * Delete a workflow
	 */
	async deleteWorkflow(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const result = this.workflowLibraryService.deleteWorkflow(id);

			if (!result) {
				res.status(404).json({ error: `Workflow '${id}' not found` });
				return;
			}

			res.status(204).end();
		} catch (error: any) {
			this.logger.error(`Error deleting workflow ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to delete workflow' });
		}
	}

	/**
	 * Execute a workflow
	 */
	async executeWorkflow(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const parameters = req.body;

			// Check if workflow exists
			const workflow = this.workflowLibraryService.getWorkflow(id);
			if (!workflow) {
				res.status(404).json({ error: `Workflow '${id}' not found` });
				return;
			}

			const result = await this.workflowLibraryService.executeWorkflow(id, parameters);

			res.json({
				workflowId: id,
				workflowName: workflow.metadata.name,
				result,
			});
		} catch (error: any) {
			this.logger.error(`Error executing workflow ${req.params.id}:`, error);
			res.status(500).json({ error: error.message || 'Failed to execute workflow' });
		}
	}

	/**
	 * Search workflows
	 */
	async searchWorkflows(req: Request, res: Response): Promise<void> {
		try {
			const { query } = req.query;

			if (!query || typeof query !== 'string') {
				res.status(400).json({ error: 'Search query is required' });
				return;
			}

			const workflows = this.workflowLibraryService.searchWorkflows(query);

			res.json({
				count: workflows.length,
				query,
				workflows,
			});
		} catch (error: any) {
			this.logger.error(`Error searching workflows:`, error);
			res.status(500).json({ error: error.message || 'Failed to search workflows' });
		}
	}
}
