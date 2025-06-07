'use client';

import React from 'react';
import {
  Play,
  Pause,
  Square,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Activity,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Workflow } from '@/types';

// Mock workflow data
const mockWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Customer Onboarding Flow',
    description: 'Automated customer onboarding with multiple AI agents',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
      { id: 'n2', type: 'ai-chat-agent', position: { x: 200, y: 0 }, data: {} },
      { id: 'n3', type: 'ai-data-analyst', position: { x: 400, y: 0 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    executionCount: 142,
    lastExecution: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: 'wf-2',
    name: 'Content Generation Pipeline',
    description: 'Multi-stage content creation with AI agents',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
      { id: 'n2', type: 'ai-web-scraper', position: { x: 200, y: 0 }, data: {} },
      { id: 'n3', type: 'ai-content-writer', position: { x: 400, y: 0 }, data: {} },
      { id: 'n4', type: 'ai-image-analyzer', position: { x: 600, y: 0 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    executionCount: 56,
    lastExecution: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: 'wf-3',
    name: 'Data Analysis Dashboard',
    description: 'Automated data processing and reporting',
    status: 'paused',
    nodes: [
      { id: 'n1', type: 'schedule', position: { x: 0, y: 0 }, data: {} },
      { id: 'n2', type: 'ai-data-analyst', position: { x: 200, y: 0 }, data: {} },
      { id: 'n3', type: 'ai-decision-maker', position: { x: 400, y: 0 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    executionCount: 89,
    lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
];

export function WorkflowManager() {
  const [workflows, setWorkflows] = React.useState<Workflow[]>(mockWorkflows);

  const handleWorkflowAction = (workflowId: string, action: 'start' | 'pause' | 'stop') => {
    setWorkflows(prev => 
      prev.map(wf => 
        wf.id === workflowId 
          ? { ...wf, status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped' }
          : wf
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'stopped':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'ai-chat-agent':
        return '💬';
      case 'ai-data-analyst':
        return '📊';
      case 'ai-web-scraper':
        return '🕷️';
      case 'ai-content-writer':
        return '✍️';
      case 'ai-image-analyzer':
        return '🖼️';
      case 'ai-decision-maker':
        return '🎯';
      case 'trigger':
        return '⚡';
      case 'schedule':
        return '⏰';
      default:
        return '🔧';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">
            Manage and monitor your AI-powered workflows
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter(wf => wf.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, wf) => sum + wf.executionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(wf => wf.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4s</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                            getStatusColor(workflow.status)
                          )}
                        >
                          {workflow.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                    </div>
                  </div>

                  {/* Workflow Nodes Visualization */}
                  <div className="flex items-center space-x-2 overflow-x-auto">
                    {workflow.nodes.map((node, index) => (
                      <React.Fragment key={node.id}>
                        <div className="flex flex-col items-center space-y-1 min-w-0">
                          <div className="text-2xl">{getNodeTypeIcon(node.type)}</div>
                          <span className="text-xs text-muted-foreground text-center truncate max-w-[80px]">
                            {node.type.replace('ai-', '').replace('-', ' ')}
                          </span>
                        </div>
                        {index < workflow.nodes.length - 1 && (
                          <div className="text-muted-foreground">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Workflow Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Executions</p>
                      <p className="font-medium">{workflow.executionCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nodes</p>
                      <p className="font-medium">{workflow.nodes.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Run</p>
                      <p className="font-medium">
                        {workflow.lastExecution 
                          ? formatRelativeTime(workflow.lastExecution)
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-medium">{formatRelativeTime(workflow.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-6">
                  {workflow.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWorkflowAction(workflow.id, 'start')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWorkflowAction(workflow.id, 'stop')}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first AI workflow to automate your processes.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
