/* eslint-disable @typescript-eslint/no-unsafe-call */
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';
import { OpenAI } from 'openai';

dotenv.config();

export class OpenAIClient {
	private client: OpenAI;

	constructor(apiKey = process.env.OPENAI_API_KEY) {
		if (!apiKey) {
			throw new ApplicationError('OPENAI_API_KEY is required');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		this.client = new OpenAI({ apiKey });
	}

	async chat(
		messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		model = 'gpt-3.5-turbo',
	) {
		const response = await this.client.chat.completions.create({
			model,
			messages,
		});
		return String(response.choices[0]?.message?.content ?? '');
	}
}
/* eslint-enable @typescript-eslint/no-unsafe-call */
