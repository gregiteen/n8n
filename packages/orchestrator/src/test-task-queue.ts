/**
 * Test script for task queue management system
 */
import 'reflect-metadata';
import { initializeAllServices, getService } from './services';
import {
	TaskQueueService,
	TaskType,
	TaskPriority,
	CreateTaskRequest,
} from './services/task-queue.service';
import { Logger } from './logger';

// Initialize DI services
initializeAllServices();

// Get service instances
const logger = getService(Logger);
const taskQueueService = getService(TaskQueueService);

logger.info('Starting task queue test');

async function runTest() {
	try {
		// Create sample tasks
		const highPriorityTask: CreateTaskRequest = {
			name: 'High priority workflow',
			description: 'A test workflow with high priority',
			taskType: TaskType.WORKFLOW,
			priority: TaskPriority.HIGH,
			workflowId: '123456',
			input: {
				name: 'Test User',
				message: 'Hello from high priority task!',
			},
		};

		const mediumPriorityTask: CreateTaskRequest = {
			name: 'Medium priority workflow',
			description: 'A test workflow with medium priority',
			taskType: TaskType.WORKFLOW,
			priority: TaskPriority.MEDIUM,
			workflowId: '234567',
			input: {
				name: 'Test User',
				message: 'Hello from medium priority task!',
			},
		};

		const lowPriorityTask: CreateTaskRequest = {
			name: 'Low priority workflow',
			description: 'A test workflow with low priority',
			taskType: TaskType.WORKFLOW,
			priority: TaskPriority.LOW,
			workflowId: '345678',
			input: {
				name: 'Test User',
				message: 'Hello from low priority task!',
			},
		};

		// Add tasks to queue
		logger.info('Creating tasks...');
		const userId = 'test-user-1';

		const task1 = await taskQueueService.createTask(lowPriorityTask, userId);
		logger.info(`Created low priority task with ID: ${task1.id}`);

		const task2 = await taskQueueService.createTask(highPriorityTask, userId);
		logger.info(`Created high priority task with ID: ${task2.id}`);

		const task3 = await taskQueueService.createTask(mediumPriorityTask, userId);
		logger.info(`Created medium priority task with ID: ${task3.id}`);

		// Wait a moment
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Get queue stats
		const stats = taskQueueService.getQueueStats();
		logger.info('Queue stats:', stats);

		// Get all tasks
		const allTasks = taskQueueService.getAllTasks();
		logger.info(`Total tasks in queue: ${allTasks.length}`);

		// Update task progress for a task
		await taskQueueService.updateTaskProgress(task1.id, 25);
		logger.info(`Updated task ${task1.id} progress to 25%`);

		// Pause a task
		await taskQueueService.pauseTask(task2.id);
		logger.info(`Paused task ${task2.id}`);

		// Resume a task
		await taskQueueService.resumeTask(task2.id);
		logger.info(`Resumed task ${task2.id}`);

		// Cancel a task
		await taskQueueService.cancelTask(task3.id);
		logger.info(`Cancelled task ${task3.id}`);

		// Get queue stats after operations
		const updatedStats = taskQueueService.getQueueStats();
		logger.info('Updated queue stats:', updatedStats);

		// Complete test
		logger.info('Task queue test completed successfully');
	} catch (error: any) {
		logger.error('Error in task queue test:', { error: error.message, stack: error.stack });
	}
}

// Run the test
runTest().catch((error: any) => {
	logger.error('Unhandled error in test:', { error: error.message, stack: error.stack });
	process.exit(1);
});
