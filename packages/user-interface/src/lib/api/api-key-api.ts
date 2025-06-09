/**
 * API Key Management API
 * Handles operations related to user API keys for AI services
 */

import type {
	ApiKeyEntry,
	ApiKeyRequest,
	ApiKeyStatus,
	ApiKeyValidationResponse,
} from '@/types/api-keys';
import type { HTTPClient } from './http-client';

export class ApiKeyAPI {
	constructor(private client: HTTPClient) {}

	/**
	 * Get all API keys for the current user
	 */
	async getAllKeys(): Promise<ApiKeyStatus[]> {
		return this.client.request<ApiKeyStatus[]>('/api/user/api-keys', {
			method: 'GET',
		});
	}

	/**
	 * Save or update an API key
	 */
	async saveKey(keyData: ApiKeyRequest): Promise<ApiKeyStatus> {
		return this.client.request<ApiKeyStatus>('/api/user/api-keys', {
			method: 'POST',
			body: JSON.stringify(keyData),
		});
	}

	/**
	 * Delete an API key
	 */
	async deleteKey(serviceName: string): Promise<void> {
		await this.client.request<void>(`/api/user/api-keys/${serviceName}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Validate an API key
	 */
	async validateKey(keyData: ApiKeyRequest): Promise<ApiKeyValidationResponse> {
		return this.client.request<ApiKeyValidationResponse>('/api/user/api-keys/validate', {
			method: 'POST',
			body: JSON.stringify(keyData),
		});
	}
}
