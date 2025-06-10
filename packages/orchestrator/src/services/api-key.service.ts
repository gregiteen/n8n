/**
 * API Key Management Service
 * Handles secure storage and validation of user API keys
 */

import * as crypto from 'crypto';
import { readFileSync } from 'fs';

// Interface for API key storage
interface ApiKeyEntry {
	id: string;
	userId: string;
	serviceName: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
	encryptedKey: string;
	isValid: boolean;
	lastValidated?: Date;
	lastUsed?: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Interface for API key status
interface ApiKeyStatus {
	serviceName: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
	isConnected: boolean;
	lastValidated?: Date;
}

// Interface for API key request
interface ApiKeyRequest {
	serviceName: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
	apiKey: string;
}

// Interface for API key validation response
interface ApiKeyValidationResponse {
	isValid: boolean;
	message?: string;
}

export class ApiKeyService {
	private encryptionKey: Buffer;
	private apiKeys: Map<string, Map<string, ApiKeyEntry>> = new Map();

	constructor(encryptionSecret?: string) {
		// In a production environment, this should come from a secure environment variable
		const secret = encryptionSecret || 'api-key-encryption-secret-change-in-production';
		this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
	}

	/**
	 * Save or update an API key
	 */
	async saveKey(userId: string, keyData: ApiKeyRequest): Promise<ApiKeyStatus> {
		// Validate the key before saving
		const validation = await this.validateKey(keyData);

		if (!validation.isValid) {
			throw new Error(`Invalid API key for ${keyData.serviceName}: ${validation.message}`);
		}

		// Encrypt the key
		const encryptedKey = this.encryptKey(keyData.apiKey);

		// Create or get the user's keys map
		if (!this.apiKeys.has(userId)) {
			this.apiKeys.set(userId, new Map());
		}

		const userKeys = this.apiKeys.get(userId)!;

		// Create or update the key entry
		const entry: ApiKeyEntry = {
			id: crypto.randomUUID(),
			userId,
			serviceName: keyData.serviceName,
			encryptedKey,
			isValid: true,
			lastValidated: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Save the key
		userKeys.set(keyData.serviceName, entry);

		return {
			serviceName: keyData.serviceName,
			isConnected: true,
			lastValidated: entry.lastValidated,
		};
	}

	/**
	 * Get all API keys for a user
	 */
	async getAllKeys(userId: string): Promise<ApiKeyStatus[]> {
		const userKeys = this.apiKeys.get(userId);

		if (!userKeys) {
			return [];
		}

		return Array.from(userKeys.values()).map((entry) => ({
			serviceName: entry.serviceName,
			isConnected: entry.isValid,
			lastValidated: entry.lastValidated,
		}));
	}

	/**
	 * Delete an API key
	 */
	async deleteKey(userId: string, serviceName: string): Promise<void> {
		const userKeys = this.apiKeys.get(userId);

		if (!userKeys) {
			return;
		}

		userKeys.delete(serviceName);
	}

	/**
	 * Get a specific API key
	 */
	async getKey(userId: string, serviceName: string): Promise<string | null> {
		const userKeys = this.apiKeys.get(userId);

		if (!userKeys || !userKeys.has(serviceName)) {
			return null;
		}

		const entry = userKeys.get(serviceName)!;

		if (!entry.isValid) {
			return null;
		}

		// Update last used timestamp
		entry.lastUsed = new Date();
		entry.updatedAt = new Date();
		userKeys.set(serviceName, entry);

		// Decrypt and return the key
		return this.decryptKey(entry.encryptedKey);
	}

	/**
	 * Validate an API key
	 */
	async validateKey(keyData: ApiKeyRequest): Promise<ApiKeyValidationResponse> {
		try {
			// Implement validation logic for each service
			switch (keyData.serviceName) {
				case 'openai':
					return await this.validateOpenAIKey(keyData.apiKey);
				case 'anthropic':
					return await this.validateAnthropicKey(keyData.apiKey);
				case 'gemini':
					return await this.validateGeminiKey(keyData.apiKey);
				case 'openrouter':
					return await this.validateOpenRouterKey(keyData.apiKey);
				default:
					return { isValid: false, message: 'Unsupported service' };
			}
		} catch (error) {
			return {
				isValid: false,
				message: `Validation error: ${(error as Error).message}`,
			};
		}
	}

	// Private helper methods
	private encryptKey(plainText: string): string {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

		let encrypted = cipher.update(plainText, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		// Store IV with the encrypted data
		return `${iv.toString('hex')}:${encrypted}`;
	}

	private decryptKey(encryptedValue: string): string {
		const [ivHex, encrypted] = encryptedValue.split(':');
		const iv = Buffer.from(ivHex, 'hex');
		const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	}

	// Service-specific key validation methods
	private async validateOpenAIKey(apiKey: string): Promise<ApiKeyValidationResponse> {
		// Basic format validation
		if (!apiKey.startsWith('sk-')) {
			return { isValid: false, message: 'Invalid OpenAI API key format' };
		}

		try {
			// Make a simple call to the OpenAI API to validate the key
			// Using the Models endpoint which is lightweight
			const response = await fetch('https://api.openai.com/v1/models', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: { message: 'Unknown error' } }));
				return {
					isValid: false,
					message: `API key validation failed: ${errorData.error?.message || response.statusText}`,
				};
			}

			return { isValid: true };
		} catch (error) {
			return {
				isValid: false,
				message: `OpenAI key validation failed: ${(error as Error).message}`,
			};
		}
	}

