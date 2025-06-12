/**
 * Task Queue Management Service
 * Handles task scheduling, prioritization, resource allocation, and error recovery
 */

import { Service, Inject } from '../../di';
import { Logger } from '../../logger';
import { nanoid } from 'nanoid';
import PQueue from 'p-queue';
import {
	TaskStateManagerService,
	TaskExecutorService,
	TaskMetricsService,
	TaskErrorHandlerService,
} from '.'; // Assuming barrel file exports
import {
	Task,
	CreateTaskRequest,
	UpdateTaskRequest,
	TaskStatus,
	TaskPriority,
	TaskQueueStats,
	TaskEventListener,
} from './task-types';

// Interface for system resources
interface SystemResources {
	availableCpu: number; // Available CPU percentage
	availableMemory: number; // Available memory in MB
	maxConcurrentTasks: number; // Maximum number of concurrent tasks
}

@Service()
export class TaskQueueService {
	// Configure system resources
	private systemResources: SystemResources = {
		availableCpu: 100,
		availableMemory: 8192, // 8GB default
		maxConcurrentTasks: 5, // Default max concurrent tasks
	};

	// Task event emitter
	// private eventEmitter = new EventEmitter(); // Moved to TaskStateManagerService

	// Priority-based task processing queue with concurrency control
	private taskQueue: PQueue;

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(TaskStateManagerService)
		private readonly taskStateManagerService: TaskStateManagerService,
		@Inject(TaskExecutorService) private readonly taskExecutorService: TaskExecutorService,
		@Inject(TaskMetricsService) private readonly taskMetricsService: TaskMetricsService,
		@Inject(TaskErrorHandlerService)
		private readonly taskErrorHandlerService: TaskErrorHandlerService,
	) {
		this.logger = this.logger.scoped('task-queue-service'); // Changed scope name for clarity
		this.taskQueue = new PQueue({
			concurrency: this.systemResources.maxConcurrentTasks,
			autoStart: true,
		});

		// Listen for task state changes to trigger scheduling
		this.taskStateManagerService.on('task.created', () => this.scheduleTaskProcessing());
		this.taskStateManagerService.on('task.requeued', () => this.scheduleTaskProcessing());
		this.taskStateManagerService.on('task.retried', () => this.scheduleTaskProcessing()); // Assuming prepareTaskForRetry emits this or similar

		// Initial scheduling attempt
		this.scheduleTaskProcessing();
	}

	/**
	 * Register a task executor function for a specific task type
	 */
	registerTaskExecutor(taskType: string, executor: (task: Task) => Promise<any>): void {
		this.taskExecutorService.registerTaskExecutor(taskType, executor);
	}

	/**
	 * Create a new task and add it to the queue
	 */
	async createTask(request: CreateTaskRequest, userId: string): Promise<Task> {
		const now = new Date();
		const task: Task = {
			id: nanoid(),
			userId,
			name: request.name,
			description: request.description,
			taskType: request.taskType,
			status: TaskStatus.QUEUED,
			priority: request.priority ?? TaskPriority.MEDIUM,
			createdAt: now,
			updatedAt: now,
			progress: 0,
			resources: request.resources,
			agentId: request.agentId,
			workflowId: request.workflowId,
			parentTaskId: request.parentTaskId,
			retries: 0,
			maxRetries: request.maxRetries ?? 3,
			retryConfig: request.retryConfig,
			input: request.input,
			metadata: request.metadata || {},
		};

		this.taskStateManagerService.addTask(task);
		this.taskMetricsService.trackTaskQueued(task.id); // Changed from trackTaskWaitStart

		this.logger.info(`Task ${task.id} created and queued`);
		return task;
	}

	/**
	 * Get all tasks
	 */
	getAllTasks(): Task[] {
		return this.taskStateManagerService.getAllTasks();
	}

	/**
	 * Get task by ID
	 */
	getTaskById(taskId: string): Task | undefined {
		return this.taskStateManagerService.getTaskById(taskId);
	}

	/**
	 * Get tasks by status
	 */
	getTasksByStatus(status: TaskStatus): Task[] {
		return this.taskStateManagerService.getTasksByStatus(status);
	}

	/**
	 * Get tasks by type
	 */
	getTasksByType(taskType: string): Task[] {
		return this.taskStateManagerService.getTasksByType(taskType);
	}

	/**
	 * Get tasks by user ID
	 */
	getTasksByUserId(userId: string): Task[] {
		return this.taskStateManagerService.getTasksByUserId(userId);
	}

	/**
	 * Update task
	 */
	async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
		// Validation and retrieval logic might be in TaskStateManagerService
		const updatedTask = await this.taskStateManagerService.updateTask(taskId, updates);
		if (!updatedTask) {
			throw new Error(`Task ${taskId} not found or update failed`);
		}
		return updatedTask;
	}

	/**
	 * Pause a task
	 */
	async pauseTask(taskId: string): Promise<Task> {
		return this.taskStateManagerService.updateTaskStatus(taskId, TaskStatus.PAUSED);
	}

	/**
	 * Resume a task
	 */
	async resumeTask(taskId: string): Promise<Task> {
		const task = await this.taskStateManagerService.updateTaskStatus(taskId, TaskStatus.QUEUED);
		// scheduleTaskProcessing will be called by the 'task.requeued' event listener
		return task;
	}

	/**
	 * Cancel a task
	 */
	async cancelTask(taskId: string): Promise<Task> {
		// Additional logic for running tasks (e.g., signaling cancellation) might be needed here or in TaskStateManagerService
		const task = this.taskStateManagerService.getTaskById(taskId);
		if (task && task.status === TaskStatus.RUNNING) {
			this.taskStateManagerService.emitTaskEvent('task.cancel', task); // For potential external listeners/handlers
			// Actual cancellation of the running promise might be complex and depend on executor cooperation
		}
		return this.taskStateManagerService.updateTaskStatus(taskId, TaskStatus.CANCELLED);
	}

	/**
	 * Retry a failed task
	 */
	async retryTask(taskId: string): Promise<Task> {
		const task = await this.taskErrorHandlerService.prepareTaskForRetry(taskId);
		if (task) {
			// The prepareTaskForRetry should ideally lead to a state update in TaskStateManagerService
			// that emits an event like 'task.requeued' or 'task.retried' which then triggers scheduling.
			// If prepareTaskForRetry itself updates the task to QUEUED via TaskStateManagerService,
			// and TaskStateManagerService emits 'task.requeued' or 'task.status.changed' (if QUEUED is new),
			// then the event listener will pick it up.
			this.taskStateManagerService.emitTaskEvent('task.retried', task); // Ensure event is emitted if not done by prepareTaskForRetry
			// scheduleTaskProcessing will be called by the event listener
		}
		if (!task) throw new Error(`Task ${taskId} could not be prepared for retry.`);
		return task;
	}

	/**
	 * Delete a task
	 */
	async deleteTask(taskId: string): Promise<void> {
		const task = this.taskStateManagerService.getTaskById(taskId);
		if (task && task.status === TaskStatus.RUNNING) {
			await this.cancelTask(taskId); // Attempt to cancel if running
		}
		await this.taskStateManagerService.deleteTask(taskId);
		if (task) {
			this.taskStateManagerService.emitTaskEvent('task.deleted', task);
		}
	}

	/**
	 * Update task progress
	 */
	async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
		return this.taskStateManagerService.updateTask(taskId, { progress });
	}

	/**
	 * Get queue statistics
	 */
	getQueueStats(): TaskQueueStats {
		return this.taskMetricsService.getQueueStats();
	}

	/**
	 * Configure system resources
	 */
	configureSystemResources(resources: Partial<SystemResources>): void {
		this.systemResources = {
			...this.systemResources,
			...resources,
		};
		this.taskQueue.concurrency = this.systemResources.maxConcurrentTasks;
		this.logger.info('System resources updated', { resources: this.systemResources });
		this.scheduleTaskProcessing(); // Re-evaluate processing with new resources
	}

	/**
	 * Subscribe to task events
	 */
	on(event: string, listener: TaskEventListener): void {
		this.taskStateManagerService.on(event, listener);
	}

	/**
	 * Unsubscribe from task events
	 */
	off(event: string, listener: TaskEventListener): void {
		this.taskStateManagerService.off(event, listener);
	}

	/**
	 * Emit task event - MOVED to TaskStateManagerService (direct calls)
	 */
	// private emitTaskEvent(event: string, task: Task): void { ... }

	/**
	 * Sort queue by priority - MOVED to TaskStateManagerService
	 */
	// private sortQueueByPriority(): void { ... }

	/**
	 * Check if system has resources available for task
	 */
	private hasResourcesAvailable(task: Task): boolean {
		// Check specific resource requirements if defined
		if (task.resources) {
			if (task.resources.memory && task.resources.memory > this.systemResources.availableMemory) {
				this.logger.debug(`Not enough memory for task ${task.id}`);
				return false;
			}
			// Additional resource checks could be added here (e.g., CPU, modelProvider availability)
		}
		// General concurrency check is handled by PQueue's size vs concurrency limit
		return true; // Simplified: PQueue handles concurrency; specific resource checks remain.
	}

	/**
	 * Schedule task processing
	 */
	scheduleTaskProcessing(): void {
		this.logger.debug('Attempting to schedule next task.', {
			pQueueSize: this.taskQueue.size,
			pQueuePending: this.taskQueue.pending,
		}); // Changed trace to debug and used structured logging
		if (this.taskQueue.size >= this.systemResources.maxConcurrentTasks) {
			this.logger.debug('Task queue is at max concurrency.', {
				maxConcurrentTasks: this.systemResources.maxConcurrentTasks,
				pQueueSize: this.taskQueue.size,
			}); // Changed trace to debug and used structured logging
			return;
		}

		const nextTaskToProcess = this.taskStateManagerService.dequeueTaskForProcessing();
		if (!nextTaskToProcess) {
			this.logger.debug('No tasks in queue to process.'); // Changed trace to debug
			return;
		}

		if (!this.hasResourcesAvailable(nextTaskToProcess)) {
			this.logger.warn(
				`Task ${nextTaskToProcess.id} cannot be processed due to resource constraints. Re-queuing.`,
				{ taskId: nextTaskToProcess.id },
			);
			// Requeue the task. This should also trigger an event that calls scheduleTaskProcessing again.
			this.taskStateManagerService
				.requeueTask(nextTaskToProcess.id)
				.catch((err) =>
					this.logger.error(
						`Failed to requeue task ${nextTaskToProcess.id} after resource check:`,
						{ error: err, taskId: nextTaskToProcess.id },
					),
				);
			return;
		}

		this.logger.debug(`Adding task ${nextTaskToProcess.id} to PQueue for processing.`);
		this.taskQueue
			.add(() => this.processTaskInstance(nextTaskToProcess.id))
			.catch((error: any) => {
				this.logger.error(`Unhandled error in PQueue for task ${nextTaskToProcess.id}:`, {
					error,
					taskId: nextTaskToProcess.id,
				});
				this.taskStateManagerService
					.setTaskFailed(nextTaskToProcess.id, { error: 'Unhandled PQueue execution error' })
					.catch((err: any) =>
						this.logger.error(
							`Failed to set task ${nextTaskToProcess.id} to FAILED after PQueue error:`,
							{ error: err, taskId: nextTaskToProcess.id },
						),
					);
			});
	}

	/**
	 * Process a single task instance.
	 * This is the function that PQueue will execute for each task.
	 */
	private async processTaskInstance(taskId: string): Promise<void> {
		const task = this.taskStateManagerService.getTaskById(taskId);
		if (!task) {
			this.logger.error(`Task ${taskId} not found for processing by PQueue`, { taskId });
			return;
		}

		// Check if task was cancelled while in PQueue
		if (task.status === TaskStatus.CANCELLED) {
			this.logger.info(`Task ${taskId} was cancelled before execution started.`, { taskId });
			// Ensure metrics are cleaned up if cancelled before execution start
			this.taskMetricsService.trackTaskExecutionEnd(taskId, TaskStatus.CANCELLED);
			return;
		}

		this.logger.info(`Processing task ${taskId} of type ${task.taskType}`, {
			taskId,
			taskType: task.taskType,
		});
		await this.taskStateManagerService.updateTaskStatus(taskId, TaskStatus.RUNNING);
		this.taskMetricsService.trackTaskExecutionStart(taskId);

		let result: any;
		let error: Error | undefined;
		let taskFinalStatus: TaskStatus = TaskStatus.COMPLETED; // Assume success initially

		try {
			result = await this.taskExecutorService.executeTask(task);
			this.logger.info(`Task ${taskId} completed successfully`, { taskId });
			await this.taskStateManagerService.setTaskCompleted(taskId, result);
			taskFinalStatus = TaskStatus.COMPLETED;
		} catch (e: any) {
			this.logger.error(`Task ${taskId} failed during execution`, {
				taskId,
				error: e.message,
				stack: e.stack,
			});
			error = e instanceof Error ? e : new Error(String(e));
			// The TaskErrorHandlerService will update the task state (FAILED, RETRYING, etc.)
			// and determine the final effective status for metrics.
			taskFinalStatus = await this.taskErrorHandlerService.handleExecutionError(task, error);
		} finally {
			this.taskMetricsService.trackTaskExecutionEnd(taskId, taskFinalStatus);
			// Schedule next task processing regardless of current task outcome
			// PQueue will call this automatically for the next item if the queue is not empty and concurrency allows
			// However, if a task failed and is retrying, or new tasks came in, we might want to explicitly schedule
			this.scheduleTaskProcessing();
		}
	}

	/**
	 * Record task completion statistics - MOVED to TaskMetricsService
	 */
	// private recordTaskCompletion(task: Task): void { ... }

	/**
	 * Create recovery config from task configuration or use defaults - MOVED to TaskErrorHandlerService
	 */
	// private createRetryConfig(task: Task): RecoveryConfig { ... }

	/**
	 * Clean up old tasks - MOVED to TaskStateManagerService
	 */
	// private cleanupOldTasks(): void { ... }

	/**
	 * Batch operations
	 */

	/**
	 * Cancel all tasks
	 */
	async cancelAllTasks(): Promise<number> {
		const tasksToCancel = [
			...this.taskStateManagerService.getTasksByStatus(TaskStatus.QUEUED),
			...this.taskStateManagerService.getTasksByStatus(TaskStatus.RUNNING),
			...this.taskStateManagerService.getTasksByStatus(TaskStatus.PAUSED),
		];

		let count = 0;
		for (const task of tasksToCancel) {
			try {
				await this.cancelTask(task.id);
				count++;
			} catch (error: any) {
				// Added type for error
				this.logger.warn(`Failed to cancel task ${task.id} during cancelAllTasks:`, {
					error: error.message,
					taskId: task.id,
				}); // Corrected logger call
			}
		}
		return count;
	}

	/**
	 * Pause all running tasks
	 */
	async pauseAllRunningTasks(): Promise<number> {
		const runningTasks = this.taskStateManagerService.getTasksByStatus(TaskStatus.RUNNING);
		let count = 0;
		for (const task of runningTasks) {
			try {
				await this.pauseTask(task.id);
				count++;
			} catch (error: any) {
				// Added type for error
				this.logger.warn(`Failed to pause task ${task.id} during pauseAllRunningTasks:`, {
					error: error.message,
					taskId: task.id,
				}); // Corrected logger call
			}
		}
		// No need for explicit scheduleTaskProcessing here if resumeTask events trigger it.
		return count;
	}

	/**
	 * Resume all paused tasks
	 */
	async resumeAllPausedTasks(): Promise<number> {
		const pausedTasks = this.taskStateManagerService.getTasksByStatus(TaskStatus.PAUSED);
		let count = 0;
		for (const task of pausedTasks) {
			try {
				await this.resumeTask(task.id); // This will also call scheduleTaskProcessing via event
				count++;
			} catch (error: any) {
				this.logger.warn(`Failed to resume task ${task.id} during resumeAllPausedTasks:`, {
					error: error.message,
					taskId: task.id,
				});
			}
		}
		// No need for explicit scheduleTaskProcessing here if resumeTask events trigger it.
		return count;
	}
}
