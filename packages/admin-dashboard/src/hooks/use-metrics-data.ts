'use client';

import { useQuery } from '@tanstack/react-query';

export interface MetricsData {
  systemUsage: {
    time: string;
    cpu: number;
    memory: number;
  }[];
  agentActivity: {
    time: string;
    executions: number;
  }[];
}

// Mock API function - replace with actual API call
const fetchMetricsData = async (): Promise<MetricsData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate sample time series data
  const now = new Date();
  const systemUsage = Array.from({ length: 12 }, (_, i) => {
    const time = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000);
    return {
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
      memory: Math.floor(Math.random() * 25) + 55, // 55-80%
    };
  });

  const agentActivity = Array.from({ length: 12 }, (_, i) => {
    const time = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000);
    return {
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      executions: Math.floor(Math.random() * 20) + 5, // 5-25 executions
    };
  });

  return {
    systemUsage,
    agentActivity,
  };
};

export function useMetricsData() {
  return useQuery({
    queryKey: ['metrics-data'],
    queryFn: fetchMetricsData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
