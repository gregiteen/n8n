// Node Helpers - Utility functions for AI agent nodes

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ApplicationError } from 'n8n-workflow';

import type { AgentConfig, ChatMessage } from '../types/NodeTypes';

export class NodeHelpers {
	/**
	 * Format input data for AI processing
	 */
	static formatInputData(inputData: INodeExecutionData[]): any[] {
		return inputData.map((item) => item.json);
	}

	/**
	 * Create output data from AI response
	 */
	static createOutputData(response: any): INodeExecutionData[] {
		return [
			{
				json: {
					response: response.message || response,
					usage: response.usage,
					timestamp: new Date().toISOString(),
					...response,
				},
			},
		];
	}

	/**
	 * Extract text from various input formats
	 */
	static extractText(data: any): string {
		if (typeof data === 'string') {
			return data;
		}

		if (data.text || data.content || data.message) {
			return data.text || data.content || data.message;
		}

		// Try to convert object to readable text
		return JSON.stringify(data, null, 2);
	}

	/**
	 * Build agent configuration from node parameters
	 */
	static buildAgentConfig(executeFunctions: IExecuteFunctions, itemIndex: number = 0): AgentConfig {
		return {
			name: executeFunctions.getNodeParameter('agentName', itemIndex, 'AI Agent') as string,
			type: executeFunctions.getNodeParameter('agentType', itemIndex, 'conversational') as any,
			modelProvider: executeFunctions.getNodeParameter('modelProvider', itemIndex, 'openai') as any,
			model: executeFunctions.getNodeParameter('model', itemIndex, 'gpt-4') as string,
			systemPrompt: executeFunctions.getNodeParameter('systemPrompt', itemIndex, '') as string,
			temperature: executeFunctions.getNodeParameter('temperature', itemIndex, 0.7) as number,
			maxTokens: executeFunctions.getNodeParameter('maxTokens', itemIndex, 1000) as number,
			memory: executeFunctions.getNodeParameter('enableMemory', itemIndex, false) as boolean,
		};
	}

	/**
	 * Format chat messages for API
	 */
	static formatChatMessages(messages: any[]): ChatMessage[] {
		return messages.map((msg) => ({
			role: msg.role || 'user',
			content: this.extractText(msg),
			timestamp: msg.timestamp || new Date().toISOString(),
		}));
	}

	/**
	 * Validate required parameters
	 */
	static validateRequiredParams(
		executeFunctions: IExecuteFunctions,
		params: string[],
		itemIndex: number = 0,
	): void {
		for (const param of params) {
			const value = executeFunctions.getNodeParameter(param, itemIndex);
			if (value === undefined || value === null || value === '') {
				throw new ApplicationError(`Required parameter '${param}' is missing`);
			}
		}
	}

	/**
	 * Handle API errors gracefully
	 */
	static handleApiError(error: any, context: string): never {
		const errorMessage = error.message || error.toString();
		const statusCode = error.statusCode || error.status;

		let friendlyMessage = `${context} failed: ${errorMessage}`;

		if (statusCode === 401) {
			friendlyMessage = 'Authentication failed. Please check your API credentials.';
		} else if (statusCode === 429) {
			friendlyMessage = 'Rate limit exceeded. Please try again later.';
		} else if (statusCode === 500) {
			friendlyMessage = 'AI service is temporarily unavailable. Please try again later.';
		}

		throw new ApplicationError(friendlyMessage);
	}

	/**
	 * Parse JSON safely
	 */
	static safeJsonParse(text: string, fallback: any = null): any {
		try {
			return JSON.parse(text);
		} catch {
			return fallback;
		}
	}

	/**
	 * Truncate text to specified length
	 */
	static truncateText(text: string, maxLength: number = 1000): string {
		if (text.length <= maxLength) {
			return text;
		}
		return text.substring(0, maxLength) + '...';
	}

	/**
	 * Clean and normalize text input
	 */
	static cleanText(text: string): string {
		return text
			.trim()
			.replace(/\s+/g, ' ')
			.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
	}

	/**
	 * Extract file information from input
	 */
	static extractFileInfo(item: INodeExecutionData): {
		name?: string;
		content?: string;
		mimeType?: string;
	} {
		const json = item.json;
		const binary = item.binary;

		if (binary && Object.keys(binary).length > 0) {
			const firstFile = Object.values(binary)[0];
			return {
				name: firstFile.fileName,
				content: firstFile.data,
				mimeType: firstFile.mimeType,
			};
		}

		return {
			name: json.fileName as string,
			content: json.content as string,
			mimeType: json.mimeType as string,
		};
	}

	/**
	 * Format data for table display
	 */
	static formatTableData(data: any[]): string {
		if (!Array.isArray(data) || data.length === 0) {
			return 'No data available';
		}

		const headers = Object.keys(data[0]);
		const rows = data.map((item) => headers.map((header) => String(item[header] || '')).join('\t'));

		return [headers.join('\t'), ...rows].join('\n');
	}
}
