'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Server, Database, Cpu, HardDrive, Network, Shield } from 'lucide-react';
import { useSystemHealth } from '@/hooks/use-system-health';

export function SystemHealthOverview() {
  const { data: health, isLoading } = useSystemHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="w-24 h-4 bg-muted rounded"></div>
                  <div className="w-12 h-4 bg-muted rounded"></div>
                </div>
                <div className="w-full h-2 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthMetrics = [
    {
      name: 'CPU Usage',
      value: health?.cpu || 0,
      icon: Cpu,
      status: health?.cpu < 80 ? 'healthy' : 'warning',
    },
    {
      name: 'Memory Usage',
      value: health?.memory || 0,
      icon: Database,
      status: health?.memory < 85 ? 'healthy' : 'critical',
    },
    {
      name: 'Disk Usage',
      value: health?.disk || 0,
      icon: HardDrive,
      status: health?.disk < 90 ? 'healthy' : 'warning',
    },
    {
      name: 'Network I/O',
      value: health?.network || 0,
      icon: Network,
      status: 'healthy',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="mr-2 h-5 w-5" />
          System Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {healthMetrics.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {metric.value}%
                  </span>
                  <Badge 
                    variant={
                      metric.status === 'healthy' ? 'default' :
                      metric.status === 'warning' ? 'secondary' : 'destructive'
                    }
                  >
                    {metric.status}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={metric.value} 
                className={`h-2 ${
                  metric.status === 'critical' ? 'bg-red-100' : 
                  metric.status === 'warning' ? 'bg-yellow-100' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
