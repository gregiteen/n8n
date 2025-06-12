/**
 * Task Executor Service
 * Handles the execution of different task types
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { WorkflowExecutionService } from './workflow-execution.service';
import { Task, TaskExecutorFn, TaskType } from './task-types';

@Service()
export class TaskExecutorService {
	private taskExecutors: Map<string, TaskExecutorFn> = new Map();

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(WorkflowExecutionService)
		private readonly workflowExecutionService: WorkflowExecutionService,
	) {
		this.logger = this.logger.scoped('task-executor');
		this.initializeTaskExecutors();
	}

	/**
	 * Initialize task executors for different task types
	 */
	private initializeTaskExecutors(): void {
		// Register workflow task executor
		this.registerTaskExecutor(TaskType.WORKFLOW, this.executeWorkflowTask.bind(this));
		// Other task types can be registered here
	}

	/**
	 * Register a task executor function for a specific task type
	 */
	registerTaskExecutor(taskType: string, executor: TaskExecutorFn): void {
		this.taskExecutors.set(taskType, executor);
	}

	/**
	 * Get executor for a specific task type
	 */
	getExecutor(taskType: string): TaskExecutorFn | undefined {
		return this.taskExecutors.get(taskType);
	}

	/**
	 * Execute a task with the appropriate executor
	 */
	async executeTask(task: Task): Promise<any> {
		const executor = this.taskExecutors.get(task.taskType);
		if (!executor) {
			throw new Error(`No executor found for task type: ${task.taskType}`);
		}

		try {
			return await executor(task);
		} catch (error: any) {
			this.logger.error(
				`Error executing task ${task.id} of type ${task.taskType}: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * Execute a workflow task
	 */
	private async executeWorkflowTask(task: Task): Promise<any> {
		this.logger.info(`Executing workflow task: ${task.id}, workflow: ${task.workflowId}`);

		if (!task.workflowId) {
			throw new Error('Workflow ID is required for workflow tasks');
		}

		try {
			// Execute the workflow
			const result = await this.workflowExecutionService.executeWorkflow(
				task.workflowId,
				task.input || {},
				{ waitForCompletion: true },
			);

			if (result.status === 'error') {
				throw new Error(result.error?.message || 'Workflow execution failed');
			}

			return result.data;
		} catch (error: any) {
			this.logger.error(`Error executing workflow task: ${error.message}`);
			throw error;
		}
	}
}
