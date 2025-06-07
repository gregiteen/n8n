/**
 * Task Store - Manages task state and operations
 * Integrates with AI Orchestrator API service
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Task, TaskStatus, TaskType } from '@/types';
import type { TaskCreateRequest, TaskUpdateRequest, TaskStats } from '@/lib/api/types';
import { apiService } from '@/lib/api-instance';

interface TaskState {
	// State
	tasks: Task[];
	stats: TaskStats | null;
	loading: boolean;
	error: string | null;
	selectedFilter: string;

	// Actions
	setTasks: (tasks: Task[]) => void;
	setStats: (stats: TaskStats) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setSelectedFilter: (filter: string) => void;

	// API Operations
	fetchTasks: () => Promise<void>;
	fetchStats: () => Promise<void>;
	createTask: (taskData: TaskCreateRequest) => Promise<void>;
	updateTask: (taskId: string, updates: TaskUpdateRequest) => Promise<void>;
	deleteTask: (taskId: string) => Promise<void>;

	// Task Actions
	pauseTask: (taskId: string) => Promise<void>;
	resumeTask: (taskId: string) => Promise<void>;
	cancelTask: (taskId: string) => Promise<void>;
	retryTask: (taskId: string) => Promise<void>;

	// Real-time handlers
	handleTaskUpdate: (task: Task) => void;
	handleTaskStatusChange: (taskId: string, status: TaskStatus, progress?: number) => void;

	// Computed/Derived state
	getFilteredTasks: () => Task[];
	getTaskById: (taskId: string) => Task | undefined;
	getTasksByStatus: (status: TaskStatus) => Task[];
	getTasksByType: (type: TaskType) => Task[];
}

export const useTaskStore = create<TaskState>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		tasks: [],
		stats: null,
		loading: false,
		error: null,
		selectedFilter: 'all',

		// Basic setters
		setTasks: (tasks) => set({ tasks }),
		setStats: (stats) => set({ stats }),
		setLoading: (loading) => set({ loading }),
		setError: (error) => set({ error }),
		setSelectedFilter: (filter) => set({ selectedFilter: filter }),

		// API Operations
		fetchTasks: async () => {
			const { setLoading, setError, setTasks } = get();

			try {
				setLoading(true);
				setError(null);

				const tasks = await apiService.tasks.getTasks();
				setTasks(tasks);
			} catch (error) {
				console.error('Failed to fetch tasks:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch tasks');
			} finally {
				setLoading(false);
			}
		},

		fetchStats: async () => {
			const { setError, setStats } = get();

			try {
				const stats = await apiService.tasks.getTaskStats();
				setStats(stats);
			} catch (error) {
				console.error('Failed to fetch stats:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch task stats');
			}
		},

		createTask: async (taskData: TaskCreateRequest) => {
			const { setError, fetchTasks } = get();

			try {
				setError(null);

				await apiService.tasks.createTask(taskData);
				// Refresh tasks list after creation
				await fetchTasks();
			} catch (error) {
				console.error('Failed to create task:', error);
				setError(error instanceof Error ? error.message : 'Failed to create task');
				throw error;
			}
		},

		updateTask: async (taskId: string, updates: TaskUpdateRequest) => {
			const { setError, tasks, setTasks } = get();

			try {
				setError(null);

				const updatedTask = await apiService.tasks.updateTask(taskId, updates);

				// Update local state
				const updatedTasks = tasks.map((task) =>
					task.id === taskId ? { ...task, ...updatedTask } : task,
				);
				setTasks(updatedTasks);
			} catch (error) {
				console.error('Failed to update task:', error);
				setError(error instanceof Error ? error.message : 'Failed to update task');
				throw error;
			}
		},

		deleteTask: async (taskId: string) => {
			const { setError, tasks, setTasks } = get();

			try {
				setError(null);

				await apiService.tasks.deleteTask(taskId);

				// Remove from local state
				const filteredTasks = tasks.filter((task) => task.id !== taskId);
				setTasks(filteredTasks);
			} catch (error) {
				console.error('Failed to delete task:', error);
				setError(error instanceof Error ? error.message : 'Failed to delete task');
				throw error;
			}
		},

		// Task Action Methods
		pauseTask: async (taskId: string) => {
			const { setError, tasks, setTasks } = get();

			try {
				setError(null);
				const updatedTask = await apiService.tasks.pauseTask(taskId);

				// Update local state
				const updatedTasks = tasks.map((task) =>
					task.id === taskId ? { ...task, ...updatedTask } : task,
				);
				setTasks(updatedTasks);
			} catch (error) {
				console.error('Failed to pause task:', error);
				setError(error instanceof Error ? error.message : 'Failed to pause task');
				throw error;
			}
		},

		resumeTask: async (taskId: string) => {
			const { setError, tasks, setTasks } = get();

			try {
				setError(null);
				const updatedTask = await apiService.tasks.resumeTask(taskId);

				// Update local state
				const updatedTasks = tasks.map((task) =>
					task.id === taskId ? { ...task, ...updatedTask } : task,
				);
				setTasks(updatedTasks);
			} catch (error) {
				console.error('Failed to resume task:', error);
				setError(error instanceof Error ? error.message : 'Failed to resume task');
				throw error;
			}
		},

		cancelTask: async (taskId: string) => {
			const { setError, tasks, setTasks } = get();

			try {
				setError(null);
				const updatedTask = await apiService.tasks.cancelTask(taskId);

				// Update local state
				const updatedTasks = tasks.map((task) =>
					task.id === taskId ? { ...task, ...updatedTask } : task,
				);
				setTasks(updatedTasks);
			} catch (error) {
				console.error('Failed to cancel task:', error);
				setError(error instanceof Error ? error.message : 'Failed to cancel task');
				throw error;
			}
		},

		retryTask: async (taskId: string) => {
			const { setError, tasks, setTasks } = get();

			try {
				setError(null);
				const updatedTask = await apiService.tasks.retryTask(taskId);

				// Update local state
				const updatedTasks = tasks.map((task) =>
					task.id === taskId ? { ...task, ...updatedTask } : task,
				);
				setTasks(updatedTasks);
			} catch (error) {
				console.error('Failed to retry task:', error);
				setError(error instanceof Error ? error.message : 'Failed to retry task');
				throw error;
			}
		},

		// Real-time update handlers
		handleTaskUpdate: (updatedTask: Task) => {
			const { tasks, setTasks } = get();

			const taskIndex = tasks.findIndex((task) => task.id === updatedTask.id);
			if (taskIndex >= 0) {
				// Update existing task
				const updatedTasks = [...tasks];
				updatedTasks[taskIndex] = updatedTask;
				setTasks(updatedTasks);
			} else {
				// Add new task
				setTasks([...tasks, updatedTask]);
			}
		},

		handleTaskStatusChange: (taskId: string, status: TaskStatus, progress?: number) => {
			const { tasks, setTasks } = get();

			const updatedTasks = tasks.map((task) => {
				if (task.id === taskId) {
					const updates: Partial<Task> = { status };
					if (progress !== undefined) {
						updates.progress = progress;
					}
					if (status === 'completed') {
						updates.endTime = new Date();
						updates.progress = 100;
					}
					return { ...task, ...updates };
				}
				return task;
			});

			setTasks(updatedTasks);
		},

		// Computed getters
		getFilteredTasks: () => {
			const { tasks, selectedFilter } = get();

			if (selectedFilter === 'all') {
				return tasks;
			}

			return tasks.filter((task) => task.status === selectedFilter);
		},

		getTaskById: (taskId: string) => {
			const { tasks } = get();
			return tasks.find((task) => task.id === taskId);
		},

		getTasksByStatus: (status: TaskStatus) => {
			const { tasks } = get();
			return tasks.filter((task) => task.status === status);
		},

		getTasksByType: (type: TaskType) => {
			const { tasks } = get();
			return tasks.filter((task) => task.type === type);
		},
	})),
);

// Setup real-time subscriptions when store is created
let isWebSocketSetup = false;

export const setupTaskStoreWebSocket = () => {
	if (isWebSocketSetup) return;

	// Subscribe to real-time updates from API service
	apiService.onTaskUpdate((task: Task) => {
		useTaskStore.getState().handleTaskUpdate(task);
	});

	isWebSocketSetup = true;
};
