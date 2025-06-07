'use client';

import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Filter,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, getStatusColor, getTaskTypeIcon, formatRelativeTime } from '@/lib/utils';
import { useTaskStore } from '@/stores';

export function TaskDashboard() {
  const {
    tasks,
    stats,
    loading,
    error,
    selectedFilter,
    setSelectedFilter,
    fetchTasks,
    fetchStats,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    getFilteredTasks,
  } = useTaskStore();

  // Load data on component mount
  React.useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  // Get filtered tasks based on current filter
  const filteredTasks = getFilteredTasks();

  const handleTaskAction = async (taskId: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    try {
      switch (action) {
        case 'pause':
          await pauseTask(taskId);
          break;
        case 'resume':
          await resumeTask(taskId);
          break;
        case 'cancel':
          await cancelTask(taskId);
          break;
        case 'retry':
          await retryTask(taskId);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} task:`, error);
    }
  };

  // Show loading state
  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Tasks</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={fetchTasks}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.running || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently executing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued Tasks</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.queued || 0}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to execute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <div className="h-4 w-4 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              System status: {stats ? 'Online' : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Monitor and manage your AI agent tasks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {['all', 'running', 'queued', 'completed', 'failed'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              selectedFilter === filter
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-2xl">{getTaskTypeIcon(task.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold truncate">{task.name}</h3>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          getStatusColor(task.status)
                        )}
                      >
                        <span className={cn('task-status-dot', `task-status-${task.status}`)} />
                        {task.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {task.description}
                    </p>
                    
                    {task.status === 'running' && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Started {formatRelativeTime(task.startTime)}</span>
                      <span>Priority: {task.priority}</span>
                      {task.agentId && <span>Agent: {task.agentId}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {task.status === 'running' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskAction(task.id, 'pause')}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {task.status === 'paused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskAction(task.id, 'resume')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {task.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskAction(task.id, 'retry')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {(task.status === 'running' || task.status === 'queued') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskAction(task.id, 'cancel')}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {selectedFilter === 'all' 
                ? "You don't have any tasks yet. Create your first task to get started."
                : `No ${selectedFilter} tasks found. Try a different filter.`
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
