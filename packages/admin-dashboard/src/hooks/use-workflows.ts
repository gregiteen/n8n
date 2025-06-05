import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  trigger: 'manual' | 'webhook' | 'schedule' | 'event';
  lastExecuted?: string;
  nextRun?: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  nodes: number;
  connections: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  version: number;
  tags: string[];
}

export interface WorkflowFilters {
  status?: Workflow['status'][];
  trigger?: Workflow['trigger'][];
  search?: string;
  tags?: string[];
  createdBy?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface WorkflowStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgSuccessRate: number;
  avgExecutionTime: number;
  triggerDistribution: {
    manual: number;
    webhook: number;
    schedule: number;
    event: number;
  };
}

// Mock API functions
const fetchWorkflows = async (filters?: WorkflowFilters): Promise<Workflow[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const allWorkflows: Workflow[] = [
    {
      id: '1',
      name: 'Customer Onboarding',
      description: 'Automated customer onboarding workflow with AI assistance',
      status: 'active',
      trigger: 'webhook',
      lastExecuted: '2024-01-15T11:30:00Z',
      nextRun: undefined,
      executionCount: 1247,
      successRate: 98.5,
      avgExecutionTime: 2340,
      nodes: 8,
      connections: 12,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T11:30:00Z',
      createdBy: 'john.doe@company.com',
      isPublic: false,
      version: 3,
      tags: ['customer', 'onboarding', 'ai']
    },
    {
      id: '2',
      name: 'Data Processing Pipeline',
      description: 'Process and analyze incoming data streams',
      status: 'active',
      trigger: 'schedule',
      lastExecuted: '2024-01-15T11:25:00Z',
      nextRun: '2024-01-16T08:00:00Z',
      executionCount: 892,
      successRate: 95.2,
      avgExecutionTime: 4567,
      nodes: 12,
      connections: 18,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-15T11:25:00Z',
      createdBy: 'admin@company.com',
      isPublic: true,
      version: 2,
      tags: ['data', 'processing', 'analytics']
    },
    {
      id: '3',
      name: 'Email Marketing Campaign',
      description: 'Automated email campaigns with personalization',
      status: 'inactive',
      trigger: 'manual',
      lastExecuted: '2024-01-14T16:00:00Z',
      executionCount: 456,
      successRate: 92.8,
      avgExecutionTime: 1234,
      nodes: 6,
      connections: 9,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z',
      createdBy: 'jane.smith@company.com',
      isPublic: false,
      version: 1,
      tags: ['marketing', 'email', 'automation']
    },
    {
      id: '4',
      name: 'Error Alert System',
      description: 'Monitor system errors and send notifications',
      status: 'error',
      trigger: 'event',
      lastExecuted: '2024-01-15T10:15:00Z',
      executionCount: 234,
      successRate: 87.4,
      avgExecutionTime: 890,
      nodes: 4,
      connections: 6,
      createdAt: '2024-01-08T00:00:00Z',
      updatedAt: '2024-01-15T10:15:00Z',
      createdBy: 'admin@company.com',
      isPublic: false,
      version: 1,
      tags: ['monitoring', 'alerts', 'system']
    },
    {
      id: '5',
      name: 'Content Generation',
      description: 'AI-powered content generation for marketing',
      status: 'active',
      trigger: 'webhook',
      lastExecuted: '2024-01-15T11:20:00Z',
      executionCount: 678,
      successRate: 96.7,
      avgExecutionTime: 3456,
      nodes: 10,
      connections: 15,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-15T11:20:00Z',
      createdBy: 'jane.smith@company.com',
      isPublic: true,
      version: 2,
      tags: ['content', 'ai', 'marketing']
    }
  ];

  let filteredWorkflows = [...allWorkflows];
  
  if (filters) {
    if (filters.status?.length) {
      filteredWorkflows = filteredWorkflows.filter((workflow) =>
        filters.status!.includes(workflow.status)
      );
    }
    
    if (filters.trigger?.length) {
      filteredWorkflows = filteredWorkflows.filter((workflow) =>
        filters.trigger!.includes(workflow.trigger)
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter((workflow) =>
        workflow.name.toLowerCase().includes(searchLower) ||
        workflow.description.toLowerCase().includes(searchLower) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.tags?.length) {
      filteredWorkflows = filteredWorkflows.filter((workflow) =>
        filters.tags!.some(tag => workflow.tags.includes(tag))
      );
    }
    
    if (filters.createdBy) {
      filteredWorkflows = filteredWorkflows.filter((workflow) =>
        workflow.createdBy === filters.createdBy
      );
    }
    
    if (filters.dateRange) {
      filteredWorkflows = filteredWorkflows.filter((workflow) => {
        const createdAt = new Date(workflow.createdAt);
        return createdAt >= filters.dateRange!.from &&
               createdAt <= filters.dateRange!.to;
      });
    }
  }

  return filteredWorkflows;
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
  const successfulExecutions = Math.round(
    workflows.reduce((sum, w) => sum + (w.executionCount * w.successRate / 100), 0)
  );
  const failedExecutions = totalExecutions - successfulExecutions;
  const avgSuccessRate = workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length;
  const avgExecutionTime = workflows.reduce((sum, w) => sum + w.avgExecutionTime, 0) / workflows.length;

  const triggerDistribution = {
    manual: workflows.filter(w => w.trigger === 'manual').length,
    webhook: workflows.filter(w => w.trigger === 'webhook').length,
    schedule: workflows.filter(w => w.trigger === 'schedule').length,
    event: workflows.filter(w => w.trigger === 'event').length,
  };

  return {
    total,
    active,
    inactive,
    error,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    avgSuccessRate,
    avgExecutionTime,
    triggerDistribution
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
