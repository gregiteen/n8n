/**
 * Task State Manager Service
 * Handles task state transitions, status management, and internal collections.
 */

import { Service, Inject } from '../../di';
import { Logger } from '../../logger';
import { Task, TaskStatus, UpdateTaskRequest, TaskEventListener } from './task-types';
import EventEmitter from 'events';

@Service()
export class TaskStateManagerService {
	private tasks: Map<string, Task> = new Map();
	private queuedTasks: Task[] = []; // Sorted by priority and creation time
	private runningTasks: Map<string, Task> = new Map();
	private pausedTasks: Map<string, Task> = new Map();
	private completedTasks: Map<string, Task> = new Map();
	private failedTasks: Map<string, Task> = new Map();

	private eventEmitter = new EventEmitter();

	constructor(@Inject(Logger) private readonly logger: Logger) {
		this.logger = this.logger.scoped('task-state-manager');
		this.setupInternalEventListeners();
	}

	private setupInternalEventListeners(): void {
		// Example internal listener, can be expanded
		this.on('task.status.changed', (task) => {
			this.logger.debug(`Task ${task.id} status changed to ${task.status}`);
		});
	}

	// --- Task Creation and Retrieval ---

	addTask(task: Task): void {
		if (this.tasks.has(task.id)) {
			this.logger.warn(
				`Task with ID ${task.id} already exists. Overwriting is not allowed via addTask.`,
			);
			return;
		}
		this.tasks.set(task.id, { ...task }); // Store a copy
		if (task.status === TaskStatus.QUEUED) {
			this.queuedTasks.push(this.tasks.get(task.id)!);
			this._sortQueuedTasks();
		}
		this.emitTaskEvent('task.created', this.tasks.get(task.id)!);
	}

	getTaskById(taskId: string): Task | undefined {
		const task = this.tasks.get(taskId);
		return task ? { ...task } : undefined; // Return a copy
	}

	getAllTasks(): Task[] {
		return Array.from(this.tasks.values()).map((task) => ({ ...task })); // Return copies
	}

	getTasksByStatus(status: TaskStatus): Task[] {
		return Array.from(this.tasks.values())
			.filter((task) => task.status === status)
			.map((task) => ({ ...task })); // Return copies
	}

	getTasksByType(taskType: string): Task[] {
		return Array.from(this.tasks.values())
			.filter((task) => task.taskType === taskType)
			.map((task) => ({ ...task })); // Return copies
	}

	getTasksByUserId(userId: string): Task[] {
		return Array.from(this.tasks.values())
			.filter((task) => task.userId === userId)
			.map((task) => ({ ...task })); // Return copies
	}

	// --- Task Update and Status Management ---

