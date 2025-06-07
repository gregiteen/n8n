/**
 * HTTP Client
 * Handles all HTTP requests with authentication and error handling
 */

import type { APIConfig, RequestOptions, AuthTokens } from './types';

export class HTTPClient {
	private config: APIConfig;
	private authToken: string | null = null;

	constructor(config: APIConfig) {
		this.config = config;
		this.loadStoredToken();
	}

	/**
	 * Make HTTP request with authentication and error handling
	 */
	async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		const url = `${this.config.baseUrl}${endpoint}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		// Add authentication if available
		if (this.authToken) {
			headers.Authorization = `Bearer ${this.authToken}`;
		}

		if (this.config.apiKey) {
			headers['X-API-Key'] = this.config.apiKey;
		}

		if (this.config.userId) {
			headers['X-User-ID'] = this.config.userId;
		}

		try {
			const response = await fetch(url, {
				method: options.method || 'GET',
				headers,
				body: options.body,
				signal: options.signal,
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage: string;

				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.message || errorData.error || 'Request failed';
				} catch {
					errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
				}

				throw new Error(errorMessage);
			}

			// Handle empty responses
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				return {} as T;
			}

			return await response.json();
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Request failed');
		}
	}

	/**
	 * Authentication Token Management
	 */
	setAuthToken(token: string): void {
		this.authToken = token;
		this.storeToken(token);
	}

	clearAuthToken(): void {
		this.authToken = null;
		this.removeStoredToken();
	}

	hasAuthToken(): boolean {
		return !!this.authToken;
	}

	getAuthToken(): string | null {
		return this.authToken;
	}

	private storeToken(token: string): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem('auth_token', token);
		}
	}

	private loadStoredToken(): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			const token = localStorage.getItem('auth_token');
			if (token) {
				this.authToken = token;
			}
		}
	}

	private removeStoredToken(): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.removeItem('auth_token');
		}
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig: Partial<APIConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	getConfig(): APIConfig {
		return { ...this.config };
	}
}
