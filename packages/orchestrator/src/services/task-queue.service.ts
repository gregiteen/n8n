/**
 * Task Queue Management Service
 * Handles task scheduling, prioritization, resource allocation, and error recovery
 *
 * Features:
 * - Task scheduling with priority queue
 * - Resource allocation and constraints
 * - Error handling and retries
 * - Task statistics and monitoring
 * - Event-based communication
 * - Rate limiting and throttling
 */

import { Service, Inject, container } from '../di';
import { Logger } from '../logger';
import { createEventQueue } from '../utils';
import { nanoid } from 'nanoid';
import EventEmitter from 'events';
import PQueue from 'p-queue';
import { WorkflowExecutionService } from './workflow-execution.service';
import { ErrorRecoveryService, RecoveryConfig } from '../error-handling/error-recovery';

// Define task priority levels
export enum TaskPriority {
	LOW = 0,
	MEDIUM = 1,
	HIGH = 2,
	URGENT = 3,
}

// Define task status values
export enum TaskStatus {
	QUEUED = 'queued',
	RUNNING = 'running',
	PAUSED = 'paused',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

// Define task type
export enum TaskType {
	CHAT = 'chat',
	WORKFLOW = 'workflow',
	DATA_ANALYSIS = 'data-analysis',
	WEB_SCRAPE = 'web-scrape',
	CODE_GENERATION = 'code-generation',
	CONTENT_WRITING = 'content-writing',
	IMAGE_ANALYSIS = 'image-analysis',
	DECISION = 'decision',
}

// Interface for task resource requirements
export interface TaskResources {
	memory?: number; // Memory requirement in MB
	cpuIntensive?: boolean; // Flag for CPU-intensive tasks
	timeEstimate?: number; // Estimated time to complete in seconds
	modelProvider?: string; // AI model provider (openai, anthropic, etc.)
}

// Interface for task retry configuration
export interface TaskRetryConfig {
	initialDelay: number; // Initial delay for retries in ms
	maxDelay: number; // Maximum delay for retries in ms
	backoffFactor: number; // Factor for exponential backoff
	fallbackFunction?: (task: Task, error: Error) => Promise<any>; // Optional fallback function
	notifyFunction?: (task: Task, error: Error) => Promise<void>; // Optional notification function
}

// Define task data interface
export interface Task {
	id: string;
	userId: string;
	name: string;
	description?: string;
	taskType: TaskType | string;
	status: TaskStatus;
	priority: TaskPriority;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	updatedAt: Date;
	progress: number;
	resources?: TaskResources;
	agentId?: string;
	workflowId?: string;
	parentTaskId?: string;
	retries: number;
	maxRetries: number;
	retryConfig?: TaskRetryConfig;
	error?: string;
	result?: any;
	input?: any;
	metadata?: Record<string, any>;
}

// Interface for task creation request
export interface CreateTaskRequest {
	name: string;
	description?: string;
	taskType: TaskType | string;
	priority?: TaskPriority;
	resources?: TaskResources;
	agentId?: string;
	workflowId?: string;
	parentTaskId?: string;
	maxRetries?: number;
	retryConfig?: TaskRetryConfig;
	input?: any;
	metadata?: Record<string, any>;
}

// Interface for task update
export interface UpdateTaskRequest {
	name?: string;
	description?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
	progress?: number;
	error?: string;
	result?: any;
	metadata?: Record<string, any>;
}

// Interface for task execution function
export type TaskExecutorFn = (task: Task) => Promise<any>;

// Interface for system resources
interface SystemResources {
	availableCpu: number; // Available CPU percentage
	availableMemory: number; // Available memory in MB
	maxConcurrentTasks: number; // Maximum number of concurrent tasks
}

// Interface for task queue statistics
export interface TaskQueueStats {
	queuedCount: number;
	runningCount: number;
	pausedCount: number;
	completedCount: number;
	failedCount: number;
	cancelledCount: number;
	averageWaitTime: number; // in milliseconds
	averageProcessingTime: number; // in milliseconds
	tasksByType: Record<string, number>;
	tasksByPriority: Record<string, number>;
}

// Type for task event listeners
export type TaskEventListener = (task: Task) => void;

@Service()
export class TaskQueueService {
	private tasks: Map<string, Task> = new Map();
	private queuedTasks: Task[] = [];
	private runningTasks: Map<string, { task: Task; promise: Promise<any> }> = new Map();
	private pausedTasks: Map<string, Task> = new Map();
	private completedTasks: Map<string, Task> = new Map();
	private failedTasks: Map<string, Task> = new Map();
	private taskExecutors: Map<string, TaskExecutorFn> = new Map();

