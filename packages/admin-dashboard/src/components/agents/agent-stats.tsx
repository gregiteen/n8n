import { Activity, AlertCircle, Bot, CheckCircle, Clock, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentStatus } from "@/hooks/use-agent-status";

export function AgentStats() {
  const { data: agents, isLoading, error } = useAgentStatus();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load agent statistics</p>
        </CardContent>
      </Card>
    );
  }

  if (!agents) return null;

  const totalAgents = agents.length;
  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const errorAgents = agents.filter(agent => agent.status === 'error').length;
  const idleAgents = agents.filter(agent => agent.status === 'idle').length;

  const totalExecutions = agents.reduce((sum, agent) => sum + agent.executionCount, 0);
  const avgResponseTime = totalExecutions > 0 
    ? agents.reduce((sum, agent) => sum + agent.avgResponseTime, 0) / agents.length 
    : 0;

  const statCards = [
    {
      title: "Total Agents",
      value: totalAgents,
      description: `${activeAgents} active, ${errorAgents} with errors`,
      icon: Bot,
      color: "text-blue-600"
    },
    {
      title: "Active Agents",
      value: activeAgents,
      description: `${Math.round((activeAgents / totalAgents) * 100)}% of total`,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Total Executions",
      value: totalExecutions.toLocaleString(),
      description: "All time executions",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Avg Response Time",
      value: `${Math.round(avgResponseTime)}ms`,
      description: "Across all agents",
      icon: Zap,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-muted-foreground">Running normally</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{activeAgents}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((activeAgents / totalAgents) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Idle</p>
                  <p className="text-sm text-muted-foreground">Waiting for tasks</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{idleAgents}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((idleAgents / totalAgents) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm text-muted-foreground">Requires attention</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{errorAgents}</p>
                <Badge variant="destructive" className="text-xs">
                  {Math.round((errorAgents / totalAgents) * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
