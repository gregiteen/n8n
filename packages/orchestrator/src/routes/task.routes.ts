import { Express, Request, Response } from 'express';
import { getService } from '../services';
import {
	TaskQueueService,
	TaskStatus,
	TaskPriority,
	TaskType,
	CreateTaskRequest,
	UpdateTaskRequest,
} from '../services/task-queue.service';

/**
 * Configure task queue routes
 */
export function configureTaskRoutes(app: Express): void {
	// Get task queue service instance
	const taskQueueService = getService(TaskQueueService);

	// Task routes

	// Get all tasks
	app.get('/api/tasks', async (req: Request, res: Response) => {
		try {
			const userId = (req.headers['user-id'] as string) || 'default-user';
			let tasks;

			if (req.query.status) {
				const status = req.query.status as TaskStatus;
				tasks = taskQueueService.getTasksByStatus(status);
			} else if (req.query.type) {
				const type = req.query.type as string;
				tasks = taskQueueService.getTasksByType(type);
			} else if (userId) {
				tasks = taskQueueService.getTasksByUserId(userId);
			} else {
				tasks = taskQueueService.getAllTasks();
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
			console.error('Error getting tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to get tasks' });
		}
	});

	// Get task by ID
	app.get('/api/tasks/:id', async (req, res) => {
		try {
			const taskId = req.params.id;
			const task = taskQueueService.getTaskById(taskId);

			if (!task) {
				res.status(404).json({ error: `Task ${taskId} not found` });
				return;
			}

			res.json(task);
		} catch (error: any) {
			console.error(`Error getting task ${req.params.id}`, { error });
			res.status(500).json({ error: error.message || 'Failed to get task' });
		}
	});

	// Create a new task
	app.post('/api/tasks', async (req, res) => {
		try {
			const userId = (req.headers['user-id'] as string) || 'default-user';
			const taskData = req.body;

			// Validate required fields
			if (!taskData.name || !taskData.taskType) {
				res.status(400).json({ error: 'Name and taskType are required' });
				return;
			}

			const task = await taskQueueService.createTask(taskData, userId);
			res.status(201).json(task);
		} catch (error: any) {
			console.error('Error creating task', { error });
			res.status(500).json({ error: error.message || 'Failed to create task' });
		}
	});

	// Update task
	app.put('/api/tasks/:id', async (req, res) => {
		try {
			const taskId = req.params.id;
			const updates = req.body;

			const updatedTask = await taskQueueService.updateTask(taskId, updates);
			res.json(updatedTask);
		} catch (error: any) {
			console.error(`Error updating task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to update task' });
			}
		}
	});

	// Delete task
	app.delete('/api/tasks/:id', async (req, res) => {
		try {
			const taskId = req.params.id;
			await taskQueueService.deleteTask(taskId);
			res.status(204).send();
		} catch (error: any) {
			console.error(`Error deleting task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to delete task' });
			}
		}
	});

	// Task actions

	// Pause task
	app.post('/api/tasks/:id/pause', async (req, res) => {
		try {
			const taskId = req.params.id;
			const task = await taskQueueService.pauseTask(taskId);
			res.json(task);
		} catch (error: any) {
			console.error(`Error pausing task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to pause task' });
			}
		}
	});

	// Resume task
	app.post('/api/tasks/:id/resume', async (req, res) => {
		try {
			const taskId = req.params.id;
			const task = await taskQueueService.resumeTask(taskId);
			res.json(task);
		} catch (error: any) {
			console.error(`Error resuming task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to resume task' });
			}
		}
	});

	// Cancel task
	app.post('/api/tasks/:id/cancel', async (req, res) => {
		try {
			const taskId = req.params.id;
			const task = await taskQueueService.cancelTask(taskId);
			res.json(task);
		} catch (error: any) {
			console.error(`Error cancelling task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to cancel task' });
			}
		}
	});

	// Retry task
	app.post('/api/tasks/:id/retry', async (req, res) => {
		try {
			const taskId = req.params.id;
			const task = await taskQueueService.retryTask(taskId);
			res.json(task);
		} catch (error: any) {
			console.error(`Error retrying task ${req.params.id}`, { error });

			if (error.message.includes('not found')) {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message || 'Failed to retry task' });
			}
		}
	});

	// Queue statistics
	app.get('/api/tasks/stats', async (_req, res) => {
		try {
			const stats = taskQueueService.getQueueStats();
			res.json(stats);
		} catch (error: any) {
			console.error('Error getting queue stats', { error });
			res.status(500).json({ error: error.message || 'Failed to get queue statistics' });
		}
	});

	// Batch operations

	// Cancel all tasks
	app.post('/api/tasks/cancel-all', async (_req, res) => {
		try {
			const count = await taskQueueService.cancelAllTasks();
			res.json({ message: `Cancelled ${count} tasks` });
		} catch (error: any) {
			console.error('Error cancelling all tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to cancel all tasks' });
		}
	});

	// Pause all tasks
	app.post('/api/tasks/pause-all', async (_req, res) => {
		try {
			const count = await taskQueueService.pauseAllRunningTasks();
			res.json({ message: `Paused ${count} running tasks` });
		} catch (error: any) {
			console.error('Error pausing all tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to pause all tasks' });
		}
	});

	// Resume all tasks
	app.post('/api/tasks/resume-all', async (_req, res) => {
		try {
			const count = await taskQueueService.resumeAllPausedTasks();
			res.json({ message: `Resumed ${count} paused tasks` });
		} catch (error: any) {
			console.error('Error resuming all tasks', { error });
			res.status(500).json({ error: error.message || 'Failed to resume all tasks' });
		}
	});
}
