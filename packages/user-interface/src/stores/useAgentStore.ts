/**
 * Agent Store - Manages AI agent state and operations
 * Integrates with AI Orchestrator API service
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Agent } from '@/types';
import { apiService } from '@/lib/api-instance';

interface AgentState {
	// State
	agents: Agent[];
	activeAgents: Agent[];
	loading: boolean;
	error: string | null;

	// Actions
	setAgents: (agents: Agent[]) => void;
	setActiveAgents: (agents: Agent[]) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;

	// API Operations
	fetchAgents: () => Promise<void>;
	fetchActiveAgents: () => Promise<void>;
	createAgent: (agentData: Partial<Agent>) => Promise<void>;
	updateAgent: (agentId: string, updates: Partial<Agent>) => Promise<void>;
	deleteAgent: (agentId: string) => Promise<void>;

	// Agent Operations
	activateAgent: (agentId: string) => Promise<void>;
	deactivateAgent: (agentId: string) => Promise<void>;

	// Real-time handlers
	handleAgentUpdate: (agent: Agent) => void;
	handleAgentStatusChange: (agentId: string, status: Agent['status']) => void;

	// Computed/Derived state
	getAgentById: (agentId: string) => Agent | undefined;
	getAgentsByType: (type: string) => Agent[];
	getAvailableAgents: () => Agent[];
}

export const useAgentStore = create<AgentState>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		agents: [],
		activeAgents: [],
		loading: false,
		error: null,

		// Basic setters
		setAgents: (agents) => set({ agents }),
		setActiveAgents: (agents) => set({ activeAgents: agents }),
		setLoading: (loading) => set({ loading }),
		setError: (error) => set({ error }),

		// API Operations
		fetchAgents: async () => {
			const { setLoading, setError, setAgents } = get();

			try {
				setLoading(true);
				setError(null);

				const agents = await apiService.agents.getAgents();
				setAgents(agents);
			} catch (error) {
				console.error('Failed to fetch agents:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch agents');
			} finally {
				setLoading(false);
			}
		},

		fetchActiveAgents: async () => {
			const { setError, setActiveAgents } = get();

			try {
				const activeAgents = await apiService.agents.getActiveAgents();
				setActiveAgents(activeAgents);
			} catch (error) {
				console.error('Failed to fetch active agents:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch active agents');
			}
		},

		createAgent: async (agentData: Partial<Agent>) => {
			const { setError, fetchAgents } = get();

			try {
				setError(null);

				await apiService.agents.createAgent(agentData);
				// Refresh agents list after creation
				await fetchAgents();
			} catch (error) {
				console.error('Failed to create agent:', error);
				setError(error instanceof Error ? error.message : 'Failed to create agent');
				throw error;
			}
		},

		updateAgent: async (agentId: string, updates: Partial<Agent>) => {
			const { setError, agents, setAgents } = get();

			try {
				setError(null);

				const updatedAgent = await apiService.agents.updateAgent(agentId, updates);

				// Update local state
				const updatedAgents = agents.map((agent) =>
					agent.id === agentId ? { ...agent, ...updatedAgent } : agent,
				);
				setAgents(updatedAgents);
			} catch (error) {
				console.error('Failed to update agent:', error);
				setError(error instanceof Error ? error.message : 'Failed to update agent');
				throw error;
			}
		},

		deleteAgent: async (agentId: string) => {
			const { setError, agents, setAgents } = get();

			try {
				setError(null);

				await apiService.agents.deleteAgent(agentId);

				// Remove from local state
				const filteredAgents = agents.filter((agent) => agent.id !== agentId);
				setAgents(filteredAgents);
			} catch (error) {
				console.error('Failed to delete agent:', error);
				setError(error instanceof Error ? error.message : 'Failed to delete agent');
				throw error;
			}
		},

		// Agent Operations
		activateAgent: async (agentId: string) => {
			const { updateAgent } = get();

			try {
				await updateAgent(agentId, { status: 'active' });
			} catch (error) {
				console.error('Failed to activate agent:', error);
				throw error;
			}
		},

		deactivateAgent: async (agentId: string) => {
			const { updateAgent } = get();

			try {
				await updateAgent(agentId, { status: 'offline' });
			} catch (error) {
				console.error('Failed to deactivate agent:', error);
				throw error;
			}
		},

		// Real-time update handlers
		handleAgentUpdate: (updatedAgent: Agent) => {
			const { agents, setAgents } = get();

			const agentIndex = agents.findIndex((agent) => agent.id === updatedAgent.id);
			if (agentIndex >= 0) {
				// Update existing agent
				const updatedAgents = [...agents];
				updatedAgents[agentIndex] = updatedAgent;
				setAgents(updatedAgents);
			} else {
				// Add new agent
				setAgents([...agents, updatedAgent]);
			}
		},

		handleAgentStatusChange: (agentId: string, status: Agent['status']) => {
			const { agents, setAgents } = get();

			const updatedAgents = agents.map((agent) => {
				if (agent.id === agentId) {
					return { ...agent, status };
				}
				return agent;
			});

			setAgents(updatedAgents);
		},

		// Computed getters
		getAgentById: (agentId: string) => {
			const { agents } = get();
			return agents.find((agent) => agent.id === agentId);
		},

		getAgentsByType: (type: string) => {
			const { agents } = get();
			return agents.filter((agent) => agent.type === type);
		},

		getAvailableAgents: () => {
			const { agents } = get();
			return agents.filter((agent) => agent.status === 'active' || agent.status === 'idle');
		},
	})),
);

// Setup real-time subscriptions when store is created
let isWebSocketSetup = false;

export const setupAgentStoreWebSocket = () => {
	if (isWebSocketSetup) return;

	// Subscribe to real-time updates from API service
	apiService.onAgentStatusChange((agent: Agent) => {
		useAgentStore.getState().handleAgentUpdate(agent);
	});

	apiService.onAgentStatusChange((data: { agentId: string; status: Agent['status'] }) => {
		useAgentStore.getState().handleAgentStatusChange(data.agentId, data.status);
	});

	isWebSocketSetup = true;
};
