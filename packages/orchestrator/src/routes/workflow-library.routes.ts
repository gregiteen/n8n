/**
 * Workflow Library Routes
 * API routes for workflow library management
 */

import { Express, Request, Response } from 'express';
import { getService } from '../services';
import { WorkflowLibraryController } from '../controllers/workflow-library.controller';

/**
 * Configure workflow library routes
 */
export function configureWorkflowLibraryRoutes(app: Express): void {
	// Get the workflow library controller
	const workflowLibraryController = getService(WorkflowLibraryController);

	// Get all workflows in the library
	app.get('/api/workflow-library', async (req: Request, res: Response) => {
		await workflowLibraryController.getAllWorkflows(req, res);
	});

	// Get a specific workflow by ID
	app.get('/api/workflow-library/:id', async (req: Request, res: Response) => {
		await workflowLibraryController.getWorkflow(req, res);
	});

	// Create a new workflow in the library
	app.post('/api/workflow-library', async (req: Request, res: Response) => {
		await workflowLibraryController.createWorkflow(req, res);
	});

	// Update an existing workflow
	app.put('/api/workflow-library/:id', async (req: Request, res: Response) => {
		await workflowLibraryController.updateWorkflow(req, res);
	});

	// Delete a workflow
	app.delete('/api/workflow-library/:id', async (req: Request, res: Response) => {
		await workflowLibraryController.deleteWorkflow(req, res);
	});

	// Execute a workflow from the library
	app.post('/api/workflow-library/:id/execute', async (req: Request, res: Response) => {
		await workflowLibraryController.executeWorkflow(req, res);
	});

	// Get workflows by category
	app.get('/api/workflow-library/category/:category', async (req: Request, res: Response) => {
		req.query.category = req.params.category;
		await workflowLibraryController.getAllWorkflows(req, res);
	});

	// Get workflows by tag
	app.get('/api/workflow-library/tag/:tag', async (req: Request, res: Response) => {
		req.query.tag = req.params.tag;
		await workflowLibraryController.getAllWorkflows(req, res);
	});
}
