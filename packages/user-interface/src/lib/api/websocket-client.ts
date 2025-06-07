/**
 * WebSocket Client
 * Handles real-time communication with the backend
 */

import type {
	WebSocketConfig,
	WebSocketMessage,
	TaskUpdateEvent,
	AgentStatusEvent,
	WorkflowUpdateEvent,
} from './types';

export type EventCallback<T = any> = (data: T) => void;

export class WebSocketClient {
	private ws: WebSocket | null = null;
	private config: WebSocketConfig;
	private eventListeners: Map<string, Set<EventCallback>> = new Map();
	private reconnectAttempts = 0;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private isConnecting = false;

	constructor(config: WebSocketConfig) {
		this.config = {
			reconnectInterval: 5000,
			maxReconnectAttempts: 10,
			...config,
		};
	}

	/**
	 * Connection Management
	 */
	async connect(): Promise<void> {
		if (this.isConnecting || this.isConnected()) {
			return;
		}

		this.isConnecting = true;

		try {
			this.ws = new WebSocket(this.config.url);

			this.ws.onopen = () => {
				console.log('WebSocket connected');
				this.isConnecting = false;
				this.reconnectAttempts = 0;
				this.emit('connected', {});
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					this.handleMessage(message);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};

			this.ws.onclose = (event) => {
				console.log('WebSocket disconnected:', event.code, event.reason);
				this.isConnecting = false;
				this.ws = null;
				this.emit('disconnected', { code: event.code, reason: event.reason });

				if (!event.wasClean) {
					this.scheduleReconnect();
				}
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				this.isConnecting = false;
				this.emit('error', error);
			};
		} catch (error) {
			this.isConnecting = false;
			console.error('Failed to create WebSocket connection:', error);
			throw error;
		}
	}

	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close(1000, 'Client disconnect');
			this.ws = null;
		}

		this.isConnecting = false;
		this.reconnectAttempts = 0;
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	/**
	 * Message Handling
	 */
	private handleMessage(message: WebSocketMessage): void {
		console.log('Received WebSocket message:', message.type);

		// Emit the specific event type
		this.emit(message.type, message.data);

		// Also emit a generic message event
		this.emit('message', message);
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
			console.error('Max reconnection attempts reached');
			this.emit('max_reconnect_attempts', {});
			return;
		}

		this.reconnectAttempts++;
		const delay = this.config.reconnectInterval || 5000;

		console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

		this.reconnectTimer = setTimeout(() => {
			this.connect().catch((error) => {
				console.error('Reconnection failed:', error);
				this.scheduleReconnect();
			});
		}, delay);
	}

	/**
	 * Event Subscription
	 */
	on(event: string, callback: EventCallback): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}

		this.eventListeners.get(event)!.add(callback);

		// Return unsubscribe function
		return () => {
			const listeners = this.eventListeners.get(event);
			if (listeners) {
				listeners.delete(callback);
				if (listeners.size === 0) {
					this.eventListeners.delete(event);
				}
			}
		};
	}

	off(event: string, callback?: EventCallback): void {
		if (!callback) {
			this.eventListeners.delete(event);
			return;
		}

		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this.eventListeners.delete(event);
			}
		}
	}

	private emit(event: string, data: any): void {
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

	/**
	 * Specialized Event Subscriptions
	 */
	onTaskUpdate(callback: EventCallback<TaskUpdateEvent['data']>): () => void {
		return this.on('task_update', callback);
	}

	onAgentStatusChange(callback: EventCallback<AgentStatusEvent['data']>): () => void {
		return this.on('agent_status', callback);
	}

	onWorkflowUpdate(callback: EventCallback<WorkflowUpdateEvent['data']>): () => void {
		return this.on('workflow_update', callback);
	}

	onSystemAlert(callback: EventCallback): () => void {
		return this.on('system_alert', callback);
	}

	/**
	 * Connection Status
	 */
	getConnectionInfo(): {
		connected: boolean;
		url: string;
		reconnectAttempts: number;
	} {
		return {
			connected: this.isConnected(),
			url: this.config.url,
			reconnectAttempts: this.reconnectAttempts,
		};
	}
}
