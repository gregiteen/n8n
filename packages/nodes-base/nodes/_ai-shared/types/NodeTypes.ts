// Node Types - Type definitions for AI agent nodes

export interface AgentConfig {
	id?: string;
	name: string;
	type: 'conversational' | 'web-browsing' | 'workflow' | 'data-analysis' | 'function-calling';
	modelProvider: 'openai' | 'anthropic' | 'gemini';
	model: string;
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
	tools?: Tool[];
	memory?: boolean;
}

export interface Tool {
	name: string;
	description: string;
	schema: any;
}

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp?: string;
}

export interface AgentResponse {
	id: string;
	message: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	tools_used?: string[];
	error?: string;
}

export interface DataAnalysisRequest {
	data: any[];
	query: string;
	format: 'json' | 'csv' | 'table';
}

export interface ContentGenerationRequest {
	type: 'blog' | 'email' | 'social' | 'technical' | 'marketing';
	topic: string;
	style: string;
	length: number;
	targetAudience?: string;
}

export interface ImageAnalysisRequest {
	imageUrl?: string;
	imageBase64?: string;
	analysisType: 'description' | 'ocr' | 'classification' | 'object-detection';
	detailed?: boolean;
}

export interface WebScrapingRequest {
	url: string;
	selector?: string;
	extractType: 'text' | 'links' | 'images' | 'data';
	followLinks?: boolean;
	maxPages?: number;
}

export interface CodeGenerationRequest {
	language: string;
	description: string;
	style: 'function' | 'class' | 'script' | 'module';
	includeTests?: boolean;
	includeComments?: boolean;
}

export interface DocumentProcessingRequest {
	content: string;
	operation: 'summarize' | 'extract' | 'translate' | 'classify' | 'sentiment';
	outputFormat?: string;
	language?: string;
}

export interface EmailAssistantRequest {
	operation: 'compose' | 'reply' | 'summarize' | 'classify';
	content?: string;
	context?: string;
	tone: 'professional' | 'friendly' | 'formal' | 'casual';
	length?: 'short' | 'medium' | 'long';
}

export interface WorkflowDecision {
	condition: string;
	trueAction: string;
	falseAction: string;
	confidence?: number;
}
