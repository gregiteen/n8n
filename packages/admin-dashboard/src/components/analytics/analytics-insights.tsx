'use client';

import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Lightbulb,
  ArrowRight,
  Activity
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";


interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric: string;
  change: string;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'performance' | 'usage' | 'users' | 'system';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: string;
  tags: string[];
}

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'achieved';
}

export function AnalyticsInsights() {
  const insights: Insight[] = [
    {
      id: '1',
      type: 'positive',
      title: 'User Growth Accelerating',
      description: 'User registrations increased by 45% this month, exceeding expectations.',
      metric: '1,234 new users',
      change: '+45%',
      recommendation: 'Consider scaling infrastructure to handle increased load.',
      priority: 'medium',
      category: 'users'
    },
    {
      id: '2',
      type: 'negative',
      title: 'Response Time Degrading',
      description: 'Average API response time has increased by 15% over the past week.',
      metric: '245ms avg',
      change: '+15%',
      recommendation: 'Investigate database query performance and consider caching optimizations.',
      priority: 'high',
      category: 'performance'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Agent Usage Imbalance',
      description: 'GPT-4 usage is at 85% capacity while other models are underutilized.',
      metric: '85% capacity',
      change: '+20%',
      recommendation: 'Implement load balancing across AI models to optimize costs.',
      priority: 'medium',
      category: 'usage'
    },
    {
      id: '4',
      type: 'positive',
      title: 'System Uptime Excellent',
      description: 'Platform maintained 99.9% uptime this month, exceeding SLA.',
      metric: '99.9% uptime',
      change: '+0.1%',
      priority: 'low',
      category: 'system'
    }
  ];

  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Implement Caching Layer',
      description: 'Add Redis caching to reduce database load and improve response times.',
      impact: 'high',
      effort: 'medium',
      category: 'Performance',
      tags: ['caching', 'database', 'performance']
    },
    {
      id: '2',
      title: 'Enable Auto-scaling',
      description: 'Configure auto-scaling to handle traffic spikes automatically.',
      impact: 'high',
      effort: 'low',
      category: 'Infrastructure',
      tags: ['scaling', 'infrastructure', 'automation']
    },
    {
      id: '3',
      title: 'Model Load Balancing',
      description: 'Distribute AI model requests to optimize costs and performance.',
      impact: 'medium',
      effort: 'medium',
      category: 'AI Models',
      tags: ['ai', 'load-balancing', 'optimization']
    },
    {
      id: '4',
      title: 'User Onboarding Optimization',
      description: 'Improve user activation rates with guided onboarding flow.',
      impact: 'medium',
      effort: 'high',
      category: 'User Experience',
      tags: ['onboarding', 'ux', 'activation']
    }
  ];

  const goals: Goal[] = [
    {
      id: '1',
      title: 'Monthly Active Users',
      current: 2450,
      target: 3000,
      unit: 'users',
      deadline: 'End of Q4',
      status: 'on-track'
    },
    {
      id: '2',
      title: 'Average Response Time',
      current: 245,
      target: 200,
      unit: 'ms',
      deadline: 'End of month',
      status: 'at-risk'
    },
    {
      id: '3',
      title: 'System Uptime',
      current: 99.9,
      target: 99.9,
      unit: '%',
      deadline: 'Monthly',
      status: 'achieved'
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Activity className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100;
    switch (goal.status) {
      case 'achieved':
        return { color: 'text-green-600', icon: CheckCircle, progress: 100 };
      case 'on-track':
        return { color: 'text-blue-600', icon: TrendingUp, progress };
      case 'at-risk':
        return { color: 'text-red-600', icon: AlertTriangle, progress };
      default:
        return { color: 'text-gray-600', icon: Target, progress };
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Key Insights
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered insights and anomaly detection
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      {insight.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge variant="outline">{insight.category}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm font-medium">{insight.metric}</span>
                    <Badge className={getInsightBadgeColor(insight.type)} variant="outline">
                      {insight.change}
                    </Badge>
                  </div>
                  {insight.recommendation && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Actionable improvements for your platform
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">{rec.title}</h4>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {rec.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(rec.impact)}>
                        {rec.impact} impact
                      </Badge>
                      <Badge className={getEffortColor(rec.effort)}>
                        {rec.effort} effort
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      View Details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals & Targets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals & Targets
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track progress towards key objectives
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => {
                const status = getGoalStatus(goal);
                const StatusIcon = status.icon;
                
                return (
                  <div key={goal.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{goal.title}</h4>
                      <div className="flex items-center space-x-1">
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        <span className={`text-xs ${status.color}`}>
                          {goal.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {goal.current.toLocaleString()} {goal.unit}
                        </span>
                        <span className="text-muted-foreground">
                          Target: {goal.target.toLocaleString()} {goal.unit}
                        </span>
                      </div>
                      <Progress value={status.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(status.progress)}% complete</span>
                        <span>Due: {goal.deadline}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
