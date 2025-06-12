/**
 * Task Error Handler Service
 * Integrates with the ErrorRecoveryService to handle task errors and retries
 */

import { Service, Inject } from '../../di';
import { Logger } from '../../logger';
import { ErrorRecoveryService, RecoveryConfig } from '../../error-handling/error-recovery';
import { Task, TaskStatus } from './task-types';
import { TaskStateManagerService } from './task-state-manager.service';

@Service()
export class TaskErrorHandlerService {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(ErrorRecoveryService) private readonly errorRecoveryService: ErrorRecoveryService,
		@Inject(TaskStateManagerService)
		private readonly taskStateManagerService: TaskStateManagerService,
	) {
		this.logger = this.logger.scoped('task-error-handler');
	}

	/**
	 * Create recovery config from task configuration or use defaults
	 */
	createRetryConfig(task: Task): RecoveryConfig {
		return {
			maxRetries: task.maxRetries,
			initialDelay: task.retryConfig?.initialDelay || 1000,
			maxDelay: task.retryConfig?.maxDelay || 30000,
			backoffFactor: task.retryConfig?.backoffFactor || 2,
			fallbackFunction: task.retryConfig?.fallbackFunction,
			notifyFunction: task.retryConfig?.notifyFunction,
		};
	}

	/**
	 * Handle task error and determine retry strategy.
	 * This method is called by handleExecution or directly if an error occurs outside direct execution.
	 */
	async handleTaskError(
		task: Task,
		error: Error,
		currentRetryCount: number,
	): Promise<{
		shouldRetry: boolean;
		retryDelay?: number;
		status: TaskStatus;
		errorMessage?: string;
		fallbackResult?: any;
		errorType: string;
	}> {
		const recoveryConfig = this.createRetryConfig(task);
		const errorRecoveryResult = await this.errorRecoveryService.handleTaskError(
			task,
			error,
			currentRetryCount,
			recoveryConfig,
		);
		const errorType = this.errorRecoveryService.classifyError(error).toString();

		return {
			...errorRecoveryResult,
			errorType,
		};
	}

	/**
	 * Record a successful task completion for circuit breaking purposes
	 */
	recordTaskSuccess(task: Task, previousErrorType?: string): void {
		if (previousErrorType) {
			const errorType = previousErrorType as any;
			this.errorRecoveryService.recordTaskSuccess(task, errorType);
		}
	}

	/**
	 * Prepares a task for a retry attempt.
	 * Updates task status, increments retry count, and clears previous error.
	 */
	async prepareTaskForRetry(taskId: string): Promise<Task | null> {
		const task = this.taskStateManagerService.getTaskById(taskId);
		if (!task) {
			this.logger.warn(`Task with ID ${taskId} not found for retry preparation.`);
			return null;
		}

		const updatedTaskData = {
			status: TaskStatus.QUEUED,
			retries: task.retries + 1,
			error: undefined, // Clear previous error
			// startedAt: undefined, // Optionally clear startedAt
			// completedAt: undefined, // Optionally clear completedAt
		};
		this.taskStateManagerService.updateTask(taskId, updatedTaskData);
		return { ...task, ...updatedTaskData };
	}

	/**
	 * Handles the execution of a task, including error handling and retries.
	 * This is the primary method called by TaskQueueService to process a task.
	 * @deprecated Use handleExecutionError for error-specific handling within TaskQueueService.processTaskInstance
	 */
	async handleExecution(task: Task, executionPromise: Promise<any>): Promise<void> {
		let currentErrorType: string | undefined;
		try {
			this.logger.debug(`Starting execution for task ${task.id}`);
			this.taskStateManagerService.setTaskRunning(task.id);
			const result = await executionPromise;
			this.taskStateManagerService.setTaskCompleted(task.id, { result });
			this.recordTaskSuccess(task, currentErrorType);
			this.logger.info(`Task ${task.id} completed successfully.`);
		} catch (error: any) {
			this.logger.error(`Error executing task ${task.id}: ${error.message}`, {
				error,
				taskId: task.id,
			});

			const errorResult = await this.handleTaskError(task, error, task.retries);
			currentErrorType = errorResult.errorType;

			if (errorResult.shouldRetry && errorResult.retryDelay !== undefined) {
				this.logger.info(
					`Task ${task.id} will be retried. Delay: ${errorResult.retryDelay}ms. Retries: ${task.retries + 1}`,
				);
				this.taskStateManagerService.updateTask(task.id, {
					status: TaskStatus.QUEUED,
					error: errorResult.errorMessage || error.message,
				});
			} else {
				this.logger.error(
					`Task ${task.id} failed permanently or fallback executed. Status: ${errorResult.status}`,
				);
				this.taskStateManagerService.setTaskFailed(task.id, {
					error: errorResult.errorMessage || error.message,
					result: errorResult.fallbackResult,
				});
			}
		}
	}

	/**
	 * Handles an error that occurred during task execution.
	 * It determines if the task should be retried, updates its state accordingly (FAILED or QUEUED for retry),
	 * and returns the effective status of this execution attempt for metrics purposes.
	 */
	async handleExecutionError(task: Task, error: Error): Promise<TaskStatus> {
		this.logger.error(`Error executing task ${task.id}: ${error.message}`, {
			error,
			taskId: task.id,
		});

		const errorResult = await this.handleTaskError(task, error, task.retries);
		// currentErrorType = errorResult.errorType; // This might be useful if we need to record it somewhere

		if (errorResult.shouldRetry && errorResult.retryDelay !== undefined) {
			this.logger.info(
				`Task ${task.id} will be retried. Delay: ${errorResult.retryDelay}ms. Retries: ${task.retries + 1}`,
			);
			// prepareTaskForRetry will set it to QUEUED and increment retries
			await this.prepareTaskForRetry(task.id);
			// For metrics, this execution attempt is considered as leading to a FAILED (for now, will be retried)
			// or a more specific status like RETRYING if we had one.
			// Since it didn't complete successfully, FAILED is appropriate for this attempt's metric.
			return TaskStatus.FAILED; // Or a new status like TaskStatus.RETRYING_ATTEMPT_FAILED
		} else {
			this.logger.error(
				`Task ${task.id} failed permanently or fallback executed. Status: ${errorResult.status}`,
			);
			this.taskStateManagerService.setTaskFailed(task.id, {
				error: errorResult.errorMessage || error.message,
				result: errorResult.fallbackResult,
			});
			return errorResult.status; // This will typically be FAILED or CANCELLED if fallback led to cancellation
		}
	}
}
