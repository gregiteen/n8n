'use client';

import { Activity, Server, Database, Cpu } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemMetrics } from '@/hooks/use-system-metrics';

export function SystemOverview() {
  const { data: metrics, isLoading } = useSystemMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: 'System Status',
      value: metrics?.systemStatus || 'Healthy',
      icon: Activity,
      color: metrics?.systemStatus === 'Healthy' ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Active Agents',
      value: metrics?.activeAgents || '0',
      icon: Server,
      color: 'text-blue-600',
    },
    {
      title: 'CPU Usage',
      value: `${metrics?.cpuUsage || 0}%`,
      icon: Cpu,
      color: 'text-orange-600',
    },
    {
      title: 'Memory Usage',
      value: `${metrics?.memoryUsage || 0}%`,
      icon: Database,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
