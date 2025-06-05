/* eslint-disable @typescript-eslint/no-unsafe-call */
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';
import { OpenRouter } from 'openrouter-client';

dotenv.config();

export class OpenRouterClient {
	private client: OpenRouter;

	constructor(apiKey = process.env.OPENROUTER_API_KEY) {
		if (!apiKey) {
			throw new ApplicationError('OPENROUTER_API_KEY is required');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		this.client = new OpenRouter(apiKey);
	}

	async chat(
		messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
		model?: string,
	) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const response = await this.client.chat(messages, { model });
		if (response.success) {
			return String(response.data.choices[0]?.message?.content ?? '');
		}
		throw new ApplicationError('OpenRouter chat failed');
	}
}
/* eslint-enable @typescript-eslint/no-unsafe-call */
