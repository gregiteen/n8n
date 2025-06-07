/**
 * Store index - Exports all stores and provides setup utilities
 */

export { useTaskStore } from './useTaskStore';
export { useAgentStore } from './useAgentStore';
export { useWorkflowStore } from './useWorkflowStore';
export { useUserStore } from './useUserStore';

// Import the setup functions separately to avoid circular dependencies
import { setupTaskStoreWebSocket } from './useTaskStore';
import { setupAgentStoreWebSocket } from './useAgentStore';
import { setupWorkflowStoreWebSocket } from './useWorkflowStore';

// Setup function to initialize all real-time connections
export const setupStores = () => {
	// Initialize all WebSocket connections for real-time updates
	setupTaskStoreWebSocket();
	setupAgentStoreWebSocket();
	setupWorkflowStoreWebSocket();
};

// Store initialization for app startup
export const initializeStores = async () => {
	const { useUserStore } = await import('./useUserStore');
	const { useTaskStore } = await import('./useTaskStore');
	const { useAgentStore } = await import('./useAgentStore');
	const { useWorkflowStore } = await import('./useWorkflowStore');

	const userStore = useUserStore.getState();

	// Initialize authentication first
	await userStore.initializeAuth();

	// If user is authenticated, setup real-time connections
	if (userStore.isAuthenticated) {
		setupStores();

		// Load initial data
		const taskStore = useTaskStore.getState();
		const agentStore = useAgentStore.getState();
		const workflowStore = useWorkflowStore.getState();

		try {
			await Promise.all([
				taskStore.fetchTasks(),
				taskStore.fetchStats(),
				agentStore.fetchAgents(),
				agentStore.fetchActiveAgents(),
				workflowStore.fetchWorkflows(),
			]);
		} catch (error) {
			console.error('Failed to load initial data:', error);
		}
	}
};