	// Statistics tracking
	private taskCompletionTimes: number[] = [];
	private taskWaitTimes: Map<string, number> = new Map();
	private metricsCollectionInterval: NodeJS.Timeout | null = null;

	// Configure system resources
	private systemResources: SystemResources = {
		availableCpu: 100,
		availableMemory: 8192, // 8GB default
		maxConcurrentTasks: 5, // Default max concurrent tasks
	};

	// Task event emitter
	private eventEmitter = new EventEmitter();

	// Priority-based task processing queue with concurrency control
	private taskQueue: PQueue = new PQueue({
		concurrency: 5, // Default concurrency
		autoStart: true,
	});

	// Task processing queue
	private taskProcessor = createEventQueue<string>(async (taskId: string) =>
		this.processNextTask(taskId),
	);

	// Track retry counts for tasks
	private taskRetryCount: Map<string, number> = new Map();

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(WorkflowExecutionService)
		private readonly workflowExecutionService: WorkflowExecutionService,
		@Inject(ErrorRecoveryService) private readonly errorRecoveryService: ErrorRecoveryService,
	) {
		this.logger = this.logger.scoped('task-queue');

		// Set up event listeners
		this.setupEventListeners();

		// Initialize task executors
		this.initializeTaskExecutors();

		// Start a periodic task to clean up old completed/failed tasks
		setInterval(() => this.cleanupOldTasks(), 1000 * 60 * 60); // Run every hour

		// Start periodic metrics collection
		this.metricsCollectionInterval = setInterval(() => this.collectMetrics(), 60000); // Every minute

		// Start the queue processor
		this.scheduleTaskProcessing();
	}

	/**
	 * Set up event listeners
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on('task.created', (task: Task) => {
			this.logger.debug(`Task created: ${task.id} - ${task.name}`);
		});

		this.eventEmitter.on('task.started', (task: Task) => {
			this.logger.debug(`Task started: ${task.id} - ${task.name}`);
		});

		this.eventEmitter.on('task.completed', (task: Task) => {
			this.logger.debug(`Task completed: ${task.id} - ${task.name}`);
		});

		this.eventEmitter.on('task.failed', (task: Task) => {
			this.logger.debug(`Task failed: ${task.id} - ${task.name} - ${task.error}`);
		});
	}

	/**
	 * Initialize task executors for different task types
	 */
	private initializeTaskExecutors(): void {
		// Register workflow task executor
		this.registerTaskExecutor(TaskType.WORKFLOW, async (task: Task) => {
			if (!task.workflowId) {
				throw new Error('Workflow ID is required for workflow tasks');
			}

			try {
				return await this.workflowExecutionService.executeWorkflow(
					task.workflowId,
					task.input || {},
				);
			} catch (error: any) {
				this.logger.error(`Error executing workflow: ${error.message}`);
				throw error;
			}
		});
	}

