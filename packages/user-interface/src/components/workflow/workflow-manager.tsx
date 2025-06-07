'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Workflow } from '@/types';

interface WorkflowManagerProps {
  className?: string;
}

export function WorkflowManager({ className }: WorkflowManagerProps) {
  const { 
    workflows, 
    loading,
    error,
    fetchWorkflows,
    updateWorkflow
  } = useWorkflowStore();

  // Load workflows on component mount
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleWorkflowAction = async (workflowId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      let newStatus: Workflow['status'];
      switch (action) {
        case 'start':
          newStatus = 'active';
          break;
        case 'pause':
          newStatus = 'paused';
          break;
        case 'stop':
          newStatus = 'stopped';
          break;
      }
      
      await updateWorkflow(workflowId, { status: newStatus });
    } catch (error) {
      console.error(`Failed to ${action} workflow:`, error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Manager</h2>
          <p className="text-muted-foreground">Manage and monitor your AI workflows</p>
        </div>
        <Button onClick={() => fetchWorkflows()}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pause className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {workflows.filter(w => w.status === 'paused').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Square className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Stopped</p>
                <p className="text-2xl font-bold text-red-600">
                  {workflows.filter(w => w.status === 'stopped').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-600">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workflows found</p>
              <p className="text-sm">Create your first workflow to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={cn('border', getStatusColor(workflow.status))}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(workflow.status)}
                        <span className="capitalize">{workflow.status}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Workflow Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Nodes</p>
                    <p className="text-muted-foreground">{workflow.nodes.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Executions</p>
                    <p className="text-muted-foreground">{workflow.executionCount}</p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">{formatDate(workflow.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Updated</p>
                    <p className="text-muted-foreground">{formatDate(workflow.updatedAt)}</p>
                  </div>
                </div>
                
                {workflow.lastExecution && (
                  <div className="text-sm">
                    <p className="font-medium">Last Execution</p>
                    <p className="text-muted-foreground">{formatDate(workflow.lastExecution)}</p>
                  </div>
                )}

                {/* Node Status */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Nodes Status</p>
                  <div className="flex flex-wrap gap-2">
                    {workflow.nodes.map((node) => (
                      <Badge 
                        key={node.id} 
                        variant="outline"
                        className={cn(
                          'text-xs',
                          node.status === 'completed' && 'border-green-200 bg-green-50',
                          node.status === 'running' && 'border-blue-200 bg-blue-50',
                          node.status === 'failed' && 'border-red-200 bg-red-50',
                          node.status === 'pending' && 'border-gray-200 bg-gray-50'
                        )}
                      >
                        {node.type}
                        {node.status === 'completed' && <CheckCircle className="h-3 w-3 ml-1 text-green-500" />}
                        {node.status === 'running' && <Loader2 className="h-3 w-3 ml-1 text-blue-500 animate-spin" />}
                        {node.status === 'failed' && <XCircle className="h-3 w-3 ml-1 text-red-500" />}
                        {node.status === 'pending' && <Clock className="h-3 w-3 ml-1 text-gray-500" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {workflow.status === 'stopped' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleWorkflowAction(workflow.id, 'start')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  
                  {workflow.status === 'active' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleWorkflowAction(workflow.id, 'stop')}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    </>
                  )}
                  
                  {workflow.status === 'paused' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleWorkflowAction(workflow.id, 'start')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleWorkflowAction(workflow.id, 'stop')}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    </>
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