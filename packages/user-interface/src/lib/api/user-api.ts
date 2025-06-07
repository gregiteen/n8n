/**
 * User API & Authentication
 * Handles user management and authentication operations
 */

import type { User } from '@/types';
import type { LoginRequest, RegisterRequest, LoginResponse, AuthTokens } from './types';
import type { HTTPClient } from './http-client';

export class UserAPI {
	constructor(private client: HTTPClient) {}

	/**
	 * Authentication Operations
	 */
	async login(credentials: LoginRequest): Promise<LoginResponse> {
		const response = await this.client.request<LoginResponse>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify(credentials),
		});

		// Store the auth token
		this.client.setAuthToken(response.tokens.accessToken);

		return response;
	}

	async register(userData: RegisterRequest): Promise<LoginResponse> {
		const response = await this.client.request<LoginResponse>('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify(userData),
		});

		// Store the auth token
		this.client.setAuthToken(response.tokens.accessToken);

		return response;
	}

	async logout(): Promise<void> {
		try {
			await this.client.request('/api/auth/logout', {
				method: 'POST',
			});
		} finally {
			// Always clear the token, even if the request fails
			this.client.clearAuthToken();
		}
	}

	async refreshToken(): Promise<AuthTokens> {
		const response = await this.client.request<AuthTokens>('/api/auth/refresh', {
			method: 'POST',
		});

		// Update stored token
		this.client.setAuthToken(response.accessToken);

		return response;
	}

	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await this.client.request('/api/auth/change-password', {
			method: 'POST',
			body: JSON.stringify({
				currentPassword,
				newPassword,
			}),
		});
	}

	/**
	 * User Profile Operations
	 */
	async getCurrentUser(): Promise<User> {
		return this.client.request<User>('/api/user/profile');
	}

	async updateUser(data: Partial<User>): Promise<User> {
		return this.client.request<User>('/api/user/profile', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteAccount(): Promise<void> {
		await this.client.request('/api/user/profile', {
			method: 'DELETE',
		});

		// Clear auth token after account deletion
		this.client.clearAuthToken();
	}

	/**
	 * User Settings Operations
	 */
	async getUserSettings(): Promise<Record<string, any>> {
		return this.client.request<Record<string, any>>('/api/user/settings');
	}

	async updateUserSettings(settings: Record<string, any>): Promise<Record<string, any>> {
		return this.client.request<Record<string, any>>('/api/user/settings', {
			method: 'PUT',
			body: JSON.stringify(settings),
		});
	}

	/**
	 * User Activity & Analytics
	 */
	async getUserActivity(limit?: number): Promise<
		Array<{
			id: string;
			type: string;
			description: string;
			timestamp: Date;
			metadata?: any;
		}>
	> {
		const query = limit ? `?limit=${limit}` : '';
		return this.client.request(`/api/user/activity${query}`);
	}

	async getUserStats(): Promise<{
		tasksCreated: number;
		workflowsCreated: number;
		totalActiveTime: number;
		lastLogin: Date;
	}> {
		return this.client.request('/api/user/stats');
	}

	/**
	 * User Preferences
	 */
	async getPreferences(): Promise<{
		theme: 'light' | 'dark' | 'auto';
		language: string;
		notifications: {
			email: boolean;
			browser: boolean;
			mobile: boolean;
		};
		privacy: {
			shareUsageData: boolean;
			allowAnalytics: boolean;
		};
	}> {
		return this.client.request('/api/user/preferences');
	}

	async updatePreferences(preferences: Record<string, any>): Promise<void> {
		await this.client.request('/api/user/preferences', {
			method: 'PUT',
			body: JSON.stringify(preferences),
		});
	}

	/**
	 * Authentication Status
	 */
	isAuthenticated(): boolean {
		return this.client.hasAuthToken();
	}

	getAuthToken(): string | null {
		return this.client.getAuthToken();
	}
}
