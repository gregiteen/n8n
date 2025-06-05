'use client';

import { useQuery } from '@tanstack/react-query';

export interface MetricsData {
	systemMetrics: Array<{
		time: string;
		cpu: number;
		memory: number;
	}>;
	agentMetrics: Array<{
		name: string;
		requests: number;
		errors: number;
	}>;
	workflowMetrics: Array<{
		time: string;
		executions: number;
		success_rate: number;
	}>;
}

// Mock API function - replace with actual API call
const fetchMetricsData = async (): Promise<MetricsData> => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// Generate sample time series data
	const now = new Date();
	const systemMetrics = Array.from({ length: 12 }, (_, i) => {
		const time = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000);
		return {
			time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
			cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
			memory: Math.floor(Math.random() * 25) + 55, // 55-80%
		};
	});

	const agentMetrics = [
		{ name: 'Content Agent', requests: 245, errors: 3 },
		{ name: 'Analysis Agent', requests: 189, errors: 1 },
		{ name: 'Email Agent', requests: 156, errors: 0 },
		{ name: 'Data Agent', requests: 98, errors: 2 },
	];

	const workflowMetrics = Array.from({ length: 12 }, (_, i) => {
		const time = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000);
		return {
			time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
			executions: Math.floor(Math.random() * 20) + 5, // 5-25 executions
			success_rate: Math.floor(Math.random() * 15) + 85, // 85-100% success rate
		};
	});

	return {
		systemMetrics,
		agentMetrics,
		workflowMetrics,
	};
};

export function useMetricsData() {
	return useQuery({
		queryKey: ['metrics-data'],
		queryFn: fetchMetricsData,
		refetchInterval: 30000, // Refetch every 30 seconds
	});
}
