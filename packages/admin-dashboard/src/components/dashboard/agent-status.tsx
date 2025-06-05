'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Play, Pause, Settings } from 'lucide-react';
import { useAgentStatus } from '@/hooks/use-agent-status';

export function AgentStatus() {
  const { data: agents, isLoading } = useAgentStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-muted rounded"></div>
                    <div className="w-16 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          AI Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents?.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {agent.type}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                >
                  {agent.status}
                </Badge>
                <Button size="sm" variant="ghost">
                  {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-muted-foreground">
              No agents configured yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
