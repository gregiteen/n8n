/**
 * Task Metrics Service
 * Handles collection and reporting of metrics for the task queue
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import { Task, TaskPriority, TaskQueueStats, TaskStatus } from './task-types';

@Service()
export class TaskMetricsService {
	// Statistics tracking
	private taskCompletionTimes: number[] = [];
	private taskWaitTimes: Map<string, number> = new Map();
	private metricsCollectionInterval: NodeJS.Timeout | null = null;

	constructor(@Inject(Logger) private readonly logger: Logger) {
		this.logger = this.logger.scoped('task-metrics');

		// Start periodic metrics collection
		this.metricsCollectionInterval = setInterval(() => this.collectMetrics(), 60000); // Every minute
	}

	/**
	 * Start tracking wait time for a task
	 */
	trackTaskWaitStart(taskId: string): void {
		this.taskWaitTimes.set(taskId, new Date().getTime());
	}

	/**
	 * Stop tracking wait time for a task
	 */
	trackTaskWaitEnd(taskId: string): number | undefined {
		const waitStartTime = this.taskWaitTimes.get(taskId);
		if (waitStartTime) {
			const waitTime = new Date().getTime() - waitStartTime;
			this.taskWaitTimes.delete(taskId);
			return waitTime;
		}
		return undefined;
	}

	/**
	 * Record task completion time
	 */
	recordTaskCompletion(task: Task): void {
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
	 * Get queue statistics
	 */
	getQueueStats(
		tasks: Map<string, Task>,
		queuedTasks: Task[],
		runningTasksCount: number,
		pausedTasksCount: number,
		completedTasksCount: number,
		failedTasksCount: number,
	): TaskQueueStats {
		const now = new Date().getTime();
		const queuedTaskIds = queuedTasks.map((t) => t.id);

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

		for (const task of tasks.values()) {
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

		const cancelledCount = Array.from(tasks.values()).filter(
			(t) => t.status === TaskStatus.CANCELLED,
		).length;

		return {
			queuedCount: queuedTasks.length,
			runningCount: runningTasksCount,
			pausedCount: pausedTasksCount,
			completedCount: completedTasksCount,
			failedCount: failedTasksCount,
			cancelledCount,
			averageWaitTime: avgWaitTime,
			averageProcessingTime: avgProcessingTime,
			tasksByType,
			tasksByPriority,
		};
	}

	/**
	 * Clean up resources when service is destroyed
	 */
	cleanup(): void {
		if (this.metricsCollectionInterval) {
			clearInterval(this.metricsCollectionInterval);
			this.metricsCollectionInterval = null;
		}
	}

	/**
	 * Collect metrics
	 */
	private collectMetrics(): void {
		// This is just a placeholder method to be called by the interval
		// Actual metrics collection happens when getQueueStats is called by TaskQueueService
		this.logger.debug('Metrics collection cycle triggered');
	}
}