	private async validateAnthropicKey(apiKey: string): Promise<ApiKeyValidationResponse> {
		// Basic format validation for Anthropic keys
		if (!apiKey.startsWith('sk-ant-')) {
			return { isValid: false, message: 'Invalid Anthropic API key format' };
		}

		try {
			// Make a simple call to the Anthropic API to validate the key
			// Using the models endpoint which is lightweight
			const response = await fetch('https://api.anthropic.com/v1/models', {
				method: 'GET',
				headers: {
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				return {
					isValid: false,
					message: `API key validation failed: ${errorData.error || response.statusText}`,
				};
			}

			return { isValid: true };
		} catch (error) {
			return {
				isValid: false,
				message: `Anthropic key validation failed: ${(error as Error).message}`,
			};
		}
	}

	private async validateGeminiKey(apiKey: string): Promise<ApiKeyValidationResponse> {
		// Gemini keys don't have a consistent prefix, just check if it's non-empty
		if (!apiKey || apiKey.trim() === '') {
			return { isValid: false, message: 'API key cannot be empty' };
		}

		try {
			// Make a simple call to the Google Generative AI API to validate the key
			// Using the models endpoint which is lightweight
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
				{
					method: 'GET',
				},
			);

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: { message: 'Unknown error' } }));
				return {
					isValid: false,
					message: `API key validation failed: ${errorData.error?.message || response.statusText}`,
				};
			}

			return { isValid: true };
		} catch (error) {
			return {
				isValid: false,
				message: `Gemini key validation failed: ${(error as Error).message}`,
			};
		}
	}

	private async validateOpenRouterKey(apiKey: string): Promise<ApiKeyValidationResponse> {
		// Basic validation for OpenRouter keys
		if (!apiKey || apiKey.trim() === '') {
			return { isValid: false, message: 'API key cannot be empty' };
		}

		// Most OpenRouter keys start with sk-or
		if (!apiKey.startsWith('sk-or') && !apiKey.startsWith('sk-')) {
			// Not failing but warning
			console.warn('OpenRouter key format unexpected');
		}

		try {
			// Make a simple call to the OpenRouter API to validate the key
			const response = await fetch('https://openrouter.ai/api/v1/models', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: { message: 'Unknown error' } }));
				return {
					isValid: false,
					message: `API key validation failed: ${errorData.error?.message || response.statusText}`,
				};
			}

			return { isValid: true };
		} catch (error) {
			return {
				isValid: false,
				message: `OpenRouter key validation failed: ${(error as Error).message}`,
			};
		}
	}

	/**
	 * Update the status of an API key
	 */
	async updateKeyStatus(userId: string, serviceName: string, isValid: boolean): Promise<void> {
		const userKeys = this.apiKeys.get(userId);

		if (!userKeys || !userKeys.has(serviceName)) {
			return;
		}

		const entry = userKeys.get(serviceName)!;
		entry.isValid = isValid;
		entry.lastValidated = new Date();
		entry.updatedAt = new Date();

		userKeys.set(serviceName, entry);
	}
}