	/**
	 * Execute a workflow task
	 * @param task The task to execute
	 */
	private async executeWorkflowTask(task: Task): Promise<any> {
		this.logger.info(`Executing workflow task: ${task.id}, workflow: ${task.workflowId}`);

		if (!task.workflowId) {
			throw new Error('Workflow ID is required for workflow tasks');
		}

		// Update task progress to indicate workflow started
		await this.updateTaskProgress(task.id, 10);

		try {
			// Execute the workflow
			const result = await this.workflowExecutionService.executeWorkflow(
				task.workflowId,
				task.input || {},
				{ waitForCompletion: true },
			);

			// Update task progress
			await this.updateTaskProgress(task.id, 100);

			if (result.status === 'error') {
				throw new Error(result.error?.message || 'Workflow execution failed');
			}

			return result.data;
		} catch (error: any) {
			this.logger.error(`Error executing workflow task: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Collect and update task metrics
	 */
	private collectMetrics(): void {
		const now = new Date().getTime();
		let totalWaitTime = 0;
		let waitTimeCount = 0;

		// Calculate current wait times
		for (const [taskId, queueTime] of this.taskWaitTimes.entries()) {
			totalWaitTime += now - queueTime;
			waitTimeCount++;
		}

		// Calculate average processing time
		const avgProcessingTime =
			this.taskCompletionTimes.length > 0
				? this.taskCompletionTimes.reduce((sum, time) => sum + time, 0) /
					this.taskCompletionTimes.length
				: 0;

		// Update metrics
		const stats = this.getQueueStats();
		this.logger.debug('Task queue metrics collected', {
			queuedCount: stats.queuedCount,
			runningCount: stats.runningCount,
			avgWaitTime: stats.averageWaitTime,
			avgProcessingTime: stats.averageProcessingTime,
		});
	}

	/**
	 * Register a task executor function for a specific task type
	 */
	registerTaskExecutor(taskType: string, executor: TaskExecutorFn): void {
		this.taskExecutors.set(taskType, executor);
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

		this.tasks.set(task.id, task);
		this.queuedTasks.push(task);

		// Sort the queue by priority
		this.sortQueueByPriority();

		// Record the time the task entered the queue
		this.taskWaitTimes.set(task.id, now.getTime());

		this.logger.info(`Task ${task.id} created and queued`);
		this.emitTaskEvent('task.created', task);

		// Trigger queue processing
		this.scheduleTaskProcessing();

		return task;
	}

	/**
	 * Get all tasks
	 */
	getAllTasks(): Task[] {
		return Array.from(this.tasks.values());
	}

	/**
	 * Get task by ID
	 */
	getTaskById(taskId: string): Task | undefined {
		return this.tasks.get(taskId);
	}

	/**
	 * Get tasks by status
	 */
	getTasksByStatus(status: TaskStatus): Task[] {
		return Array.from(this.tasks.values()).filter((task) => task.status === status);
	}

	/**
	 * Get tasks by type
	 */
	getTasksByType(taskType: string): Task[] {
		return Array.from(this.tasks.values()).filter((task) => task.taskType === taskType);
	}

	/**
	 * Get tasks by user ID
	 */
	getTasksByUserId(userId: string): Task[] {
		return Array.from(this.tasks.values()).filter((task) => task.userId === userId);
	}

	/**
	 * Update task
	 */
	async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		const updatedTask = {
			...task,
			...updates,
			updatedAt: new Date(),
		};

		// Handle status changes
		if (updates.status && updates.status !== task.status) {
			await this.handleStatusChange(task, updates.status);
		}

		this.tasks.set(taskId, updatedTask);
		this.emitTaskEvent('task.updated', updatedTask);

		return updatedTask;
	}

	/**
	 * Handle task status change
	 */
	private async handleStatusChange(task: Task, newStatus: TaskStatus): Promise<void> {
		const oldStatus = task.status;

		// Remove from old status collection
		switch (oldStatus) {
			case TaskStatus.QUEUED:
				this.queuedTasks = this.queuedTasks.filter((t) => t.id !== task.id);
				break;
			case TaskStatus.RUNNING:
				this.runningTasks.delete(task.id);
				break;
			case TaskStatus.PAUSED:
				this.pausedTasks.delete(task.id);
				break;
		}

		// Add to new status collection
		switch (newStatus) {
			case TaskStatus.QUEUED:
				task.status = TaskStatus.QUEUED;
				this.queuedTasks.push(task);
				this.sortQueueByPriority();
				break;
			case TaskStatus.RUNNING:
				task.status = TaskStatus.RUNNING;
				task.startedAt = task.startedAt || new Date();
				break;
			case TaskStatus.PAUSED:
				task.status = TaskStatus.PAUSED;
				this.pausedTasks.set(task.id, task);
				break;
			case TaskStatus.COMPLETED:
				task.status = TaskStatus.COMPLETED;
				task.completedAt = new Date();
				task.progress = 100;
				this.completedTasks.set(task.id, task);
				this.recordTaskCompletion(task);
				break;
			case TaskStatus.FAILED:
				task.status = TaskStatus.FAILED;
				task.completedAt = new Date();
				this.failedTasks.set(task.id, task);

				// Handle retry if applicable
				if (task.retries < task.maxRetries) {
					await this.retryTask(task.id);
				}
				break;
			case TaskStatus.CANCELLED:
				task.status = TaskStatus.CANCELLED;
				task.completedAt = new Date();
				break;
		}

		this.emitTaskEvent('task.status.changed', task);
	}

	/**
	 * Pause a task
	 */
	async pauseTask(taskId: string): Promise<Task> {
		return this.updateTask(taskId, { status: TaskStatus.PAUSED });
	}

	/**
	 * Resume a task
	 */
	async resumeTask(taskId: string): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		if (task.status !== TaskStatus.PAUSED) {
			throw new Error(`Task ${taskId} is not paused`);
		}

		return this.updateTask(taskId, { status: TaskStatus.QUEUED });
	}

	/**
	 * Cancel a task
	 */
	async cancelTask(taskId: string): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		// If task is running, attempt to cancel it
		if (task.status === TaskStatus.RUNNING) {
			this.emitTaskEvent('task.cancel', task);
		}

		return this.updateTask(taskId, { status: TaskStatus.CANCELLED });
	}

	/**
	 * Retry a failed task
	 */
	async retryTask(taskId: string): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		if (task.status !== TaskStatus.FAILED && task.status !== TaskStatus.CANCELLED) {
			throw new Error(`Task ${taskId} cannot be retried as it is not failed or cancelled`);
		}

		// Increment retry counter and reset status
		const updatedTask: Task = {
			...task,
			retries: task.retries + 1,
			status: TaskStatus.QUEUED,
			progress: 0,
			error: undefined,
			startedAt: undefined,
			completedAt: undefined,
			updatedAt: new Date(),
		};

		this.tasks.set(taskId, updatedTask);
		this.queuedTasks.push(updatedTask);
		this.sortQueueByPriority();

		this.emitTaskEvent('task.retried', updatedTask);
		this.scheduleTaskProcessing();

		return updatedTask;
	}

	/**
	 * Delete a task
	 */
	async deleteTask(taskId: string): Promise<void> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		// If task is running, cancel it first
		if (task.status === TaskStatus.RUNNING) {
			await this.cancelTask(taskId);
		}

		this.tasks.delete(taskId);

		// Remove task from all collections
		this.queuedTasks = this.queuedTasks.filter((t) => t.id !== taskId);
		this.runningTasks.delete(taskId);
		this.pausedTasks.delete(taskId);
		this.completedTasks.delete(taskId);
		this.failedTasks.delete(taskId);

		this.emitTaskEvent('task.deleted', task);
	}

	/**
	 * Update task progress
	 */
	async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
		return this.updateTask(taskId, { progress });
	}

	/**
	 * Get queue statistics
	 */
	getQueueStats(): TaskQueueStats {
		const now = new Date().getTime();
		const queuedTaskIds = this.queuedTasks.map((t) => t.id);

		// Calculate average wait time
		let totalWaitTime = 0;
		let waitTimeCount = 0;

		for (const [taskId, queueTime] of this.taskWaitTimes.entries()) {
			if (queuedTaskIds.includes(taskId)) {
				totalWaitTime += now - queueTime;
				waitTimeCount++;
			}
		}

		const avgWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0;

		// Calculate average processing time
		const avgProcessingTime =
			this.taskCompletionTimes.length > 0
				? this.taskCompletionTimes.reduce((sum, time) => sum + time, 0) /
					this.taskCompletionTimes.length
				: 0;

		// Count tasks by type and priority
		const tasksByType: Record<string, number> = {};
		const tasksByPriority: Record<string, number> = {};

		for (const task of this.tasks.values()) {
			// Count by type
			if (!tasksByType[task.taskType]) {
				tasksByType[task.taskType] = 0;
			}
			tasksByType[task.taskType]++;

			// Count by priority
			const priorityKey = TaskPriority[task.priority];
			if (!tasksByPriority[priorityKey]) {
				tasksByPriority[priorityKey] = 0;
			}
			tasksByPriority[priorityKey]++;
		}

		return {
			queuedCount: this.queuedTasks.length,
			runningCount: this.runningTasks.size,
			pausedCount: this.pausedTasks.size,
			completedCount: this.completedTasks.size,
			failedCount: this.failedTasks.size,
			cancelledCount: Array.from(this.tasks.values()).filter(
				(t) => t.status === TaskStatus.CANCELLED,
			).length,
			averageWaitTime: avgWaitTime,
			averageProcessingTime: avgProcessingTime,
			tasksByType,
			tasksByPriority,
		};
	}

	/**
	 * Configure system resources
	 */
	configureSystemResources(resources: Partial<SystemResources>): void {
		this.systemResources = {
			...this.systemResources,
			...resources,
		};

		this.logger.info('System resources updated', { resources: this.systemResources });
	}

	/**
	 * Subscribe to task events
	 */
	on(event: string, listener: TaskEventListener): void {
		this.eventEmitter.on(event, listener);
	}

	/**
	 * Unsubscribe from task events
	 */
	off(event: string, listener: TaskEventListener): void {
		this.eventEmitter.off(event, listener);
	}

	/**
	 * Emit task event
	 */
	private emitTaskEvent(event: string, task: Task): void {
		this.eventEmitter.emit(event, task);
	}

	/**
	 * Sort queue by priority
	 */
	private sortQueueByPriority(): void {
		this.queuedTasks.sort((a, b) => {
			// Sort by priority (higher priority first)
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			}

			// If same priority, sort by creation time (older first)
			return a.createdAt.getTime() - b.createdAt.getTime();
		});
	}

	/**
	 * Check if system has resources available for task
	 */
	private hasResourcesAvailable(task: Task): boolean {
		// Simple check if we haven't exceeded max concurrent tasks
		if (this.runningTasks.size >= this.systemResources.maxConcurrentTasks) {
			return false;
		}

		// Check specific resource requirements if defined
		if (task.resources) {
			if (task.resources.memory && task.resources.memory > this.systemResources.availableMemory) {
				return false;
			}

			// Additional resource checks could be added here
		}

		return true;
	}

	/**
	 * Schedule task processing
	 */
	private scheduleTaskProcessing(): void {
		// No tasks to process
		if (this.queuedTasks.length === 0) {
			return;
		}

		// Check next task
		const nextTask = this.queuedTasks[0];

		// Process if resources are available
		if (nextTask && this.hasResourcesAvailable(nextTask)) {
			this.taskProcessor.enqueue(nextTask.id);
		}
	}

	/**
	 * Process next task
	 */
	private async processNextTask(taskId: string): Promise<void> {
		const task = this.tasks.get(taskId);
		if (!task) {
			this.logger.error(`Task ${taskId} not found for processing`);
			return;
		}

		// Check if task is still queued
		if (task.status !== TaskStatus.QUEUED) {
			this.logger.info(`Task ${taskId} is no longer queued, skipping processing`);
			return;
		}

		// Mark task as running
		task.status = TaskStatus.RUNNING;
		task.startedAt = new Date();
		task.updatedAt = new Date();

		this.queuedTasks = this.queuedTasks.filter((t) => t.id !== taskId);

		// Calculate wait time
		const waitStartTime = this.taskWaitTimes.get(taskId);
		if (waitStartTime) {
			const waitTime = new Date().getTime() - waitStartTime;
			this.taskWaitTimes.delete(taskId);
			this.logger.debug(`Task ${taskId} waited ${waitTime}ms in queue`);
		}

		this.emitTaskEvent('task.started', task);

		// Find executor for task type
		const executor = this.taskExecutors.get(task.taskType);
		if (!executor) {
			this.logger.error(`No executor found for task type: ${task.taskType}`);
			await this.updateTask(taskId, {
				status: TaskStatus.FAILED,
				error: `No executor found for task type: ${task.taskType}`,
			});
			return;
		}

		// Get current retry count
		const retryCount = this.taskRetryCount.get(taskId) || 0;

		try {
			// Execute task and track execution
			const executionPromise = executor(task)
				.then(async (result) => {
					// Task completed successfully
					await this.updateTask(taskId, {
						status: TaskStatus.COMPLETED,
						progress: 100,
						result,
					});
					return result;
				})
				.catch(async (error) => {
					// Create recovery config from task configuration or use default
					const recoveryConfig = this.createRetryConfig(task);

					// Handle error with recovery service
					const errorRecoveryResult = await this.errorRecoveryService.handleTaskError(
						task,
						error,
						retryCount + 1,
						recoveryConfig,
					);

					if (errorRecoveryResult.shouldRetry && retryCount < task.maxRetries) {
						// Update retry count
						this.taskRetryCount.set(taskId, retryCount + 1);

						// Log retry attempt
						this.logger.info(
							`Retrying task ${taskId} after error (attempt ${retryCount + 1}/${task.maxRetries})`,
							{
								error: error.message,
								delay: errorRecoveryResult.retryDelay,
								taskType: task.taskType,
							},
						);

						// Schedule retry with delay
						setTimeout(() => {
							this.retryTask(taskId).catch((retryError) => {
								this.logger.error(`Error retrying task ${taskId}:`, retryError);
							});
						}, errorRecoveryResult.retryDelay || 1000);

						// Update task with status info
						await this.updateTask(taskId, {
							status: errorRecoveryResult.status,
							error: errorRecoveryResult.errorMessage,
							metadata: {
								...task.metadata,
								lastErrorType: this.errorRecoveryService.classifyError(error).toString(),
								lastRetryTime: new Date().toISOString(),
								totalRetries: retryCount + 1,
							},
						});
					} else {
						// Task failed and should not be retried
						this.logger.error(`Task ${taskId} failed: ${error.message}`, {
							error,
							taskType: task.taskType,
							maxRetries: task.maxRetries,
							currentAttempt: retryCount + 1,
						});

						// Update task with final error status
						await this.updateTask(taskId, {
							status: errorRecoveryResult.status,
							error: errorRecoveryResult.errorMessage || error.message || 'Unknown error',
							result: errorRecoveryResult.fallbackResult,
							metadata: {
								...task.metadata,
								lastErrorType: this.errorRecoveryService.classifyError(error).toString(),
								finalError: true,
							},
						});
					}

					throw error;
				})
				.finally(() => {
					// Clean up retry count if task is done
					if (
						task &&
						(!this.taskRetryCount.has(taskId) ||
							(this.taskRetryCount.get(taskId) ?? 0) >= task.maxRetries)
					) {
						this.taskRetryCount.delete(taskId);
					}

					// Remove from running tasks
					this.runningTasks.delete(taskId);

					// Process next tasks
					this.scheduleTaskProcessing();
				});

			// Store running task
			this.runningTasks.set(taskId, { task, promise: executionPromise });
		} catch (error: any) {
			this.logger.error(`Error while starting task ${taskId}: ${error.message}`, { error });
			await this.updateTask(taskId, {
				status: TaskStatus.FAILED,
				error: error.message || 'Error starting task',
			});
		}

		// Schedule processing of next task
		this.scheduleTaskProcessing();
	}

	/**
	 * Record task completion statistics
	 */
	private recordTaskCompletion(task: Task): void {
		if (task.startedAt && task.completedAt) {
			const processingTime = task.completedAt.getTime() - task.startedAt.getTime();
			this.taskCompletionTimes.push(processingTime);

			// Keep only the last 1000 completion times
			if (this.taskCompletionTimes.length > 1000) {
				this.taskCompletionTimes.shift();
			}
		}
	}

	/**
	 * Create recovery config from task configuration or use defaults
	 */
	private createRetryConfig(task: Task): RecoveryConfig {
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
	 * Clean up old tasks
	 */
	private cleanupOldTasks(): void {
		const now = new Date().getTime();
		const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

		// Find old completed and failed tasks
		for (const [taskId, task] of this.completedTasks.entries()) {
			if (task.completedAt && now - task.completedAt.getTime() > retentionPeriod) {
				this.completedTasks.delete(taskId);
				// Keep the task in main tasks map for history
			}
		}

		for (const [taskId, task] of this.failedTasks.entries()) {
			if (task.completedAt && now - task.completedAt.getTime() > retentionPeriod) {
				this.failedTasks.delete(taskId);
				// Keep the task in main tasks map for history
			}
		}
	}

	/**
	 * Batch operations
	 */

	/**
	 * Cancel all tasks
	 */
	async cancelAllTasks(): Promise<number> {
		let count = 0;

		// Cancel all queued tasks
		for (const task of this.queuedTasks) {
			await this.cancelTask(task.id);
			count++;
		}

		// Cancel all running tasks
		for (const taskId of this.runningTasks.keys()) {
			await this.cancelTask(taskId);
			count++;
		}

		// Cancel all paused tasks
		for (const taskId of this.pausedTasks.keys()) {
			await this.cancelTask(taskId);
			count++;
		}

		return count;
	}

	/**
	 * Pause all running tasks
	 */
	async pauseAllRunningTasks(): Promise<number> {
		let count = 0;

		for (const taskId of this.runningTasks.keys()) {
			await this.pauseTask(taskId);
			count++;
		}

		return count;
	}

	/**
	 * Resume all paused tasks
	 */
	async resumeAllPausedTasks(): Promise<number> {
		let count = 0;

		for (const taskId of this.pausedTasks.keys()) {
			await this.resumeTask(taskId);
			count++;
		}

		return count;
	}
}
