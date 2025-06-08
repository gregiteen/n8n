import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ApplicationError } from 'n8n-workflow';
import OpenAI from 'openai';

dotenv.config();

export interface MemoryEntry {
	id?: string;
	agentId: string;
	content: string;
	embedding: number[];
	metadata: Record<string, unknown>;
	createdAt?: Date;
}

export interface SearchQuery {
	agentId: string;
	query: string;
	limit?: number;
	similarity?: number;
}

export class AgentMemoryService {
	private supabase;

	private openai;

	constructor() {
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new ApplicationError(
				'SUPABASE_URL and SUPABASE_KEY environment variables are required',
			);
		}

		this.supabase = createClient(supabaseUrl, supabaseKey);

		const openaiApiKey = process.env.OPENAI_API_KEY;
		if (!openaiApiKey) {
			throw new ApplicationError('OPENAI_API_KEY environment variable is required for embeddings');
		}

		this.openai = new OpenAI({ apiKey: openaiApiKey });
	}

	/**
	 * Generate an embedding for text content
	 */
	async generateEmbedding(text: string): Promise<number[]> {
		try {
			const response = await this.openai.embeddings.create({
				model: 'text-embedding-3-small',
				input: text,
			});

			return response.data[0].embedding;
		} catch (error) {
			console.error('Error generating embedding:', error);
			throw new ApplicationError(`Failed to generate embedding: ${(error as Error).message}`);
		}
	}

	/**
	 * Add a memory entry to the agent's memory
	 */
	async addMemory(entry: Omit<MemoryEntry, 'embedding'>): Promise<string> {
		try {
			const embedding = await this.generateEmbedding(entry.content);

			const { data, error } = await this.supabase
				.from('agent_memory')
				.insert({
					agent_id: entry.agentId,
					content: entry.content,
					embedding,
					metadata: entry.metadata,
				})
				.select('id')
				.single();

			if (error) {
				throw new ApplicationError(`Database error while adding memory: ${error.message}`);
			}

			return data.id;
		} catch (error) {
			console.error('Error adding memory:', error);
			throw new ApplicationError(`Failed to add memory: ${(error as Error).message}`);
		}
	}

	/**
	 * Perform a semantic search for relevant memories
	 */
	async searchMemory(query: SearchQuery): Promise<MemoryEntry[]> {
		try {
			const embedding = await this.generateEmbedding(query.query);

			const { data, error } = await this.supabase.rpc('match_memories', {
				query_embedding: embedding,
				match_threshold: query.similarity || 0.7,
				match_count: query.limit || 10,
				agent_id: query.agentId,
			});

			if (error) {
				throw new ApplicationError(`Failed to match memories: ${error.message}`);
			}

			return data.map((item: any) => ({
				id: item.id,
				agentId: item.agent_id,
				content: item.content,
				embedding: item.embedding,
				metadata: item.metadata,
				createdAt: new Date(item.created_at),
			}));
		} catch (error) {
			console.error('Error searching memory:', error);
			throw new ApplicationError(`Failed to search memory: ${(error as Error).message}`);
		}
	}

	/**
	 * Delete a memory entry
	 */
	async deleteMemory(id: string): Promise<void> {
		try {
			const { error } = await this.supabase.from('agent_memory').delete().eq('id', id);

			if (error) {
				throw new ApplicationError(`Failed to delete memory: ${error.message}`);
			}
		} catch (error) {
			console.error('Error deleting memory:', error);
			throw new ApplicationError(`Failed to delete memory: ${(error as Error).message}`);
		}
	}

	/**
	 * Clear all memories for an agent
	 */
	async clearAgentMemory(agentId: string): Promise<void> {
		try {
			const { error } = await this.supabase.from('agent_memory').delete().eq('agent_id', agentId);

			if (error) {
				throw new ApplicationError(`Failed to clear agent memory: ${error.message}`);
			}
		} catch (error) {
			console.error('Error clearing agent memory:', error);
			throw new ApplicationError(`Failed to clear agent memory: ${(error as Error).message}`);
		}
	}

	/**
	 * Get all memories for an agent
	 */
	async getAgentMemories(agentId: string): Promise<MemoryEntry[]> {
		try {
			const { data, error } = await this.supabase
				.from('agent_memory')
				.select('*')
				.eq('agent_id', agentId)
				.order('created_at', { ascending: false });

			if (error) {
				throw new ApplicationError(`Failed to query agent memories: ${error.message}`);
			}

			return data.map((item: any) => ({
				id: item.id,
				agentId: item.agent_id,
				content: item.content,
				embedding: item.embedding,
				metadata: item.metadata,
				createdAt: new Date(item.created_at),
			}));
		} catch (error) {
			console.error('Error getting agent memories:', error);
			throw new ApplicationError(`Failed to get agent memories: ${(error as Error).message}`);
		}
	}

	// Placeholder for future implementation of message-specific methods

	// ... other methods
}
