import { Users, UserCheck, UserX, UserPlus, Shield, Eye, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStats } from "@/hooks/use-users";


export function UserStats() {
  const { data: stats, isLoading, error } = useUserStats();

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
          <p className="text-destructive">Failed to load user statistics</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.total,
      description: `${stats.recentSignups} new this week`,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: stats.active,
      description: `${Math.round((stats.active / stats.total) * 100)}% of total`,
      icon: UserCheck,
      color: "text-green-600"
    },
    {
      title: "Inactive Users",
      value: stats.inactive,
      description: `${Math.round((stats.inactive / stats.total) * 100)}% of total`,
      icon: UserX,
      color: "text-orange-600"
    },
    {
      title: "Pending Users",
      value: stats.pending,
      description: "Awaiting activation",
      icon: UserPlus,
      color: "text-purple-600"
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

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Roles Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Administrators</p>
                  <p className="text-sm text-muted-foreground">Full system access</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.byRole.admin}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.byRole.admin / stats.total) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <UserCog className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Regular Users</p>
                  <p className="text-sm text-muted-foreground">Standard access</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.byRole.user}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.byRole.user / stats.total) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Viewers</p>
                  <p className="text-sm text-muted-foreground">Read-only access</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.byRole.viewer}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.byRole.viewer / stats.total) * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
