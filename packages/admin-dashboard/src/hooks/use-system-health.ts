'use client';

import { useQuery } from '@tanstack/react-query';

export interface SystemHealth {
	cpu: number;
	memory: number;
	disk: number;
	network: number;
	uptime: number;
	services: Array<{
		name: string;
		status: 'healthy' | 'warning' | 'error';
		responseTime: number;
	}>;
}

// API function to fetch system health
const fetchSystemHealth = async (): Promise<SystemHealth> => {
	const response = await fetch('/api/monitoring/health');

	if (!response.ok) {
		throw new Error('Failed to fetch system health');
	}

	return response.json();
};

export function useSystemHealth() {
	return useQuery({
		queryKey: ['system-health'],
		queryFn: fetchSystemHealth,
		refetchInterval: 5000, // Refetch every 5 seconds
	});
}
