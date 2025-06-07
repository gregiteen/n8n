export interface Task {
	id: string;
	name: string;
	type: TaskType;
	status: TaskStatus;
	progress: number;
	startTime: Date;
	endTime?: Date;
	estimatedDuration?: number;
	priority: TaskPriority;
	agentId?: string;
	workflowId?: string;
	description?: string;
	inputData?: any;
	outputData?: any;
	error?: string;
	logs?: TaskLog[];
}

export type TaskStatus = 'running' | 'queued' | 'completed' | 'failed' | 'paused' | 'cancelled';

export type TaskType =
	| 'chat'
	| 'analysis'
	| 'scraping'
	| 'generation'
	| 'writing'
	| 'image-analysis'
	| 'workflow'
	| 'decision';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TaskLog {
	id: string;
	taskId: string;
	timestamp: Date;
	level: 'info' | 'warn' | 'error' | 'debug';
	message: string;
	data?: any;
}

export interface Agent {
	id: string;
	name: string;
	type: TaskType;
	status: 'active' | 'idle' | 'busy' | 'offline';
	capabilities: string[];
	currentTaskId?: string;
	lastActivity: Date;
	avatar?: string;
}

export interface Workflow {
	id: string;
	name: string;
	description?: string;
	type?: string;
	status: 'active' | 'paused' | 'stopped';
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
	createdAt: Date;
	updatedAt: Date;
	executionCount: number;
	lastExecution?: Date;
}

export interface WorkflowNode {
	id: string;
	type: string;
	position: { x: number; y: number };
	data: any;
	status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface ChatMessage {
	id: string;
	agentId: string;
	content: string;
	role: 'user' | 'assistant' | 'system';
	timestamp: Date;
	attachments?: ChatAttachment[];
}

export interface ChatAttachment {
	id: string;
	name: string;
	type: 'file' | 'image' | 'url';
	url: string;
	size?: number;
}

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: 'user' | 'admin';
	preferences: UserPreferences;
}

export interface UserPreferences {
	theme: 'light' | 'dark' | 'system';
	notifications: {
		email: boolean;
		push: boolean;
		taskUpdates: boolean;
		systemAlerts: boolean;
	};
	dashboard: {
		refreshInterval: number;
		defaultView: 'grid' | 'list';
		showCompletedTasks: boolean;
	};
}

export interface SystemStats {
	activeTasks: number;
	queuedTasks: number;
	completedTasks: number;
	failedTasks: number;
	activeAgents: number;
	systemLoad: number;
	uptime: number;
}
