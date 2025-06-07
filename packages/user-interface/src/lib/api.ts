/**
 * API service for connecting User Interface to AI Orchestrator
 * Handles all backend communication including real-time features
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

export interface AgentChatRequest {
	agentId: string;
	message: string;
	sessionId?: string;
	context?: any;
}

export interface WorkflowExecuteRequest {
	workflowId: string;
	inputData?: any;
	triggerNode?: string;
}

export class APIService {
	private config: APIConfig;
	private wsConfig?: WebSocketConfig;
	private websocket?: WebSocket;
	private reconnectAttempts = 0;
	private eventListeners = new Map<string, Function[]>();

	constructor(config: APIConfig, wsConfig?: WebSocketConfig) {
		this.config = config;
		this.wsConfig = wsConfig;

		// Initialize WebSocket if config provided
		if (wsConfig) {
			this.initializeWebSocket();
		}
	}

	// ============================================================================
	// HTTP API Methods
	// ============================================================================

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.config.baseUrl}${endpoint}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		// Add custom headers
		if (options.headers) {
			Object.assign(headers, options.headers);
		}

		if (this.config.apiKey) {
			headers['Authorization'] = `Bearer ${this.config.apiKey}`;
		}

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API request failed: ${response.status} ${errorText}`);
		}

		return response.json();
	}

	// ============================================================================
	// Task Management
	// ============================================================================

	async getTasks(): Promise<Task[]> {
		return this.request<Task[]>('/api/tasks');
	}

	async getTask(id: string): Promise<Task> {
		return this.request<Task>(`/api/tasks/${id}`);
	}

	async createTask(data: TaskCreateRequest): Promise<Task> {
		return this.request<Task>('/api/tasks', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateTask(id: string, data: TaskUpdateRequest): Promise<Task> {
		return this.request<Task>(`/api/tasks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteTask(id: string): Promise<void> {
		await this.request(`/api/tasks/${id}`, {
			method: 'DELETE',
		});
	}

	async cancelTask(id: string): Promise<Task> {
		return this.request<Task>(`/api/tasks/${id}/cancel`, {
			method: 'POST',
		});
	}

	async pauseTask(id: string): Promise<Task> {
		return this.request<Task>(`/api/tasks/${id}/pause`, {
			method: 'POST',
		});
	}

	async resumeTask(id: string): Promise<Task> {
		return this.request<Task>(`/api/tasks/${id}/resume`, {
			method: 'POST',
		});
	}

	// ============================================================================
	// Agent Management
	// ============================================================================

	async getAgents(): Promise<Agent[]> {
		return this.request<Agent[]>('/api/agents');
	}

	async getAgent(id: string): Promise<Agent> {
		return this.request<Agent>(`/api/agents/${id}`);
	}

	async getActiveAgents(): Promise<Agent[]> {
		return this.request<Agent[]>('/api/agents?status=active');
	}

	async createAgent(data: Partial<Agent>): Promise<Agent> {
		return this.request<Agent>('/api/agents', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
		return this.request<Agent>(`/api/agents/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteAgent(id: string): Promise<void> {
		await this.request(`/api/agents/${id}`, {
			method: 'DELETE',
		});
	}

	async sendChatMessage(data: AgentChatRequest): Promise<AgentChatMessage> {
		return this.request<AgentChatMessage>('/api/agents/chat', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async getChatHistory(agentId: string, sessionId?: string): Promise<AgentChatMessage[]> {
		const params = sessionId ? `?sessionId=${sessionId}` : '';
		return this.request<AgentChatMessage[]>(`/api/agents/${agentId}/chat/history${params}`);
	}

	async clearChatHistory(agentId: string, sessionId?: string): Promise<void> {
		const params = sessionId ? `?sessionId=${sessionId}` : '';
		await this.request(`/api/agents/${agentId}/chat/history${params}`, {
			method: 'DELETE',
		});
	}

	// ============================================================================
	// Workflow Management
	// ============================================================================

	async getWorkflows(): Promise<Workflow[]> {
		return this.request<Workflow[]>('/api/workflows');
	}

	async getWorkflow(id: string): Promise<Workflow> {
		return this.request<Workflow>(`/api/workflows/${id}`);
	}

	async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
		return this.request<Workflow>('/api/workflows', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
		return this.request<Workflow>(`/api/workflows/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteWorkflow(id: string): Promise<void> {
		await this.request(`/api/workflows/${id}`, {
			method: 'DELETE',
		});
	}

	async executeWorkflow(workflowId: string, inputData?: any): Promise<{ executionId: string }> {
		return this.request<{ executionId: string }>('/api/workflows/execute', {
			method: 'POST',
			body: JSON.stringify({ workflowId, inputData }),
		});
	}

	async getWorkflowExecutions(workflowId?: string): Promise<any[]> {
		const params = workflowId ? `?workflowId=${workflowId}` : '';
		return this.request<any[]>(`/api/workflows/executions${params}`);
	}

	async stopWorkflowExecution(executionId: string): Promise<void> {
		await this.request(`/api/workflows/executions/${executionId}/stop`, {
			method: 'POST',
		});
	}

	async stopWorkflow(id: string): Promise<void> {
		await this.request(`/api/workflows/${id}/stop`, {
			method: 'POST',
		});
	}

	// ============================================================================
	// User Management
	// ============================================================================

	async getCurrentUser(): Promise<User> {
		return this.request<User>('/api/user/me');
	}

	async updateUserSettings(settings: Partial<User>): Promise<User> {
		return this.request<User>('/api/user/me', {
			method: 'PUT',
			body: JSON.stringify(settings),
		});
	}

	async updateUser(id: string, data: Partial<User>): Promise<User> {
		return this.request<User>(`/api/users/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	// ============================================================================
	// Authentication
	// ============================================================================

	async login(email: string, password: string): Promise<{ user: User; token: string }> {
		return this.request<{ user: User; token: string }>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		});
	}

	async logout(): Promise<void> {
		await this.request('/api/auth/logout', {
			method: 'POST',
		});
	}

	async register(data: { email: string; password: string; name: string }): Promise<{
		user: User;
		token: string;
	}> {
		return this.request<{ user: User; token: string }>('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async refreshToken(): Promise<{ token: string }> {
		return this.request<{ token: string }>('/api/auth/refresh', {
			method: 'POST',
		});
	}

	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await this.request('/api/auth/change-password', {
			method: 'POST',
			body: JSON.stringify({ currentPassword, newPassword }),
		});
	}

	// ============================================================================
	// Token Management
	// ============================================================================

	setAuthToken(token: string): void {
		this.config.apiKey = token;
		// Store in localStorage for persistence
		if (typeof window !== 'undefined') {
			localStorage.setItem('auth_token', token);
		}
	}

	clearAuthToken(): void {
		this.config.apiKey = undefined;
		// Remove from localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem('auth_token');
		}
	}

	hasAuthToken(): boolean {
		// Check both config and localStorage
		if (this.config.apiKey) {
			return true;
		}

		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('auth_token');
			if (token) {
				this.config.apiKey = token;
				return true;
			}
		}

		return false;
	}

	// ============================================================================
	// System Status
	// ============================================================================

	async getSystemStatus(): Promise<{
		status: 'healthy' | 'degraded' | 'down';
		services: Record<string, { status: string; latency?: number }>;
		version: string;
		uptime: number;
	}> {
		return this.request('/api/status');
	}

	async getSystemStats(): Promise<{
		activeTasks: number;
		queuedTasks: number;
		completedTasks: number;
		failedTasks: number;
		activeAgents: number;
		systemLoad: number;
		uptime: number;
	}> {
		return this.request('/api/stats');
	}

	// ============================================================================
	// WebSocket Real-time Features
	// ============================================================================

	private initializeWebSocket(): void {
		if (!this.wsConfig) return;

		try {
			const wsUrl = `${this.wsConfig.url}?userId=${this.config.userId || 'anonymous'}`;
			this.websocket = new WebSocket(wsUrl);

			this.websocket.onopen = () => {
				console.log('WebSocket connected');
				this.reconnectAttempts = 0;
				this.emit('ws:connected');
			};

			this.websocket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.handleWebSocketMessage(data);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};

			this.websocket.onclose = () => {
				console.log('WebSocket disconnected');
				this.emit('ws:disconnected');
				this.scheduleReconnect();
			};

			this.websocket.onerror = (error) => {
				console.error('WebSocket error:', error);
				this.emit('ws:error', error);
			};
		} catch (error) {
			console.error('Failed to initialize WebSocket:', error);
		}
	}

	private handleWebSocketMessage(data: any): void {
		const { type, payload } = data;

		switch (type) {
			case 'task:status':
				this.emit('task:status', payload);
				break;
			case 'task:progress':
				this.emit('task:progress', payload);
				break;
			case 'task:completed':
				this.emit('task:completed', payload);
				break;
			case 'task:failed':
				this.emit('task:failed', payload);
				break;
			case 'agent:message':
				this.emit('agent:message', payload);
				break;
			case 'workflow:started':
				this.emit('workflow:started', payload);
				break;
			case 'workflow:completed':
				this.emit('workflow:completed', payload);
				break;
			case 'system:alert':
				this.emit('system:alert', payload);
				break;
			default:
				console.warn('Unknown WebSocket message type:', type);
		}
	}

	private scheduleReconnect(): void {
		if (!this.wsConfig) return;

		const maxAttempts = this.wsConfig.maxReconnectAttempts || 10;
		const interval = this.wsConfig.reconnectInterval || 5000;

		if (this.reconnectAttempts < maxAttempts) {
			this.reconnectAttempts++;

			setTimeout(() => {
				console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${maxAttempts})`);
				this.initializeWebSocket();
			}, interval);
		} else {
			console.error('Max WebSocket reconnection attempts reached');
			this.emit('ws:max_reconnect_reached');
		}
	}

	// ============================================================================
	// Event Handling
	// ============================================================================

	on(event: string, callback: Function): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(callback);
	}

	off(event: string, callback: Function): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	private emit(event: string, data?: any): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(`Error in event listener for ${event}:`, error);
				}
			});
		}
	}

	// ============================================================================
	// Real-time Event Subscription Helpers
	// ============================================================================

	onTaskUpdate(callback: (task: Task) => void): void {
		this.on('task:status', callback);
	}

	onTaskStatusChange(
		callback: (data: { taskId: string; status: TaskStatus; progress?: number }) => void,
	): void {
		this.on('task:progress', callback);
	}

	onSystemStatsUpdate(callback: (stats: any) => void): void {
		this.on('system:stats', callback);
	}

	onAgentUpdate(callback: (agent: Agent) => void): void {
		this.on('agent:status', callback);
	}

	onAgentStatusChange(
		callback: (data: { agentId: string; status: Agent['status'] }) => void,
	): void {
		this.on('agent:status', callback);
	}

	onWorkflowUpdate(callback: (workflow: Workflow) => void): void {
		this.on('workflow:status', callback);
	}

	onWorkflowStatusChange(
		callback: (data: { workflowId: string; status: Workflow['status'] }) => void,
	): void {
		this.on('workflow:status', callback);
	}

	// ============================================================================
	// Connection Management
	// ============================================================================

	connect(): void {
		if (this.wsConfig && !this.websocket) {
			this.initializeWebSocket();
		}
	}

	disconnect(): void {
		if (this.websocket) {
			this.websocket.close();
			this.websocket = undefined;
		}
		this.eventListeners.clear();
	}

	isConnected(): boolean {
		return this.websocket?.readyState === WebSocket.OPEN;
	}

	// ============================================================================
	// Utility Methods
	// ============================================================================

	setApiKey(apiKey: string): void {
		this.config.apiKey = apiKey;
	}

	setUserId(userId: string): void {
		this.config.userId = userId;
	}

	getConnectionStatus(): {
		http: boolean;
		websocket: boolean;
		reconnectAttempts: number;
	} {
		return {
			http: true, // Assume HTTP is available if we can create the service
			websocket: this.isConnected(),
			reconnectAttempts: this.reconnectAttempts,
		};
	}
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createAPIService(config: APIConfig, wsConfig?: WebSocketConfig): APIService {
	return new APIService(config, wsConfig);
}

export function createMockAPIService(): APIService {
	// For development/testing - returns API service with mock data
	return new APIService({ baseUrl: 'http://localhost:3001' }, { url: 'ws://localhost:3001/ws' });
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_API_CONFIG: APIConfig = {
	baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

export const DEFAULT_WS_CONFIG: WebSocketConfig = {
	url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
	reconnectInterval: 5000,
	maxReconnectAttempts: 10,
};
