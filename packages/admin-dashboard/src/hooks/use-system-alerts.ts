'use client';

import { useQuery } from '@tanstack/react-query';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

// Mock API function - replace with actual API call
const fetchSystemAlerts = async (): Promise<Alert[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 900));
  
  return [
    {
      id: '1',
      title: 'High Memory Usage',
      description: 'Memory usage has exceeded 80% threshold',
      severity: 'warning',
      timestamp: '5 minutes ago',
      source: 'System Monitor',
      acknowledged: false,
    },
    {
      id: '2',
      title: 'AI Service Slow Response',
      description: 'Response time increased to 156ms',
      severity: 'warning',
      timestamp: '12 minutes ago',
      source: 'AI Engine',
      acknowledged: false,
    },
  ];
};

export function useSystemAlerts() {
  return useQuery({
    queryKey: ['system-alerts'],
    queryFn: fetchSystemAlerts,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
