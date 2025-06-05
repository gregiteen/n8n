import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Activity, Clock, Zap } from "lucide-react";

export function AnalyticsOverview() {
  const overviewStats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      trend: "up",
      description: "from last month",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Sessions",
      value: "892",
      change: "+8%",
      trend: "up",
      description: "current active users",
      icon: Activity,
      color: "text-green-600"
    },
    {
      title: "Avg Response Time",
      value: "245ms",
      change: "-15%",
      trend: "down",
      description: "system performance",
      icon: Zap,
      color: "text-orange-600"
    },
    {
      title: "Uptime",
      value: "99.8%",
      change: "+0.2%",
      trend: "up",
      description: "last 30 days",
      icon: Clock,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewStats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
        const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600';
        
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
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`flex items-center space-x-1 ${trendColor}`}
                >
                  <TrendIcon className="h-3 w-3" />
                  <span>{stat.change}</span>
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
