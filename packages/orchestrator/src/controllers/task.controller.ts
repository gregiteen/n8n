/**
 * Task Queue Controller
 * REST API endpoints for managing tasks in the queue
 */

import { Service, Inject } from '../di';
import type { Request, Response } from 'express';
import { Logger } from '../logger';
import { TaskQueueService, TaskStatus } from '../services/task-queue.service';

@Service()
export class TaskController {
	constructor(
		@Inject(Logger) private readonly logger: Logger,
		@Inject(TaskQueueService) private readonly taskQueue: TaskQueueService,
	) {
		this.logger = this.logger.scoped('task-controller');
	}

	/**
	 * Get all tasks
	 */
	async getAllTasks(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.headers['user-id'] as string;
			let tasks;

			if (req.query.status) {
				const status = req.query.status as TaskStatus;
				tasks = this.taskQueue.getTasksByStatus(status);
			} else if (req.query.type) {
				const type = req.query.type as string;
				tasks = this.taskQueue.getTasksByType(type);
			} else if (userId) {
				tasks = this.taskQueue.getTasksByUserId(userId);
			} else {
				tasks = this.taskQueue.getAllTasks();
			}

			// Apply pagination if requested
			if (req.query.limit || req.query.offset) {
				const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
				const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

				if (limit) {
					tasks = tasks.slice(offset, offset + limit);
				} else {
					tasks = tasks.slice(offset);
				}
			}

			res.json(tasks);
		} catch (error: any) {
			this.logger.error('Error getting tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to get tasks' });
		}
	}

	/**
	 * Get task by ID
	 */
	async getTaskById(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			const task = this.taskQueue.getTaskById(taskId);

			if (!task) {
				res.status(404).json({ error: `Task ${taskId} not found` });
				return;
			}

			res.json(task);
		} catch (error: any) {
			this.logger.error(`Error getting task ${req.params.id}`, { error });
			res.status(500).json({ error: error.message || 'Failed to get task' });
		}
	}

	/**
	 * Create a new task
	 */
	async createTask(req: Request, res: Response): Promise<void> {
		try {
			const userId = (req.headers['user-id'] as string) || 'default-user';
			const taskData = req.body;

			// Validate required fields
			if (!taskData.name || !taskData.taskType) {
				res.status(400).json({ error: 'Name and taskType are required' });
				return;
			}

			const task = await this.taskQueue.createTask(taskData, userId);
			res.status(201).json(task);
		} catch (error: any) {
			this.logger.error('Error creating task', { error });
			res.status(500).json({ error: error.message || 'Failed to create task' });
		}
	}

	/**
	 * Update task
	 */
	async updateTask(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			const updates = req.body;

			const updatedTask = await this.taskQueue.updateTask(taskId, updates);
			res.json(updatedTask);
		} catch (error: any) {
			this.logger.error(`Error updating task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to update task' });
			}
		}
	}

	/**
	 * Delete task
	 */
	async deleteTask(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			await this.taskQueue.deleteTask(taskId);
			res.status(204).send();
		} catch (error: any) {
			this.logger.error(`Error deleting task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to delete task' });
			}
		}
	}

	/**
	 * Pause task
	 */
	async pauseTask(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			const task = await this.taskQueue.pauseTask(taskId);
			res.json(task);
		} catch (error: any) {
			this.logger.error(`Error pausing task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to pause task' });
			}
		}
	}

	/**
	 * Resume task
	 */
	async resumeTask(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			const task = await this.taskQueue.resumeTask(taskId);
			res.json(task);
		} catch (error: any) {
			this.logger.error(`Error resuming task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to resume task' });
			}
		}
	}

	/**
	 * Cancel task
	 */
	async cancelTask(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			const task = await this.taskQueue.cancelTask(taskId);
			res.json(task);
		} catch (error: any) {
			this.logger.error(`Error cancelling task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to cancel task' });
			}
		}
	}

	/**
	 * Retry task
	 */
	async retryTask(req: Request, res: Response): Promise<void> {
		try {
			const taskId = req.params.id;
			const task = await this.taskQueue.retryTask(taskId);
			res.json(task);
		} catch (error: any) {
			this.logger.error(`Error retrying task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to retry task' });
			}
		}
	}

	/**
	 * Get queue statistics
	 */
	async getQueueStats(_req: Request, res: Response): Promise<void> {
		try {
			const stats = this.taskQueue.getQueueStats();
			res.json(stats);
		} catch (error: any) {
			this.logger.error('Error getting queue stats', { error });
			res.status(500).json({ error: error.message || 'Failed to get queue statistics' });
		}
	}

	/**
	 * Cancel all tasks
	 */
	async cancelAllTasks(_req: Request, res: Response): Promise<void> {
		try {
			const count = await this.taskQueue.cancelAllTasks();
			res.json({ message: `Cancelled ${count} tasks` });
		} catch (error: any) {
			this.logger.error('Error cancelling all tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to cancel all tasks' });
		}
	}

	/**
	 * Pause all running tasks
	 */
	async pauseAllTasks(_req: Request, res: Response): Promise<void> {
		try {
			const count = await this.taskQueue.pauseAllRunningTasks();
			res.json({ message: `Paused ${count} running tasks` });
		} catch (error: any) {
			this.logger.error('Error pausing all tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to pause all tasks' });
		}
	}

	/**
	 * Resume all paused tasks
	 */
	async resumeAllTasks(_req: Request, res: Response): Promise<void> {
		try {
			const count = await this.taskQueue.resumeAllPausedTasks();
			res.json({ message: `Resumed ${count} paused tasks` });
		} catch (error: any) {
			this.logger.error('Error resuming all tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to resume all tasks' });
		}
	}
}
