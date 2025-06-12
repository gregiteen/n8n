/**
 * Task State Manager Service
 * Handles task state transitions and status management
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { Task, TaskStatus } from './task-types';
import EventEmitter from 'events';

@Service()
export class TaskStateManagerService {
	private eventEmitter = new EventEmitter();

	constructor(@Inject(Logger) private readonly logger: Logger) {
		this.logger = this.logger.scoped('task-state');
		this.setupEventListeners();
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
	 * Get task transition target collections based on status
	 */
	getCollectionUpdates(
		oldStatus: TaskStatus | undefined,
		newStatus: TaskStatus,
		taskId: string,
		task: Task,
		queuedTasks: Task[],
		runningTasks: Map<string, any>,
		pausedTasks: Map<string, Task>,
		completedTasks: Map<string, Task>,
		failedTasks: Map<string, Task>,
	): {
		queuedTasks: Task[];
		runningTasks: Map<string, any>;
		pausedTasks: Map<string, Task>;
		completedTasks: Map<string, Task>;
		failedTasks: Map<string, Task>;
		taskUpdates: Partial<Task>;
	} {
		// Make a copy of the collections to avoid modifying the originals
		const updatedQueuedTasks = [...queuedTasks];
		const updatedRunningTasks = new Map(runningTasks);
		const updatedPausedTasks = new Map(pausedTasks);
		const updatedCompletedTasks = new Map(completedTasks);
		const updatedFailedTasks = new Map(failedTasks);

		let taskUpdates: Partial<Task> = {};

		// Remove from old status collection if defined
		if (oldStatus) {
			switch (oldStatus) {
				case TaskStatus.QUEUED:
					const index = updatedQueuedTasks.findIndex((t) => t.id === taskId);
					if (index !== -1) updatedQueuedTasks.splice(index, 1);
					break;
				case TaskStatus.RUNNING:
					updatedRunningTasks.delete(taskId);
					break;
				case TaskStatus.PAUSED:
					updatedPausedTasks.delete(taskId);
					break;
				case TaskStatus.COMPLETED:
					updatedCompletedTasks.delete(taskId);
					break;
				case TaskStatus.FAILED:
					updatedFailedTasks.delete(taskId);
					break;
			}
		}

		// Add to new status collection
		switch (newStatus) {
			case TaskStatus.QUEUED:
				taskUpdates = { status: TaskStatus.QUEUED };
				updatedQueuedTasks.push(task);
				break;
			case TaskStatus.RUNNING:
				taskUpdates = {
					status: TaskStatus.RUNNING,
					startedAt: task.startedAt || new Date(),
				};
				break;
			case TaskStatus.PAUSED:
				taskUpdates = { status: TaskStatus.PAUSED };
				updatedPausedTasks.set(taskId, task);
				break;
			case TaskStatus.COMPLETED:
				taskUpdates = {
					status: TaskStatus.COMPLETED,
					completedAt: new Date(),
					progress: 100,
				};
				updatedCompletedTasks.set(taskId, task);
				break;
			case TaskStatus.FAILED:
				taskUpdates = {
					status: TaskStatus.FAILED,
					completedAt: new Date(),
				};
				updatedFailedTasks.set(taskId, task);
				break;
			case TaskStatus.CANCELLED:
				taskUpdates = {
					status: TaskStatus.CANCELLED,
					completedAt: new Date(),
				};
				break;
		}

		return {
			queuedTasks: updatedQueuedTasks,
			runningTasks: updatedRunningTasks,
			pausedTasks: updatedPausedTasks,
			completedTasks: updatedCompletedTasks,
			failedTasks: updatedFailedTasks,
			taskUpdates,
		};
	}

	/**
	 * Emit task event
	 */
	emitTaskEvent(event: string, task: Task): void {
		this.eventEmitter.emit(event, task);
	}

	/**
	 * Subscribe to task events
	 */
	on(event: string, listener: (task: Task) => void): void {
		this.eventEmitter.on(event, listener);
	}

	/**
	 * Unsubscribe from task events
	 */
	off(event: string, listener: (task: Task) => void): void {
		this.eventEmitter.off(event, listener);
	}
}
