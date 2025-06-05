'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Users, BarChart3, Shield } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  {
    title: 'Create Agent',
    description: 'Set up a new AI agent',
    icon: Plus,
    href: '/agents/new',
    color: 'text-green-600',
  },
  {
    title: 'Manage Users',
    description: 'Add or edit user accounts',
    icon: Users,
    href: '/users',
    color: 'text-blue-600',
  },
  {
    title: 'View Analytics',
    description: 'Check performance metrics',
    icon: BarChart3,
    href: '/analytics',
    color: 'text-purple-600',
  },
  {
    title: 'Privacy Settings',
    description: 'Configure privacy options',
    icon: Shield,
    href: '/privacy',
    color: 'text-orange-600',
  },
  {
    title: 'System Settings',
    description: 'Configure system parameters',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-600',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-3 hover:bg-accent"
              >
                <div className="flex items-center space-x-3">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
