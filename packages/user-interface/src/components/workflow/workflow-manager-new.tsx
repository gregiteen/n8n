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
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useWorkflowStore } from '@/stores';

export function WorkflowManager() {
  const { 
    workflows, 
    loading, 
    error,
    fetchWorkflows, 
    executeWorkflow, 
    pauseWorkflow, 
    stopWorkflow 
  } = useWorkflowStore();

  React.useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId);
    } catch (err) {
      console.error('Failed to execute workflow:', err);
    }
  };

  const handlePauseWorkflow = async (workflowId: string) => {
    try {
      await pauseWorkflow(workflowId);
    } catch (err) {
      console.error('Failed to pause workflow:', err);
    }
  };

  const handleStopWorkflow = async (workflowId: string) => {
    try {
      await stopWorkflow(workflowId);
    } catch (err) {
      console.error('Failed to stop workflow:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'stopped':
        return 'bg-red-500';
      case 'idle':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNodeTypeIcon = (nodeType: string) => {
    const icons: Record<string, string> = {
      'trigger': '⚡',
      'ai-chat-agent': '💬',
      'ai-data-analyst': '📊',
      'ai-web-scraper': '🌐',
      'ai-content-writer': '✍️',
      'ai-code-generator': '💻',
      'ai-image-analyzer': '🖼️',
      'ai-workflow-orchestrator': '🎭',
      'ai-decision-maker': '🎯',
    };
    return icons[nodeType] || '🔧';
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-medium">Error loading workflows</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button 
            variant="outline" 
            className="mt-3"
            onClick={() => fetchWorkflows()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Manager</h1>
          <p className="text-muted-foreground">
            Manage and monitor your AI-powered workflows
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Workflows</p>
                <p className="text-2xl font-bold">
                  {workflows.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Total Executions</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((total, w) => total + (w.executionCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Pause className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Paused</p>
                <p className="text-2xl font-bold">
                  {workflows.filter(w => w.status === 'paused').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No workflows found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI workflow to get started
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full',
                        getStatusColor(workflow.status)
                      )}
                    />
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {workflow.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Workflow Nodes Visualization */}
                <div>
                  <p className="text-sm font-medium mb-2">Workflow Nodes</p>
                  <div className="flex flex-wrap gap-2">
                    {workflow.nodes?.slice(0, 6).map((node, index) => (
                      <div
                        key={node.id}
                        className="flex items-center space-x-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                        title={`${node.type} node`}
                      >
                        <span>{getNodeTypeIcon(node.type)}</span>
                        <span className="capitalize">{node.type.replace('ai-', '').replace('-', ' ')}</span>
                      </div>
                    ))}
                    {workflow.nodes && workflow.nodes.length > 6 && (
                      <div className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs">
                        +{workflow.nodes.length - 6} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Executions</p>
                    <p className="font-medium">{workflow.executionCount || 0}</p>
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
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {formatRelativeTime(workflow.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{workflow.status}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {workflow.status === 'active' ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePauseWorkflow(workflow.id)}
                        disabled={loading}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStopWorkflow(workflow.id)}
                        disabled={loading}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {workflow.status === 'paused' ? 'Resume' : 'Start'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