	async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found for update.`);
		}

		const oldStatus = task.status;
		const newStatus = updates.status;

		// Apply general updates
		Object.assign(task, updates);
		task.updatedAt = new Date();

		if (newStatus && newStatus !== oldStatus) {
			this._updateTaskStatusCollections(task, oldStatus, newStatus);
			// Status-specific fields (like completedAt, startedAt) are handled by _updateTaskStatusCollections or specific setters
		}

		this.tasks.set(taskId, task); // task object is already updated
		this.emitTaskEvent('task.updated', { ...task });
		return { ...task };
	}

	private _updateTaskStatusCollections(
		taskInstance: Task,
		oldStatus: TaskStatus,
		newStatus: TaskStatus,
		details?: { error?: string; result?: any },
	): void {
		// Remove from old collection
		switch (oldStatus) {
			case TaskStatus.QUEUED:
				this.queuedTasks = this.queuedTasks.filter((t) => t.id !== taskInstance.id);
				break;
			case TaskStatus.RUNNING:
				this.runningTasks.delete(taskInstance.id);
				break;
			case TaskStatus.PAUSED:
				this.pausedTasks.delete(taskInstance.id);
				break;
			case TaskStatus.COMPLETED:
				this.completedTasks.delete(taskInstance.id);
				break;
			case TaskStatus.FAILED:
				this.failedTasks.delete(taskInstance.id);
				break;
		}

		// Update task fields based on new status
		taskInstance.status = newStatus;
		taskInstance.updatedAt = new Date();

		if (details?.error) taskInstance.error = details.error;
		if (details?.result) taskInstance.result = details.result;

		// Add to new collection and set status-specific fields
		switch (newStatus) {
			case TaskStatus.QUEUED:
				taskInstance.startedAt = undefined;
				taskInstance.completedAt = undefined;
				taskInstance.error = undefined;
				this.queuedTasks.push(taskInstance);
				this._sortQueuedTasks();
				break;
			case TaskStatus.RUNNING:
				taskInstance.startedAt = taskInstance.startedAt || new Date(); // Keep original if retrying a task that was already started
				this.runningTasks.set(taskInstance.id, taskInstance);
				break;
			case TaskStatus.PAUSED:
				this.pausedTasks.set(taskInstance.id, taskInstance);
				break;
			case TaskStatus.COMPLETED:
				taskInstance.completedAt = new Date();
				taskInstance.progress = 100;
				this.completedTasks.set(taskInstance.id, taskInstance);
				break;
			case TaskStatus.FAILED:
				taskInstance.completedAt = new Date(); // Mark completion time even for failures
				this.failedTasks.set(taskInstance.id, taskInstance);
				break;
			case TaskStatus.CANCELLED:
				taskInstance.completedAt = new Date(); // Mark completion time for cancellations
				// No specific collection for cancelled, they remain in the main `tasks` map with this status.
				break;
		}
		this.emitTaskEvent('task.status.changed', { ...taskInstance });
	}

	async updateTaskStatus(
		taskId: string,
		newStatus: TaskStatus,
		details?: { error?: string; result?: any },
	): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found for status update.`);
		}
		const oldStatus = task.status;
		if (oldStatus === newStatus) return { ...task }; // No change

		this._updateTaskStatusCollections(task, oldStatus, newStatus, details);

		// Emit specific events based on status change
		switch (newStatus) {
			case TaskStatus.RUNNING:
				this.emitTaskEvent('task.started', { ...task });
				break;
			case TaskStatus.COMPLETED:
				this.emitTaskEvent('task.completed', { ...task });
				break;
			case TaskStatus.FAILED:
				this.emitTaskEvent('task.failed', { ...task });
				break;
			case TaskStatus.PAUSED:
				this.emitTaskEvent('task.paused', { ...task });
				break;
			case TaskStatus.CANCELLED:
				this.emitTaskEvent('task.cancelled', { ...task });
				break;
			case TaskStatus.QUEUED:
				this.emitTaskEvent('task.requeued', { ...task });
				break; // Or a more generic event
		}

		return { ...task };
	}

	async setTaskRunning(taskId: string): Promise<Task> {
		return this.updateTaskStatus(taskId, TaskStatus.RUNNING);
	}

	async setTaskFailed(taskId: string, details: { error?: string; result?: any }): Promise<Task> {
		return this.updateTaskStatus(taskId, TaskStatus.FAILED, details);
	}

	async setTaskCompleted(taskId: string, details: { result?: any }): Promise<Task> {
		return this.updateTaskStatus(taskId, TaskStatus.COMPLETED, details);
	}

	async deleteTask(taskId: string): Promise<void> {
		const task = this.tasks.get(taskId);
		if (!task) {
			this.logger.warn(`Task ${taskId} not found for deletion.`);
			return;
		}

		this._updateTaskStatusCollections(task, task.status, TaskStatus.CANCELLED); // Effectively remove from active lists
		this.tasks.delete(taskId); // Remove from the main historical map
		// Or, if we want to keep it historically with CANCELLED status, just ensure it's removed from active queues:
		// this.queuedTasks = this.queuedTasks.filter((t) => t.id !== taskId);
		// this.runningTasks.delete(taskId);
		// this.pausedTasks.delete(taskId);
		// task.status = TaskStatus.CANCELLED; // if not already.

		this.emitTaskEvent('task.deleted', { ...task }); // task here might be stale if deleted from map
	}

	// --- Queue Management ---

	dequeueTaskForProcessing(): Task | undefined {
		if (this.queuedTasks.length === 0) {
			return undefined;
		}
		// .shift() removes and returns the first element. Task is already a reference from this.tasks.
		// We don't change its status here; TaskQueueService will call setTaskRunning.
		// The actual removal from queuedTasks happens in _updateTaskStatusCollections when status changes to RUNNING.
		return { ...this.queuedTasks[0] }; // Return a copy of the next task to process
	}

	async requeueTask(taskId: string): Promise<Task> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found for requeue.`);
		}
		// Ensure it's removed from other active states if it was, for example, running and then requeued.
		return this.updateTaskStatus(taskId, TaskStatus.QUEUED);
	}

	private _sortQueuedTasks(): void {
		this.queuedTasks.sort((a, b) => {
			if (a.priority !== b.priority) {
				return b.priority - a.priority; // Higher priority first
			}
			return a.createdAt.getTime() - b.createdAt.getTime(); // Older first for same priority
		});
	}

	// --- Event Emitter Delegation ---

	on(event: string, listener: TaskEventListener): void {
		this.eventEmitter.on(event, listener);
	}

	off(event: string, listener: TaskEventListener): void {
		this.eventEmitter.off(event, listener);
	}

	emitTaskEvent(event: string, task: Task): void {
		this.eventEmitter.emit(event, { ...task }); // Emit a copy
	}

	// --- Cleanup ---

	cleanupOldTasks(retentionPeriodMs: number): void {
		const now = Date.now();
		const cleanup = (taskMap: Map<string, Task>) => {
			for (const [taskId, task] of taskMap.entries()) {
				if (task.completedAt && now - task.completedAt.getTime() > retentionPeriodMs) {
					// Decide if we remove from the main `tasks` map or just these status-specific views
					// For now, just removing from status-specific views, main `tasks` map keeps history.
					taskMap.delete(taskId);
					this.logger.debug(`Cleaned up old task ${taskId} from ${task.status} list.`);
				}
			}
		};
		cleanup(this.completedTasks);
		cleanup(this.failedTasks);
		// Potentially cleanup from main `tasks` map too if true deletion is desired.
	}

	// --- Getters for Metrics ---

	getQueuedTasksCount(): number {
		return this.queuedTasks.length;
	}

	getRunningTasksCount(): number {
		return this.runningTasks.size;
	}

	getPausedTasksCount(): number {
		return this.pausedTasks.size;
	}

	getCompletedTasksCount(): number {
		return this.completedTasks.size;
	}

	getFailedTasksCount(): number {
		return this.failedTasks.size;
	}

	getCancelledTasksCount(): number {
		// Cancelled tasks are not in a separate collection, count from main map
		return Array.from(this.tasks.values()).filter((t) => t.status === TaskStatus.CANCELLED).length;
	}

	getAllTasksMap(): ReadonlyMap<string, Task> {
		// Return a new map of copies to prevent external modification
		const mapCopy = new Map<string, Task>();
		for (const [id, task] of this.tasks.entries()) {
			mapCopy.set(id, { ...task });
		}
		return mapCopy;
	}

	getQueuedTasksList(): readonly Task[] {
		return this.queuedTasks.map((task) => ({ ...task })); // Return copies
	}
}
