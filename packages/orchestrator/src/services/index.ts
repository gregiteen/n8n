/**
 * Services module
 * Exports all services and provides initialization functions
 */

import { initializeServices, container } from '../di';
import { Logger } from '../logger';

// Import all services
import {
	TaskQueueService,
	TaskExecutorService,
	TaskMetricsService,
	TaskStateManagerService,
	TaskErrorHandlerService,
} from './task-management';
import { WorkflowExecutionService } from './workflow-execution.service';
import { TaskController } from '../controllers/task.controller';
import { MCPService } from '../mcp/mcp.service';
import { MCPNodeWrapper } from '../mcp/mcp-node-wrapper';
import { MCPController } from '../controllers/mcp.controller';
import { NodeDiscoveryService } from '../mcp/node-discovery.service';
import { N8nClient } from './n8n-client';

/**
 * Services registry
 * Add all services that should be automatically initialized here
 */
export const SERVICES = [
	Logger,
	N8nClient,
	WorkflowExecutionService,
	TaskQueueService,
	TaskExecutorService,
	TaskMetricsService,
	TaskStateManagerService,
	TaskErrorHandlerService,
	TaskController,
	MCPNodeWrapper,
	NodeDiscoveryService,
	MCPService,
	MCPController,
];

/**
 * Initialize all services
 */
export function initializeAllServices(): void {
	initializeServices(SERVICES);
}

/**
 * Get a service instance
 * @param serviceClass The service class to get
 */
export function getService<T>(serviceClass: new (...args: any[]) => T): T {
	return container.resolve<T>(serviceClass);
}

// Export all services
export {
	TaskQueueService,
	TaskExecutorService,
	TaskMetricsService,
	TaskStateManagerService,
	TaskErrorHandlerService,
	WorkflowExecutionService,
	MCPService,
	MCPNodeWrapper,
	NodeDiscoveryService,
	N8nClient,
};

// Export all controllers
export { TaskController, MCPController };
