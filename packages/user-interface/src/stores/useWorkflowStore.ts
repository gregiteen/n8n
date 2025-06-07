/**
 * Workflow Store - Manages workflow state and operations
 * Integrates with AI Orchestrator API service
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Workflow } from '@/types';
import { apiService } from '@/lib/api-instance';

interface WorkflowState {
	// State
	workflows: Workflow[];
	activeWorkflow: Workflow | null;
	loading: boolean;
	error: string | null;

	// Actions
	setWorkflows: (workflows: Workflow[]) => void;
	setActiveWorkflow: (workflow: Workflow | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;

	// API Operations
	fetchWorkflows: () => Promise<void>;
	fetchWorkflow: (workflowId: string) => Promise<void>;
	createWorkflow: (workflowData: Partial<Workflow>) => Promise<void>;
	updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => Promise<void>;
	deleteWorkflow: (workflowId: string) => Promise<void>;

	// Workflow Operations
	executeWorkflow: (workflowId: string, inputData?: any) => Promise<void>;
	stopWorkflow: (workflowId: string) => Promise<void>;

	// Real-time handlers
	handleWorkflowUpdate: (workflow: Workflow) => void;
	handleWorkflowStatusChange: (workflowId: string, status: Workflow['status']) => void;

	// Computed/Derived state
	getWorkflowById: (workflowId: string) => Workflow | undefined;
	getActiveWorkflows: () => Workflow[];
	getWorkflowsByType: (type: string) => Workflow[];
}

export const useWorkflowStore = create<WorkflowState>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		workflows: [],
		activeWorkflow: null,
		loading: false,
		error: null,

		// Basic setters
		setWorkflows: (workflows) => set({ workflows }),
		setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow }),
		setLoading: (loading) => set({ loading }),
		setError: (error) => set({ error }),

		// API Operations
		fetchWorkflows: async () => {
			const { setLoading, setError, setWorkflows } = get();

			try {
				setLoading(true);
				setError(null);

				const workflows = await apiService.workflows.getWorkflows();
				setWorkflows(workflows);
			} catch (error) {
				console.error('Failed to fetch workflows:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch workflows');
			} finally {
				setLoading(false);
			}
		},

		fetchWorkflow: async (workflowId: string) => {
			const { setLoading, setError, setActiveWorkflow } = get();

			try {
				setLoading(true);
				setError(null);

				const workflow = await apiService.workflows.getWorkflow(workflowId);
				setActiveWorkflow(workflow);
			} catch (error) {
				console.error('Failed to fetch workflow:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch workflow');
			} finally {
				setLoading(false);
			}
		},

		createWorkflow: async (workflowData: Partial<Workflow>) => {
			const { setError, fetchWorkflows } = get();

			try {
				setError(null);

				await apiService.workflows.createWorkflow(workflowData);
				// Refresh workflows list after creation
				await fetchWorkflows();
			} catch (error) {
				console.error('Failed to create workflow:', error);
				setError(error instanceof Error ? error.message : 'Failed to create workflow');
				throw error;
			}
		},

		updateWorkflow: async (workflowId: string, updates: Partial<Workflow>) => {
			const { setError, workflows, setWorkflows, activeWorkflow, setActiveWorkflow } = get();

			try {
				setError(null);

				const updatedWorkflow = await apiService.workflows.updateWorkflow(workflowId, updates);

				// Update workflows list
				const updatedWorkflows = workflows.map((workflow) =>
					workflow.id === workflowId ? { ...workflow, ...updatedWorkflow } : workflow,
				);
				setWorkflows(updatedWorkflows);

				// Update active workflow if it's the same one
				if (activeWorkflow?.id === workflowId) {
					setActiveWorkflow({ ...activeWorkflow, ...updatedWorkflow });
				}
			} catch (error) {
				console.error('Failed to update workflow:', error);
				setError(error instanceof Error ? error.message : 'Failed to update workflow');
				throw error;
			}
		},

		deleteWorkflow: async (workflowId: string) => {
			const { setError, workflows, setWorkflows, activeWorkflow, setActiveWorkflow } = get();

			try {
				setError(null);

				await apiService.workflows.deleteWorkflow(workflowId);

				// Remove from workflows list
				const filteredWorkflows = workflows.filter((workflow) => workflow.id !== workflowId);
				setWorkflows(filteredWorkflows);

				// Clear active workflow if it's the deleted one
				if (activeWorkflow?.id === workflowId) {
					setActiveWorkflow(null);
				}
			} catch (error) {
				console.error('Failed to delete workflow:', error);
				setError(error instanceof Error ? error.message : 'Failed to delete workflow');
				throw error;
			}
		},

		// Workflow Operations
		executeWorkflow: async (workflowId: string, inputData?: any) => {
			const { setError } = get();

			try {
				setError(null);
				await apiService.workflows.executeWorkflow(workflowId, inputData);
			} catch (error) {
				console.error('Failed to execute workflow:', error);
				setError(error instanceof Error ? error.message : 'Failed to execute workflow');
				throw error;
			}
		},

		stopWorkflow: async (workflowId: string) => {
			const { setError } = get();

			try {
				setError(null);
				await apiService.workflows.stopWorkflow(workflowId);
			} catch (error) {
				console.error('Failed to stop workflow:', error);
				setError(error instanceof Error ? error.message : 'Failed to stop workflow');
				throw error;
			}
		},

		// Real-time update handlers
		handleWorkflowUpdate: (updatedWorkflow: Workflow) => {
			const { workflows, setWorkflows, activeWorkflow, setActiveWorkflow } = get();

			const workflowIndex = workflows.findIndex((workflow) => workflow.id === updatedWorkflow.id);
			if (workflowIndex >= 0) {
				// Update existing workflow
				const updatedWorkflows = [...workflows];
				updatedWorkflows[workflowIndex] = updatedWorkflow;
				setWorkflows(updatedWorkflows);
			} else {
				// Add new workflow
				setWorkflows([...workflows, updatedWorkflow]);
			}

			// Update active workflow if it's the same one
			if (activeWorkflow?.id === updatedWorkflow.id) {
				setActiveWorkflow(updatedWorkflow);
			}
		},

		handleWorkflowStatusChange: (workflowId: string, status: Workflow['status']) => {
			const { workflows, setWorkflows, activeWorkflow, setActiveWorkflow } = get();

			const updatedWorkflows = workflows.map((workflow) => {
				if (workflow.id === workflowId) {
					return { ...workflow, status };
				}
				return workflow;
			});

			setWorkflows(updatedWorkflows);

			// Update active workflow status if it's the same one
			if (activeWorkflow?.id === workflowId) {
				setActiveWorkflow({ ...activeWorkflow, status });
			}
		},

		// Computed getters
		getWorkflowById: (workflowId: string) => {
			const { workflows } = get();
			return workflows.find((workflow) => workflow.id === workflowId);
		},

		getActiveWorkflows: () => {
			const { workflows } = get();
			return workflows.filter((workflow) => workflow.status === 'active');
		},

		getWorkflowsByType: (type: string) => {
			const { workflows } = get();
			return workflows.filter((workflow) => workflow.type === type);
		},
	})),
);

// Setup real-time subscriptions when store is created
let isWebSocketSetup = false;

export const setupWorkflowStoreWebSocket = () => {
	if (isWebSocketSetup) return;

	// Subscribe to real-time updates from API service
	apiService.onWorkflowUpdate((workflow: Workflow) => {
		useWorkflowStore.getState().handleWorkflowUpdate(workflow);
	});

	apiService.onWorkflowUpdate((data: { workflowId: string; status: Workflow['status'] }) => {
		useWorkflowStore.getState().handleWorkflowStatusChange(data.workflowId, data.status);
	});

	isWebSocketSetup = true;
};
