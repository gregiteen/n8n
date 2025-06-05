'use client';

import { useQuery } from '@tanstack/react-query';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'error';
  lastActive: string;
  executionCount: number;
}

// Mock API function - replace with actual API call
const fetchAgentStatus = async (): Promise<Agent[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: '1',
      name: 'Content Creator Agent',
      type: 'Social Media',
      status: 'active',
      lastActive: '2 minutes ago',
      executionCount: 45,
    },
    {
      id: '2',
      name: 'Email Assistant',
      type: 'Communication',
      status: 'active',
      lastActive: '5 minutes ago',
      executionCount: 23,
    },
    {
      id: '3',
      name: 'Data Analyzer',
      type: 'Analytics',
      status: 'paused',
      lastActive: '1 hour ago',
      executionCount: 12,
    },
  ];
};

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent-status'],
    queryFn: fetchAgentStatus,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
