/**
 * Main API Service
 * Orchestrates all API modules and provides a unified interface
 */

import { HTTPClient } from './http-client';
import { WebSocketClient } from './websocket-client';
import { TaskAPI } from './task-api';
import { AgentAPI } from './agent-api';
import { WorkflowAPI } from './workflow-api';
import { UserAPI } from './user-api';
import { SystemAPI } from './system-api';

import type { APIConfig, WebSocketConfig } from './types';

export class APIService {
	private httpClient: HTTPClient;
	private wsClient: WebSocketClient;

	// API modules
	public readonly tasks: TaskAPI;
	public readonly agents: AgentAPI;
	public readonly workflows: WorkflowAPI;
	public readonly users: UserAPI;
	public readonly system: SystemAPI;

	constructor(config: APIConfig, wsConfig?: WebSocketConfig) {
		// Initialize HTTP client
		this.httpClient = new HTTPClient(config);

		// Initialize WebSocket client if config provided
		if (wsConfig) {
			this.wsClient = new WebSocketClient(wsConfig);
		} else {
			// Create a mock WebSocket client that doesn't connect
			this.wsClient = new WebSocketClient({ url: '' });
		}

		// Initialize API modules
		this.tasks = new TaskAPI(this.httpClient);
		this.agents = new AgentAPI(this.httpClient);
		this.workflows = new WorkflowAPI(this.httpClient);
		this.users = new UserAPI(this.httpClient);
		this.system = new SystemAPI(this.httpClient);
	}

	/**
	 * WebSocket Connection Management
	 */
	async initializeWebSocket(): Promise<void> {
		if (this.wsClient) {
			await this.wsClient.connect();
		}
	}

	disconnectWebSocket(): void {
		if (this.wsClient) {
			this.wsClient.disconnect();
		}
	}

	isWebSocketConnected(): boolean {
		return this.wsClient?.isConnected() ?? false;
	}

	/**
	 * WebSocket Event Subscriptions
	 */
	onTaskUpdate(callback: (task: any) => void): () => void {
		return this.wsClient.onTaskUpdate(callback);
	}

	onAgentStatusChange(callback: (agent: any) => void): () => void {
		return this.wsClient.onAgentStatusChange(callback);
	}

	onWorkflowUpdate(callback: (workflow: any) => void): () => void {
		return this.wsClient.onWorkflowUpdate(callback);
	}

	onSystemAlert(callback: (alert: any) => void): () => void {
		return this.wsClient.onSystemAlert(callback);
	}

	/**
	 * Authentication Methods (convenience)
	 */
	async login(email: string, password: string) {
		return this.users.login({ email, password });
	}

	async logout() {
		await this.users.logout();
		this.disconnectWebSocket();
	}

	async register(email: string, password: string, name: string) {
		return this.users.register({ email, password, name });
	}

	isAuthenticated(): boolean {
		return this.users.isAuthenticated();
	}

	/**
	 * Quick Access Methods
	 */
	async getCurrentUser() {
		return this.users.getCurrentUser();
	}

	async getSystemStatus() {
		return this.system.getSystemStatus();
	}

	/**
	 * Configuration Management
	 */
	updateConfig(newConfig: Partial<APIConfig>): void {
		this.httpClient.updateConfig(newConfig);
	}

	getConfig(): APIConfig {
		return this.httpClient.getConfig();
	}

	/**
	 * Token Management (convenience)
	 */
	setAuthToken(token: string): void {
		this.httpClient.setAuthToken(token);
	}

	clearAuthToken(): void {
		this.httpClient.clearAuthToken();
	}

	hasAuthToken(): boolean {
		return this.httpClient.hasAuthToken();
	}

	getAuthToken(): string | null {
		return this.httpClient.getAuthToken();
	}

	/**
	 * Connection Information
	 */
	getConnectionInfo(): {
		http: {
			baseUrl: string;
			authenticated: boolean;
		};
		websocket: {
			connected: boolean;
			url: string;
			reconnectAttempts: number;
		};
	} {
		return {
			http: {
				baseUrl: this.httpClient.getConfig().baseUrl,
				authenticated: this.httpClient.hasAuthToken(),
			},
			websocket: this.wsClient.getConnectionInfo(),
		};
	}

	/**
	 * Health Check
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const status = await this.system.getSystemHealth();
			return status.healthy;
		} catch {
			return false;
		}
	}
}
