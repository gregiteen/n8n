import { useQuery } from '@tanstack/react-query';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  createdAt: string;
  tags: string[];
}

export interface WorkflowStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
  totalExecutions: number;
  avgSuccessRate: number;
  avgExecutionTime: number;
}

// Mock API functions
const fetchWorkflows = async (): Promise<Workflow[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    {
      id: '1',
      name: 'Customer Onboarding',
      description: 'Automated customer onboarding workflow with AI assistance',
      status: 'active',
      lastExecuted: '2024-01-15T11:30:00Z',
      executionCount: 1247,
      successRate: 98.5,
      avgExecutionTime: 2340,
      createdAt: '2024-01-01T00:00:00Z',
      tags: ['customer', 'onboarding', 'ai']
    },
    {
      id: '2',
      name: 'Data Processing Pipeline',
      description: 'Process and analyze incoming data streams',
      status: 'active',
      lastExecuted: '2024-01-15T11:25:00Z',
      executionCount: 892,
      successRate: 95.2,
      avgExecutionTime: 4567,
      createdAt: '2024-01-03T00:00:00Z',
      tags: ['data', 'processing', 'analytics']
    },
    {
      id: '3',
      name: 'Email Marketing Campaign',
      description: 'Automated email campaigns with personalization',
      status: 'inactive',
      lastExecuted: '2024-01-14T16:00:00Z',
      executionCount: 456,
      successRate: 92.8,
      avgExecutionTime: 1234,
      createdAt: '2024-01-05T00:00:00Z',
      tags: ['marketing', 'email', 'automation']
    },
    {
      id: '4',
      name: 'Error Alert System',
      description: 'Monitor system errors and send notifications',
      status: 'error',
      lastExecuted: '2024-01-15T10:15:00Z',
      executionCount: 234,
      successRate: 87.4,
      avgExecutionTime: 890,
      createdAt: '2024-01-08T00:00:00Z',
      tags: ['monitoring', 'alerts', 'system']
    },
    {
      id: '5',
      name: 'Content Generation',
      description: 'AI-powered content generation for marketing',
      status: 'active',
      lastExecuted: '2024-01-15T11:20:00Z',
      executionCount: 678,
      successRate: 96.7,
      avgExecutionTime: 3456,
      createdAt: '2024-01-10T00:00:00Z',
      tags: ['content', 'ai', 'marketing']
    }
  ];
};

const fetchWorkflowStats = async (): Promise<WorkflowStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const workflows = await fetchWorkflows();
  
  const total = workflows.length;
  const active = workflows.filter(w => w.status === 'active').length;
  const inactive = workflows.filter(w => w.status === 'inactive').length;
  const error = workflows.filter(w => w.status === 'error').length;
  
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionCount, 0);
  const avgSuccessRate = workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length;
  const avgExecutionTime = workflows.reduce((sum, w) => sum + w.avgExecutionTime, 0) / workflows.length;

  return {
    total,
    active,
    inactive,
    error,
    totalExecutions,
    avgSuccessRate,
    avgExecutionTime
  };
};

// React Query hooks
export const useWorkflows = () => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useWorkflowStats = () => {
  return useQuery({
    queryKey: ['workflow-stats'],
    queryFn: fetchWorkflowStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
