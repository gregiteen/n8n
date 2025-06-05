'use client';

import { Server, Database, Cpu, HardDrive, Network } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSystemHealth } from '@/hooks/use-system-health';

export function SystemHealthOverview() {
  const { data, isLoading, error } = useSystemHealth();
  const healthData = data?.current;

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
  
  if (error || !healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Failed to load system health data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthMetrics = [
    {
      name: 'CPU Usage',
      value: healthData.cpu || 0,
      icon: Cpu,
      status: healthData.status === 'critical' && healthData.cpu > 90 ? 'critical' : 
             healthData.cpu > 80 ? 'warning' : 'healthy',
    },
    {
      name: 'Memory Usage',
      value: healthData.memory || 0,
      icon: Database,
      status: healthData.status === 'critical' && healthData.memory > 90 ? 'critical' : 
             healthData.memory > 85 ? 'warning' : 'healthy',
    },
    {
      name: 'Disk Usage',
      value: healthData.disk || 0,
      icon: HardDrive,
      status: healthData.disk > 90 ? 'critical' : 
             healthData.disk > 80 ? 'warning' : 'healthy',
    },
    {
      name: 'Network I/O',
      value: healthData.network || 0,
      icon: Network,
      status: healthData.network > 90 ? 'warning' : 'healthy',
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
          
          {healthData.services && healthData.services.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Service Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {healthData.services.map((service) => (
                  <div key={service.name} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <span className="text-sm">{service.name}</span>
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground mr-2">{service.responseTime}ms</span>
                      <Badge 
                        variant={
                          service.status === 'healthy' ? 'outline' :
                          service.status === 'warning' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
