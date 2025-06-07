/**
 * System API
 * Handles system-wide operations and status monitoring
 */

import type { SystemStats } from './types';
import type { HTTPClient } from './http-client';

export interface SystemStatus {
	status: 'healthy' | 'warning' | 'error';
	version: string;
	uptime: number;
	services: {
		database: 'up' | 'down';
		redis: 'up' | 'down';
		websocket: 'up' | 'down';
		orchestrator: 'up' | 'down';
	};
	lastChecked: Date;
}

export interface SystemAlert {
	id: string;
	type: 'info' | 'warning' | 'error';
	title: string;
	message: string;
	timestamp: Date;
	resolved: boolean;
}

export class SystemAPI {
	constructor(private client: HTTPClient) {}

	/**
	 * System Status Operations
	 */
	async getSystemStatus(): Promise<SystemStatus> {
		return this.client.request<SystemStatus>('/api/system/status');
	}

	async getSystemHealth(): Promise<{
		healthy: boolean;
		checks: Array<{
			name: string;
			status: 'pass' | 'fail';
			message?: string;
		}>;
	}> {
		return this.client.request('/api/system/health');
	}

	async getSystemStats(): Promise<SystemStats> {
		return this.client.request<SystemStats>('/api/system/stats');
	}

	/**
	 * System Information
	 */
	async getSystemInfo(): Promise<{
		version: string;
		buildDate: string;
		nodeVersion: string;
		platform: string;
		architecture: string;
		environment: string;
	}> {
		return this.client.request('/api/system/info');
	}

	/**
	 * System Alerts
	 */
	async getSystemAlerts(resolved?: boolean): Promise<SystemAlert[]> {
		const query = resolved !== undefined ? `?resolved=${resolved}` : '';
		return this.client.request<SystemAlert[]>(`/api/system/alerts${query}`);
	}

	async acknowledgeAlert(alertId: string): Promise<void> {
		await this.client.request(`/api/system/alerts/${alertId}/acknowledge`, {
			method: 'POST',
		});
	}

	async resolveAlert(alertId: string): Promise<void> {
		await this.client.request(`/api/system/alerts/${alertId}/resolve`, {
			method: 'POST',
		});
	}

	/**
	 * System Configuration
	 */
	async getSystemConfig(): Promise<Record<string, any>> {
		return this.client.request<Record<string, any>>('/api/system/config');
	}

	async updateSystemConfig(config: Record<string, any>): Promise<void> {
		await this.client.request('/api/system/config', {
			method: 'PUT',
			body: JSON.stringify(config),
		});
	}

	/**
	 * System Logs
	 */
	async getSystemLogs(
		level?: 'error' | 'warn' | 'info' | 'debug',
		limit?: number,
	): Promise<
		Array<{
			level: string;
			message: string;
			timestamp: Date;
			service: string;
			metadata?: any;
		}>
	> {
		const params = new URLSearchParams();
		if (level) params.append('level', level);
		if (limit) params.append('limit', limit.toString());

		const query = params.toString() ? `?${params.toString()}` : '';
		return this.client.request(`/api/system/logs${query}`);
	}

	/**
	 * System Maintenance
	 */
	async performSystemCleanup(): Promise<{
		tasksRemoved: number;
		logsRemoved: number;
		cacheCleared: boolean;
	}> {
		return this.client.request('/api/system/cleanup', {
			method: 'POST',
		});
	}

	async restartSystem(): Promise<void> {
		await this.client.request('/api/system/restart', {
			method: 'POST',
		});
	}

	/**
	 * Database Operations
	 */
	async getDatabaseStatus(): Promise<{
		connected: boolean;
		version: string;
		totalConnections: number;
		activeConnections: number;
	}> {
		return this.client.request('/api/system/database/status');
	}

	async backupDatabase(): Promise<{
		backupId: string;
		filename: string;
		size: number;
		timestamp: Date;
	}> {
		return this.client.request('/api/system/database/backup', {
			method: 'POST',
		});
	}

	async getBackupHistory(): Promise<
		Array<{
			id: string;
			filename: string;
			size: number;
			timestamp: Date;
			status: 'completed' | 'failed' | 'in_progress';
		}>
	> {
		return this.client.request('/api/system/database/backups');
	}
}
