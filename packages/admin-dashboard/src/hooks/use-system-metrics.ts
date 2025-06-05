'use client';

import { useQuery } from '@tanstack/react-query';

export interface SystemMetrics {
	systemStatus: string;
	activeAgents: number;
	cpuUsage: number;
	memoryUsage: number;
	diskUsage: number;
	uptime: string;
	lastUpdated: string;
}

// API function to fetch system metrics
const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
	const response = await fetch('/api/system/overview');

	if (!response.ok) {
		throw new Error('Failed to fetch system metrics');
	}

	return response.json();
};

export function useSystemMetrics() {
	return useQuery({
		queryKey: ['system-metrics'],
		queryFn: fetchSystemMetrics,
		refetchInterval: 30000, // Refetch every 30 seconds
	});
}
