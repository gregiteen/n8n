import axios, { type AxiosInstance } from 'axios';

export interface N8nConfig {
	baseUrl: string;
	apiKey: string;
	timeout?: number;
}

export interface Workflow {
	id: string;
	name: string;
	nodes: Array<Record<string, unknown>>;
	connections: Record<string, unknown>;
}

export interface WorkflowCreateParams {
	name: string;
	nodes: Array<Record<string, unknown>>;
	connections: Record<string, unknown>;
}

export interface WorkflowExecution {
	id: string;
	finished: boolean;
	status: string;
	data: unknown;
}

export interface NodeType {
	name: string;
	displayName: string;
	description: string;
}

export class N8nClient {
	private config: N8nConfig;

	private axios: AxiosInstance;

	constructor(config: N8nConfig) {
		this.config = config;
		this.axios = axios.create({
			baseURL: config.baseUrl,
			timeout: config.timeout ?? 30000,
			headers: {
				'X-N8N-API-KEY': config.apiKey,
				'Content-Type': 'application/json',
			},
		});
	}

	async getWorkflows(): Promise<Workflow[]> {
		const response = await this.axios.get<{ data: Workflow[] }>('/workflows');
		return response.data.data;
	}

	async getWorkflow(id: string): Promise<Workflow> {
		const response = await this.axios.get<Workflow>(`/workflows/${id}`);
		return response.data;
	}

	async createWorkflow(workflow: WorkflowCreateParams): Promise<Workflow> {
		const response = await this.axios.post<Workflow>('/workflows', workflow);
		return response.data;
	}

	async executeWorkflow(id: string, data?: Record<string, unknown>): Promise<WorkflowExecution> {
		const response = await this.axios.post<WorkflowExecution>(`/workflows/${id}/execute`, { data });
		return response.data;
	}

	async getNodeTypes(): Promise<NodeType[]> {
		const response = await this.axios.get<{ data: NodeType[] }>('/node-types');
		return response.data.data;
	}
}
