/**
 * API Service Types
 * Common types and interfaces used across API modules
 */

import type { Task, Agent, Workflow, User, TaskStatus, TaskType } from '@/types';

export interface APIConfig {
	baseUrl: string;
	apiKey?: string;
	userId?: string;
}

export interface WebSocketConfig {
	url: string;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
}

export interface TaskCreateRequest {
	name: string;
	type: TaskType;
	description?: string;
	agentId?: string;
	workflowId?: string;
	inputData?: any;
	priority?: 'low' | 'medium' | 'high';
}

export interface TaskUpdateRequest {
	status?: TaskStatus;
	progress?: number;
	outputData?: any;
	error?: string;
}

export interface AgentChatMessage {
	id: string;
	agentId: string;
	message: string;
	timestamp: Date;
	role: 'user' | 'agent';
	metadata?: any;
}

export interface TaskStats {
	total: number;
	running: number;
	queued: number;
	completed: number;
	failed: number;
}

export interface SystemStats {
	tasks: TaskStats;
	agents: {
		total: number;
		active: number;
		idle: number;
	};
	workflows: {
		total: number;
		active: number;
	};
}

// WebSocket Events
export interface WebSocketMessage {
	type: string;
	data: any;
	timestamp: Date;
}

export interface TaskUpdateEvent {
	type: 'task_update';
	data: Task;
}

export interface AgentStatusEvent {
	type: 'agent_status';
	data: {
		agentId: string;
		status: string;
		lastActivity: Date;
	};
}

export interface WorkflowUpdateEvent {
	type: 'workflow_update';
	data: Workflow;
}

// HTTP Client Types
export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	headers?: Record<string, string>;
	body?: string;
	signal?: AbortSignal;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	name: string;
}

export interface LoginResponse {
	user: User;
	tokens: AuthTokens;
}
