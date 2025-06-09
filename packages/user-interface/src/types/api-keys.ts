/**
 * API Key types and interfaces
 */

export interface ApiKeyEntry {
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

export interface ApiKeyStatus {
	serviceName: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
	isConnected: boolean;
	lastValidated?: Date;
}

export interface ApiKeyRequest {
	serviceName: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
	apiKey: string;
}

export interface ApiKeyValidationResponse {
	isValid: boolean;
	message?: string;
}
