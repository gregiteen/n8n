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

// Mock API function - replace with actual API call
const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    systemStatus: 'Healthy',
    activeAgents: 3,
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38,
    uptime: '5 days, 12 hours',
    lastUpdated: new Date().toISOString(),
  };
};

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: fetchSystemMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
