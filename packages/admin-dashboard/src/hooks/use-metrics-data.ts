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

// API function to fetch metrics data
const fetchMetricsData = async (): Promise<MetricsData> => {
	const response = await fetch('/api/monitoring/metrics?timeRange=12h');

	if (!response.ok) {
		throw new Error('Failed to fetch metrics data');
	}

	const data = await response.json();

	// Transform the data to match the expected interface
	return {
		systemMetrics: data.systemUsage,
		agentMetrics: [
			{ name: 'Content Agent', requests: 245, errors: 3 },
			{ name: 'Analysis Agent', requests: 189, errors: 1 },
			{ name: 'Email Agent', requests: 156, errors: 0 },
			{ name: 'Data Agent', requests: 98, errors: 2 },
		],
		workflowMetrics: data.workflowMetrics,
	};
};

export function useMetricsData() {
	return useQuery({
		queryKey: ['metrics-data'],
		queryFn: fetchMetricsData,
		refetchInterval: 30000, // Refetch every 30 seconds
	});
}
