import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkflowStats } from "@/hooks/use-workflows";
import { Workflow, Play, CheckCircle, XCircle, Clock, Activity } from "lucide-react";

export function WorkflowStats() {
  const { data: stats, isLoading, error } = useWorkflowStats();

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
          <p className="text-destructive">Failed to load workflow statistics</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Workflows",
      value: stats.total,
      description: `${stats.active} active, ${stats.error} with errors`,
      icon: Workflow,
      color: "text-blue-600"
    },
    {
      title: "Total Executions",
      value: stats.totalExecutions.toLocaleString(),
      description: "All time executions",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Success Rate",
      value: `${Math.round(stats.avgSuccessRate)}%`,
      description: "Average across all workflows",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Avg Execution Time",
      value: `${Math.round(stats.avgExecutionTime / 1000)}s`,
      description: "Average runtime",
      icon: Clock,
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
          <CardTitle className="text-base">Workflow Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Play className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-muted-foreground">Running workflows</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.active}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.active / stats.total) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Inactive</p>
                  <p className="text-sm text-muted-foreground">Paused workflows</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.inactive / stats.total) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm text-muted-foreground">Failed workflows</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.error}</p>
                <Badge variant="destructive" className="text-xs">
                  {Math.round((stats.error / stats.total) * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
