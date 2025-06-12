/**
 * Workflow Execution Service
 * Handles the execution of workflows via n8n API
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import axios, { AxiosInstance } from 'axios';

/**
 * Interface for workflow execution options
 */
export interface WorkflowExecutionOptions {
	timeout?: number;
	waitForCompletion?: boolean;
	runAsUser?: string;
}

/**
 * Interface for workflow execution result
 */
export interface WorkflowExecutionResult {
	executionId: string;
	finished: boolean;
	data?: any;
	status: 'success' | 'error' | 'running' | 'waiting';
	startedAt: Date;
	finishedAt?: Date;
	error?: {
		message: string;
		stack?: string;
	};
}

/**
 * Service for executing n8n workflows
 */
@Service()
export class WorkflowExecutionService {
	// In single app mode, we'll execute workflows internally instead of using an external API

	constructor(@Inject(Logger) private readonly logger: Logger) {
		this.logger = this.logger.scoped('workflow-execution');
	}

	/**
	 * Execute a workflow by its ID
	 * @param workflowId The ID of the workflow to execute
	 * @param data Input data for the workflow
	 * @param options Execution options
	 */
	async executeWorkflow(
		workflowId: string,
		data: Record<string, any>,
		options: WorkflowExecutionOptions = {},
	): Promise<WorkflowExecutionResult> {
		try {
			this.logger.info(`Executing workflow ${workflowId}`);

			// Generate a unique execution ID
			const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

			// In single app mode, we simulate the execution directly
			// In a real implementation, this would use the local n8n workflow engine

			// Simulate processing time
			const startTime = new Date();
			await new Promise((resolve) => setTimeout(resolve, 1000));

			if (options.waitForCompletion) {
				// Simulate a completed workflow
				return {
					executionId,
					finished: true,
					data,
					status: 'success',
					startedAt: startTime,
					finishedAt: new Date(),
				};
			}

			// Return initial result
			return {
				executionId,
				finished: false,
				status: 'running',
				startedAt: startTime,
			};
		} catch (error: any) {
			this.logger.error(`Error executing workflow ${workflowId}: ${error.message}`);

			// Return error result
			return {
				executionId: '',
				finished: true,
				status: 'error',
				startedAt: new Date(),
				finishedAt: new Date(),
				error: {
					message: error.message,
					stack: error.stack,
				},
			};
		}
	}

	/**
	 * Wait for a workflow execution to complete
	 * @param executionId The ID of the execution to wait for
	 * @param maxRetries Maximum number of polling retries
	 * @param retryDelay Delay between retries in ms
	 */
	async waitForWorkflowCompletion(
		executionId: string,
		maxRetries = 20,
		retryDelay = 1000,
	): Promise<WorkflowExecutionResult> {
		let retries = 0;

		while (retries < maxRetries) {
			try {
				// In single app mode, we simulate polling for workflow completion
				// In a real implementation, this would check the status of the workflow in the local n8n engine

				// Simulate a successful completion after a delay
				await new Promise((resolve) => setTimeout(resolve, retryDelay));

				this.logger.info(`Workflow execution ${executionId} completed with status: success`);

				return {
					executionId,
					finished: true,
					data: { result: `Simulated workflow result for ${executionId}` },
					status: 'success',
					startedAt: new Date(Date.now() - 5000), // 5 seconds ago
					finishedAt: new Date(),
				};
			} catch (error: any) {
				this.logger.error(`Error polling workflow execution ${executionId}: ${error.message}`);

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
				retries++;
			}
		}

		// If we reach here, we've timed out waiting for the workflow
		this.logger.warn(`Timed out waiting for workflow execution ${executionId}`);

		return {
			executionId,
			finished: false,
			status: 'running',
			startedAt: new Date(),
			error: {
				message: 'Timed out waiting for workflow execution to complete',
			},
		};
	}

	/**
	 * Cancel a running workflow execution
	 * @param executionId The ID of the execution to cancel
	 */
	async cancelWorkflowExecution(executionId: string): Promise<boolean> {
		try {
			// In single app mode, we simulate cancellation
			// In a real implementation, this would use the local n8n engine to cancel the workflow
			this.logger.info(`Simulating cancellation of workflow execution ${executionId}`);
			await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay
			return true;
		} catch (error: any) {
			this.logger.error(`Error cancelling workflow execution ${executionId}: ${error.message}`);
			return false;
		}
	}

	/**
	 * Get the details of a workflow execution
	 * @param executionId The ID of the execution to get
	 */
	async getWorkflowExecution(executionId: string): Promise<WorkflowExecutionResult | null> {
		try {
			// In single app mode, we simulate getting workflow execution details
			// In a real implementation, this would get the execution from the local n8n engine
			const isFinished = Math.random() > 0.3; // 70% chance it's finished

			return {
				executionId,
				finished: isFinished,
				data: isFinished ? { result: `Simulated result for ${executionId}` } : undefined,
				status: isFinished ? 'success' : 'running',
				startedAt: new Date(Date.now() - 60000), // Started 1 minute ago
				finishedAt: isFinished ? new Date() : undefined,
			};
		} catch (error: any) {
			this.logger.error(`Error getting workflow execution ${executionId}: ${error.message}`);
			return null;
		}
	}
}
