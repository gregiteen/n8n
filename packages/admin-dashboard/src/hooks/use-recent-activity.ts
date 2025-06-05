'use client';

import { useQuery } from '@tanstack/react-query';

export interface Activity {
  id: string;
  description: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
  source: string;
}

// Mock API function - replace with actual API call
const fetchRecentActivity = async (): Promise<Activity[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: '1',
      description: 'Content Creator Agent executed successfully',
      type: 'success',
      timestamp: '2 minutes ago',
      source: 'AI Agent',
    },
    {
      id: '2',
      description: 'New user account created',
      type: 'info',
      timestamp: '15 minutes ago',
      source: 'User Management',
    },
    {
      id: '3',
      description: 'Failed to connect to external API',
      type: 'error',
      timestamp: '1 hour ago',
      source: 'Integration',
    },
    {
      id: '4',
      description: 'System backup completed',
      type: 'success',
      timestamp: '2 hours ago',
      source: 'System',
    },
  ];
};

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}
