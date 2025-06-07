/**
 * Agent API
 * Handles all agent-related API operations including chat
 */

import type { Agent } from '@/types';
import type { AgentChatMessage } from './types';
import type { HTTPClient } from './http-client';

export class AgentAPI {
	constructor(private client: HTTPClient) {}

	/**
	 * Agent CRUD Operations
	 */
	async getAgents(): Promise<Agent[]> {
		return this.client.request<Agent[]>('/api/agents');
	}

	async getAgent(id: string): Promise<Agent> {
		return this.client.request<Agent>(`/api/agents/${id}`);
	}

	async getActiveAgents(): Promise<Agent[]> {
		return this.client.request<Agent[]>('/api/agents?status=active');
	}

	async createAgent(data: Partial<Agent>): Promise<Agent> {
		return this.client.request<Agent>('/api/agents', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
		return this.client.request<Agent>(`/api/agents/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteAgent(id: string): Promise<void> {
		await this.client.request(`/api/agents/${id}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Agent Chat Operations
	 */
	async sendChatMessage(
		agentId: string,
		message: string,
		metadata?: any,
	): Promise<AgentChatMessage> {
		return this.client.request<AgentChatMessage>(`/api/agents/${agentId}/chat`, {
			method: 'POST',
			body: JSON.stringify({
				message,
				metadata,
				timestamp: new Date().toISOString(),
			}),
		});
	}

	async getChatHistory(
		agentId: string,
		limit?: number,
		offset?: number,
	): Promise<AgentChatMessage[]> {
		const params = new URLSearchParams();
		if (limit) params.append('limit', limit.toString());
		if (offset) params.append('offset', offset.toString());

		const query = params.toString() ? `?${params.toString()}` : '';
		return this.client.request<AgentChatMessage[]>(`/api/agents/${agentId}/chat/history${query}`);
	}

	async clearChatHistory(agentId: string): Promise<void> {
		await this.client.request(`/api/agents/${agentId}/chat/history`, {
			method: 'DELETE',
		});
	}

	/**
	 * Agent Status Operations
	 */
	async startAgent(id: string): Promise<Agent> {
		return this.client.request<Agent>(`/api/agents/${id}/start`, {
			method: 'POST',
		});
	}

	async stopAgent(id: string): Promise<Agent> {
		return this.client.request<Agent>(`/api/agents/${id}/stop`, {
			method: 'POST',
		});
	}

	async restartAgent(id: string): Promise<Agent> {
		return this.client.request<Agent>(`/api/agents/${id}/restart`, {
			method: 'POST',
		});
	}

	/**
	 * Agent Configuration
	 */
	async getAgentConfig(id: string): Promise<Record<string, any>> {
		return this.client.request<Record<string, any>>(`/api/agents/${id}/config`);
	}

	async updateAgentConfig(id: string, config: Record<string, any>): Promise<Agent> {
		return this.client.request<Agent>(`/api/agents/${id}/config`, {
			method: 'PUT',
			body: JSON.stringify(config),
		});
	}

	/**
	 * Agent Metrics
	 */
	async getAgentStats(id: string): Promise<{
		tasksCompleted: number;
		totalRuntime: number;
		successRate: number;
		lastActivity: Date;
	}> {
		return this.client.request(`/api/agents/${id}/stats`);
	}

	async getAllAgentStats(): Promise<{
		total: number;
		active: number;
		idle: number;
		offline: number;
	}> {
		return this.client.request('/api/agents/stats');
	}
}
