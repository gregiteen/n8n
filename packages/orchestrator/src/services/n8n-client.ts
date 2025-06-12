/**
 * N8N Client Service
 * Provides a client for interacting with the n8n REST API
 */

import { Service, Inject } from '../di';
import { Logger } from '../logger';
import axios from 'axios';
import type { AxiosInstance, AxiosRequestHeaders } from 'axios';
import * as path from 'path';
import * as fs from 'fs';

export interface NodeType {
	name: string;
	displayName: string;
	description: string;
	version: number;
	type: 'regular' | 'trigger' | 'webhook';
	icon: string;
	inputs: Array<{ name: string; type: string; required?: boolean }>;
	outputs: Array<{ name: string; type: string }>;
	properties: Array<{
		displayName: string;
		name: string;
		type: string;
		default: any;
		description?: string;
		options?: Array<{ name: string; value: string | number | boolean }>;
		placeholder?: string;
		required?: boolean;
	}>;
	defaults?: Record<string, any>;
	credentials?: Array<{ name: string; required?: boolean }>;
}

@Service()
export class N8nClient {
	private client: AxiosInstance;
	private baseUrl: string;
	private apiKey: string | null = null;
	private logger: Logger;

	constructor(@Inject(Logger) logger?: Logger) {
		this.logger = (logger ?? new Logger('N8nClient')).scoped('n8n-client');

		// Default to localhost:5678 for development
		this.baseUrl = process.env.N8N_API_URL || 'http://localhost:5678';

		// Create axios client
		this.client = axios.create({
			baseURL: this.baseUrl,
		});

		// Configure authentication if available
		this.configureAuthentication();

		this.logger.debug(`N8n client initialized for ${this.baseUrl}`);
	}

	/**
	 * Configure authentication for the client
	 */
	private configureAuthentication(): void {
		// Try to get API key from environment
		this.apiKey = process.env.N8N_API_KEY || null;

		if (this.apiKey) {
			this.logger.debug('Using API key authentication');

			// Add auth header to all requests
			this.client.interceptors.request.use((config) => {
				const headers = (config.headers || {}) as AxiosRequestHeaders;
				headers['X-N8N-API-KEY'] = this.apiKey as string;
				config.headers = headers;
				return config;
			});
		} else {
			this.logger.warn('No API key configured, some operations may fail');
		}
	}

	/**
	 * Get all available node types
	 */
	async getAllNodeTypes(): Promise<NodeType[]> {
		try {
			// First, try to load from the API
			const response = await this.client.get('/node-types');
			if (response.data && Array.isArray(response.data.data)) {
				return response.data.data as NodeType[];
			}
		} catch (error) {
			this.logger.error('Failed to load node types from API, falling back to local.', { error });
		}

		// Fallback to loading from local files if API fails or returns unexpected data
		return this.loadLocalNodeTypes();
	}

	/**
	 * Load node types from local n8n installation (if available)
	 * This is a fallback if the API is not accessible or doesn't provide node types
	 */
	private async loadLocalNodeTypes(): Promise<NodeType[]> {
		const nodeTypes: NodeType[] = [];
		try {
			// Adjust the path according to your n8n installation structure
			// This path assumes orchestrator is within a structure like packages/orchestrator
			// and n8n nodes are in a sibling directory like nodes-base/dist/nodes
			const nodeTypesDir = path.resolve(__dirname, '../../../../nodes-base/dist/nodes');

			if (fs.existsSync(nodeTypesDir)) {
				const nodeDirs = fs
					.readdirSync(nodeTypesDir, { withFileTypes: true })
					.filter((dirent) => dirent.isDirectory())
					.map((dirent) => dirent.name);

				for (const nodeDir of nodeDirs) {
					const nodeJsonPath = path.join(nodeTypesDir, nodeDir, `${nodeDir}.node.json`);
					if (fs.existsSync(nodeJsonPath)) {
						try {
							const content = fs.readFileSync(nodeJsonPath, 'utf8');
							const nodeDefinition = JSON.parse(content);
							// Basic validation and transformation if necessary
							if (nodeDefinition.name && nodeDefinition.displayName) {
								nodeTypes.push(nodeDefinition as NodeType);
							}
						} catch (error) {
							this.logger.debug(`Error processing node directory ${nodeDir}:`, { error });
						}
					}
				}
				this.logger.info(`Loaded ${nodeTypes.length} node types from local files.`);
			} else {
				this.logger.warn(
					`Local node types directory not found at ${nodeTypesDir}. Cannot load local node types.`,
				);
			}
		} catch (error) {
			this.logger.warn('Error loading local node types', { error });
		}
		return nodeTypes;
	}

	/**
	 * Get all workflows
	 */
	async getWorkflows(): Promise<any[]> {
		try {
			const response = await this.client.get('/workflows');
			return response.data.data;
		} catch (error) {
			this.logger.error('Error getting workflows', { error });
			return [];
		}
	}

	/**
	 * Get a specific workflow by ID
	 */
	async getWorkflow(id: string): Promise<any | null> {
		try {
			const response = await this.client.get(`/workflows/${id}`);
			return response.data.data;
		} catch (error) {
			this.logger.error(`Error getting workflow ${id}`, { error });
			throw error;
		}
	}

	/**
	 * Create a new workflow
	 */
	async createWorkflow(workflow: any): Promise<any> {
		try {
			const response = await this.client.post('/workflows', workflow);
			return response.data.data;
		} catch (error) {
			this.logger.error('Error creating workflow', { error });
			throw error;
		}
	}

	/**
	 * Update an existing workflow
	 */
	async updateWorkflow(id: string, workflow: any): Promise<any> {
		try {
			const response = await this.client.put(`/workflows/${id}`, workflow);
			return response.data.data;
		} catch (error) {
			this.logger.error(`Error updating workflow ${id}`, { error });
			throw error;
		}
	}

	/**
	 * Execute a workflow
	 */
	async executeWorkflow(id: string, options?: any): Promise<any> {
		try {
			const response = await this.client.post(`/workflows/${id}/execute`, options);
			return response.data.data;
		} catch (error) {
			this.logger.error(`Error executing workflow ${id}`, { error });
			throw error;
		}
	}

	/**
	 * Execute a single n8n node (placeholder)
	 * In a real scenario, this might involve creating a temporary workflow
	 * or using a specific n8n API endpoint if available for direct node execution.
	 */
	async executeNode(nodeName: string, parameters: Record<string, any>): Promise<any> {
		this.logger.info(`Executing node ${nodeName} with parameters (placeholder)`, {
			nodeName,
			parameters,
		});
		// This is a placeholder. Actual implementation would require interaction with n8n backend.
		// For example, it might involve:
		// 1. Constructing a minimal workflow definition with the specified node and parameters.
		// 2. Posting this workflow to an n8n endpoint that executes it immediately.
		// 3. Returning the result from the node's output.
		// Or, if n8n has an API to directly trigger a node by its type and provide inputs:
		// const response = await this.client.post('/nodes/execute', { nodeName, parameters });
		// return response.data;

		// Simulate a successful execution with parameters returned as result for now
		return {
			success: true,
			message: `Node ${nodeName} executed (simulated).`,
			data: parameters,
		};
	}
}
