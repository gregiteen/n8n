'use client';

import { useQuery } from '@tanstack/react-query';

export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  services: {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
  }[];
}

// Mock API function - replace with actual API call
const fetchSystemHealth = async (): Promise<SystemHealth> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 23,
    uptime: 432000, // 5 days in seconds
    services: [
      { name: 'API Gateway', status: 'healthy', responseTime: 45 },
      { name: 'Database', status: 'healthy', responseTime: 23 },
      { name: 'AI Engine', status: 'warning', responseTime: 156 },
      { name: 'n8n Service', status: 'healthy', responseTime: 67 },
    ],
  };
};

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
