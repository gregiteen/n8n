/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';

dotenv.config();

export class AnthropicClient {
	private client: Anthropic;

	constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
		if (!apiKey) {
			throw new ApplicationError('ANTHROPIC_API_KEY is required');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		this.client = new Anthropic({ apiKey });
	}

	async chat(prompt: string, model = 'claude-3-opus-20240229') {
		interface MessageResponse {
			content?: Array<{ text?: string }>;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const response = (await this.client.messages.create({
			model,
			max_tokens: 1024,
			messages: [{ role: 'user', content: prompt }],
		})) as MessageResponse;
		return String(response.content?.[0]?.text ?? '');
	}
}
/* eslint-enable @typescript-eslint/no-unsafe-call */
