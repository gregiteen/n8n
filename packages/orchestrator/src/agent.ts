import type { OpenAIClient as OpenAIClientClass } from './clients/openai';
import { OpenAIClient } from './clients/openai';

export interface AgentOptions {
	model?: string;
}

export class Agent {
	private messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

	private client: OpenAIClientClass;

	private model?: string;

	constructor(client: OpenAIClientClass = new OpenAIClient(), options: AgentOptions = {}) {
		this.client = client;
		this.model = options.model;
	}

	async send(input: string, model?: string) {
		this.messages.push({ role: 'user', content: input });
		const response = await this.client.chat(this.messages, model ?? this.model);
		this.messages.push({ role: 'assistant', content: response });
		return response;
	}

	getMemory() {
		return this.messages;
	}
}
