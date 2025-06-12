/**
 * Task Queue Types
 * Contains all type definitions for the task queue system
 */

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
export interface SystemResources {
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
