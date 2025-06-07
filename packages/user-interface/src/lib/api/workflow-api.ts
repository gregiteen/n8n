/**
 * Workflow API
 * Handles all workflow-related API operations
 */

import type { Workflow } from '@/types';
import type { HTTPClient } from './http-client';

export interface WorkflowExecution {
	id: string;
	workflowId: string;
	status: 'running' | 'completed' | 'failed' | 'cancelled';
	startTime: Date;
	endTime?: Date;
	inputData?: any;
	outputData?: any;
	error?: string;
}

export interface WorkflowExecuteRequest {
	inputData?: any;
	waitForCompletion?: boolean;
}

export class WorkflowAPI {
	constructor(private client: HTTPClient) {}

	/**
	 * Workflow CRUD Operations
	 */
	async getWorkflows(): Promise<Workflow[]> {
		return this.client.request<Workflow[]>('/api/workflows');
	}

	async getWorkflow(id: string): Promise<Workflow> {
		return this.client.request<Workflow>(`/api/workflows/${id}`);
	}

	async getActiveWorkflows(): Promise<Workflow[]> {
		return this.client.request<Workflow[]>('/api/workflows?status=active');
	}

	async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
		return this.client.request<Workflow>('/api/workflows', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
		return this.client.request<Workflow>(`/api/workflows/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteWorkflow(id: string): Promise<void> {
		await this.client.request(`/api/workflows/${id}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Workflow Execution Operations
	 */
	async executeWorkflow(
		id: string,
		request: WorkflowExecuteRequest = {},
	): Promise<WorkflowExecution> {
		return this.client.request<WorkflowExecution>(`/api/workflows/${id}/execute`, {
			method: 'POST',
			body: JSON.stringify(request),
		});
	}

	async stopWorkflow(executionId: string): Promise<WorkflowExecution> {
		return this.client.request<WorkflowExecution>(`/api/workflow-executions/${executionId}/stop`, {
			method: 'POST',
		});
	}

	async getWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
		return this.client.request<WorkflowExecution>(`/api/workflow-executions/${executionId}`);
	}

	async getWorkflowExecutions(workflowId: string, limit?: number): Promise<WorkflowExecution[]> {
		const query = limit ? `?limit=${limit}` : '';
		return this.client.request<WorkflowExecution[]>(
			`/api/workflows/${workflowId}/executions${query}`,
		);
	}

	/**
	 * Workflow Templates
	 */
	async getWorkflowTemplates(): Promise<Workflow[]> {
		return this.client.request<Workflow[]>('/api/workflow-templates');
	}

	async createWorkflowFromTemplate(templateId: string, data: Partial<Workflow>): Promise<Workflow> {
		return this.client.request<Workflow>(`/api/workflow-templates/${templateId}/create`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	/**
	 * Workflow Status Operations
	 */
	async activateWorkflow(id: string): Promise<Workflow> {
		return this.client.request<Workflow>(`/api/workflows/${id}/activate`, {
			method: 'POST',
		});
	}

	async deactivateWorkflow(id: string): Promise<Workflow> {
		return this.client.request<Workflow>(`/api/workflows/${id}/deactivate`, {
			method: 'POST',
		});
	}

	/**
	 * Workflow Statistics
	 */
	async getWorkflowStats(id: string): Promise<{
		totalExecutions: number;
		successRate: number;
		averageRuntime: number;
		lastExecution?: Date;
	}> {
		return this.client.request(`/api/workflows/${id}/stats`);
	}

	async getAllWorkflowStats(): Promise<{
		total: number;
		active: number;
		totalExecutions: number;
		totalRuntime: number;
	}> {
		return this.client.request('/api/workflows/stats');
	}
}
