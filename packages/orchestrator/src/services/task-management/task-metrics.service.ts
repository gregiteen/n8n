/**
 * Task Metrics Service
 * Handles collection and reporting of metrics for the task queue
 */

import { Service, Inject } from '../../di';
import { Logger } from '../../logger';
import { Task, TaskPriority, TaskQueueStats, TaskStatus } from './task-types';
import { TaskStateManagerService } from './task-state-manager.service';

@Service()
export class TaskMetricsService {
	// Statistics tracking
	private taskCompletionTimes: number[] = []; // Stores processing times of completed tasks
	private taskWaitStartTimes: Map<string, number> = new Map(); // taskId -> queue entry timestamp
	private taskProcessingStartTimes: Map<string, number> = new Map(); // taskId -> processing start timestamp
	private metricsCollectionInterval: NodeJS.Timeout | null = null;

	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(TaskStateManagerService)
		private readonly taskStateManagerService: TaskStateManagerService,
	) {
		this.logger = this.logger.scoped('task-metrics');
		this.metricsCollectionInterval = setInterval(() => this.logCurrentMetrics(), 60000); // Log metrics every minute
	}

	/**
	 * Tracks when a task is added to the queue.
	 */
	trackTaskQueued(taskId: string): void {
		this.taskWaitStartTimes.set(taskId, Date.now());
		this.logger.debug(`Task ${taskId} queued, wait time tracking started.`);
	}

	/**
	 * Tracks when a task execution starts.
	 * This is typically when a task moves to RUNNING state.
	 */
	trackTaskExecutionStart(taskId: string): void {
		// Stop wait time tracking
		if (this.taskWaitStartTimes.has(taskId)) {
			// const waitStartTime = this.taskWaitStartTimes.get(taskId)!;
			// const waitTime = Date.now() - waitStartTime;
			// this.logger.debug(`Task ${taskId} waited ${waitTime}ms`);
			this.taskWaitStartTimes.delete(taskId);
		}
		// Start processing time tracking
		this.taskProcessingStartTimes.set(taskId, Date.now());
		this.logger.debug(`Task execution started for ${taskId}, processing time tracking started.`);
	}

	/**
	 * Tracks when a task execution ends and records its completion or failure.
	 * This is called when a task moves to COMPLETED, FAILED, or CANCELLED state.
	 */
	trackTaskExecutionEnd(taskId: string, finalStatus: TaskStatus): void {
		const task = this.taskStateManagerService.getTaskById(taskId);
		if (task) {
			const processingStartTime = this.taskProcessingStartTimes.get(taskId);
			if (processingStartTime) {
				if (finalStatus === TaskStatus.COMPLETED) {
					const processingTime = Date.now() - processingStartTime;
					this.taskCompletionTimes.push(processingTime);
					// Keep only the last N completion times for a rolling average
					if (this.taskCompletionTimes.length > 1000) {
						this.taskCompletionTimes.shift();
					}
				}
				this.taskProcessingStartTimes.delete(taskId); // Clean up processing start time
			}

			// If a task failed or was cancelled, its wait time entry should also be cleared if it somehow wasn't already
			if (finalStatus === TaskStatus.FAILED || finalStatus === TaskStatus.CANCELLED) {
				this.taskWaitStartTimes.delete(taskId); // Ensure wait time is cleared
			}
			this.logger.debug(`Task execution ended for ${taskId} with status ${finalStatus}.`);
		} else {
			this.logger.warn(`Task ${taskId} not found when trying to track execution end.`);
		}
	}

	/**
	 * Start tracking wait time for a task when it's created/queued.
	 * @deprecated Use trackTaskQueued instead
	 */
	trackTaskWaitStart(taskId: string): void {
		this.trackTaskQueued(taskId);
	}

	/**
	 * Stop tracking wait time for a task when it starts processing.
	 * @deprecated This logic is now part of trackTaskExecutionStart
	 */
	trackTaskWaitEnd(taskId: string): void {
		// This logic is now handled by trackTaskExecutionStart
		if (this.taskWaitStartTimes.has(taskId)) {
			this.taskWaitStartTimes.delete(taskId);
			this.logger.debug(`Wait time tracking explicitly ended for ${taskId}.`);
		}
	}

	/**
	 * Record task completion details for metrics.
	 * Call this when a task moves to COMPLETED status.
	 * @deprecated This logic is now part of trackTaskExecutionEnd
	 */
	recordTaskCompletion(task: Task): void {
		if (task.status === TaskStatus.COMPLETED && this.taskProcessingStartTimes.has(task.id)) {
			const processingStartTime = this.taskProcessingStartTimes.get(task.id)!;
			const processingTime = (task.completedAt?.getTime() ?? Date.now()) - processingStartTime;
			this.taskCompletionTimes.push(processingTime);

			if (this.taskCompletionTimes.length > 1000) {
				this.taskCompletionTimes.shift();
			}
			this.taskProcessingStartTimes.delete(task.id);
		}
		// If a task failed or was cancelled, its wait time entry should also be cleared.
		if (task.status === TaskStatus.FAILED || task.status === TaskStatus.CANCELLED) {
			this.taskWaitStartTimes.delete(task.id);
			this.taskProcessingStartTimes.delete(task.id);
		}
	}

	/**
	 * Get current queue statistics.
	 * This method now relies on TaskStateManagerService for counts and task data.
	 */
	getQueueStats(): TaskQueueStats {
		const now = Date.now();
		// Corrected to use the injected taskStateManagerService
		const allTasksMap = this.taskStateManagerService.getAllTasksMap();
		const queuedTasksList = this.taskStateManagerService.getQueuedTasksList();

		// Calculate average wait time for tasks *currently* in the queue
		let totalWaitTime = 0;
		let waitTimeCount = 0;

		for (const queuedTask of queuedTasksList) {
			const waitStartTime = this.taskWaitStartTimes.get(queuedTask.id); // Corrected: using this.taskWaitStartTimes
			if (waitStartTime) {
				totalWaitTime += now - waitStartTime;
				waitTimeCount++;
			}
		}
		const avgWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0;

		// Calculate average processing time from recorded completions
		const avgProcessingTime =
			this.taskCompletionTimes.length > 0
				? this.taskCompletionTimes.reduce((sum, time) => sum + time, 0) /
					this.taskCompletionTimes.length
				: 0;

		// Count tasks by type and priority using all tasks from TaskStateManagerService
		const tasksByType: Record<string, number> = {};
		const tasksByPriority: Record<string, number> = {};

		for (const task of allTasksMap.values()) {
			tasksByType[task.taskType] = (tasksByType[task.taskType] || 0) + 1;
			const priorityKey = TaskPriority[task.priority];
			tasksByPriority[priorityKey] = (tasksByPriority[priorityKey] || 0) + 1;
		}

		return {
			// Corrected to use the injected taskStateManagerService for all counts
			queuedCount: this.taskStateManagerService.getQueuedTasksCount(),
			runningCount: this.taskStateManagerService.getRunningTasksCount(),
			pausedCount: this.taskStateManagerService.getPausedTasksCount(),
			completedCount: this.taskStateManagerService.getCompletedTasksCount(),
			failedCount: this.taskStateManagerService.getFailedTasksCount(),
			cancelledCount: this.taskStateManagerService.getCancelledTasksCount(),
			averageWaitTime: avgWaitTime,
			averageProcessingTime: avgProcessingTime,
			tasksByType,
			tasksByPriority,
		};
	}

	/**
	 * Logs the current metrics. Called periodically.
	 */
	private logCurrentMetrics(): void {
		const stats = this.getQueueStats();
		this.logger.info('Current Task Queue Metrics', {
			queued: stats.queuedCount,
			running: stats.runningCount,
			paused: stats.pausedCount,
			completed: stats.completedCount,
			failed: stats.failedCount,
			avgWaitTimeMs: parseFloat(stats.averageWaitTime.toFixed(2)),
			avgProcessingTimeMs: parseFloat(stats.averageProcessingTime.toFixed(2)),
		});
	}

	/**
	 * Clean up resources when service is destroyed (e.g., clear interval).
	 */
	cleanup(): void {
		if (this.metricsCollectionInterval) {
			clearInterval(this.metricsCollectionInterval);
			this.metricsCollectionInterval = null;
		}
		this.taskWaitStartTimes.clear();
		this.taskCompletionTimes = [];
	}

	// Removed collectMetrics as its purpose is now served by logCurrentMetrics and getQueueStats
	// private collectMetrics(): void { ... }
}
