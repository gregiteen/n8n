/**
 * API Module Index
 * Main entry point for the API service
 */

// Export main API service
export { APIService } from './api-service';

// Export individual API modules for direct access if needed
export { HTTPClient } from './http-client';
export { WebSocketClient } from './websocket-client';
export { TaskAPI } from './task-api';
export { AgentAPI } from './agent-api';
export { WorkflowAPI } from './workflow-api';
export { UserAPI } from './user-api';
export { SystemAPI } from './system-api';

// Export all types
export type * from './types';

// Export specific types that might be used elsewhere
export type { WorkflowExecution, WorkflowExecuteRequest } from './workflow-api';
export type { SystemStatus, SystemAlert } from './system-api';
export type { EventCallback } from './websocket-client';

// Default configurations
export const DEFAULT_API_CONFIG = {
	baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5678',
};

export const DEFAULT_WS_CONFIG = {
	url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5678/ws',
	reconnectInterval: 5000,
	maxReconnectAttempts: 10,
};

// Factory functions
export function createAPIService(
	config?: Partial<typeof DEFAULT_API_CONFIG>,
	wsConfig?: Partial<typeof DEFAULT_WS_CONFIG>,
) {
	return new APIService(
		{ ...DEFAULT_API_CONFIG, ...config },
		{ ...DEFAULT_WS_CONFIG, ...wsConfig },
	);
}

export function createMockAPIService() {
	// For development/testing - returns API service with mock configuration
	return new APIService({ baseUrl: 'http://localhost:3001' }, { url: 'ws://localhost:3001/ws' });
}
