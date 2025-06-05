'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Alert {
	id: string;
	metric: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	timestamp: string;
	resolved: boolean;
}

const fetchAlerts = async (includeResolved: boolean = false): Promise<Alert[]> => {
	const params = new URLSearchParams();
	if (includeResolved) {
		params.append('includeResolved', 'true');
	}

	const response = await fetch(`/api/monitoring/alerts?${params.toString()}`);

	if (!response.ok) {
		throw new Error('Failed to fetch alerts');
	}

	return response.json();
};

const updateAlert = async ({ alertId, resolved }: { alertId: string; resolved: boolean }) => {
	const response = await fetch('/api/monitoring/alerts', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ alertId, resolved }),
	});

	if (!response.ok) {
		throw new Error('Failed to update alert');
	}

	return response.json();
};

export function useAlerts(includeResolved: boolean = false) {
	return useQuery({
		queryKey: ['alerts', includeResolved],
		queryFn: () => fetchAlerts(includeResolved),
		refetchInterval: 30000, // Refetch every 30 seconds
	});
}

export function useUpdateAlert() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateAlert,
		onSuccess: () => {
			// Invalidate and refetch alerts
			queryClient.invalidateQueries({ queryKey: ['alerts'] });
		},
	});
}
