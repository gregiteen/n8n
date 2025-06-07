/**
 * Task API
 * Handles all task-related API operations
 */

import type { Task, TaskStatus } from '@/types';
import type { TaskCreateRequest, TaskUpdateRequest, TaskStats } from './types';
import type { HTTPClient } from './http-client';

export class TaskAPI {
	constructor(private client: HTTPClient) {}

	/**
	 * Task CRUD Operations
	 */
	async getTasks(): Promise<Task[]> {
		return this.client.request<Task[]>('/api/tasks');
	}

	async getTask(id: string): Promise<Task> {
		return this.client.request<Task>(`/api/tasks/${id}`);
	}

	async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
		return this.client.request<Task[]>(`/api/tasks?status=${status}`);
	}

	async createTask(data: TaskCreateRequest): Promise<Task> {
		return this.client.request<Task>('/api/tasks', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateTask(id: string, data: TaskUpdateRequest): Promise<Task> {
		return this.client.request<Task>(`/api/tasks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteTask(id: string): Promise<void> {
		await this.client.request(`/api/tasks/${id}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Task Control Operations
	 */
	async cancelTask(id: string): Promise<Task> {
		return this.client.request<Task>(`/api/tasks/${id}/cancel`, {
			method: 'POST',
		});
	}

	async pauseTask(id: string): Promise<Task> {
		return this.client.request<Task>(`/api/tasks/${id}/pause`, {
			method: 'POST',
		});
	}

	async resumeTask(id: string): Promise<Task> {
		return this.client.request<Task>(`/api/tasks/${id}/resume`, {
			method: 'POST',
		});
	}

	async retryTask(id: string): Promise<Task> {
		return this.client.request<Task>(`/api/tasks/${id}/retry`, {
			method: 'POST',
		});
	}

	/**
	 * Task Analytics
	 */
	async getTaskStats(): Promise<TaskStats> {
		return this.client.request<TaskStats>('/api/tasks/stats');
	}

	async getTaskHistory(limit?: number): Promise<Task[]> {
		const query = limit ? `?limit=${limit}` : '';
		return this.client.request<Task[]>(`/api/tasks/history${query}`);
	}

	/**
	 * Task Queue Management
	 */
	async getQueuedTasks(): Promise<Task[]> {
		return this.getTasksByStatus('queued');
	}

	async getRunningTasks(): Promise<Task[]> {
		return this.getTasksByStatus('running');
	}

	async getCompletedTasks(): Promise<Task[]> {
		return this.getTasksByStatus('completed');
	}

	async getFailedTasks(): Promise<Task[]> {
		return this.getTasksByStatus('failed');
	}

	/**
	 * Batch Operations
	 */
	async cancelAllTasks(): Promise<void> {
		await this.client.request('/api/tasks/cancel-all', {
			method: 'POST',
		});
	}

	async pauseAllTasks(): Promise<void> {
		await this.client.request('/api/tasks/pause-all', {
			method: 'POST',
		});
	}

	async resumeAllTasks(): Promise<void> {
		await this.client.request('/api/tasks/resume-all', {
			method: 'POST',
		});
	}
}
