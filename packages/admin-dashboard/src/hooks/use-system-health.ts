'use client';

import { useQuery } from '@tanstack/react-query';

export interface SystemHealthService {
	name: string;
	status: 'healthy' | 'warning' | 'error';
	responseTime: number;
}

export interface SystemHealthSnapshot {
	timestamp: string;
	cpu: number;
	memory: number;
	disk: number;
	network: number;
	status: 'healthy' | 'warning' | 'critical';
	services: SystemHealthService[];
}

export interface SystemHealthResponse {
	current: SystemHealthSnapshot;
	history: SystemHealthSnapshot[];
}

// API function to fetch system health data
const fetchSystemHealth = async (): Promise<SystemHealthResponse> => {
	const response = await fetch('/api/monitoring/system');

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
