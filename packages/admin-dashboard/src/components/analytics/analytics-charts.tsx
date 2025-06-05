'use client';

import { Calendar, Download } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const mockUsageData = [
  { name: 'Jan', users: 400, executions: 2400, responseTime: 240 },
  { name: 'Feb', users: 300, executions: 1398, responseTime: 220 },
  { name: 'Mar', users: 500, executions: 3800, responseTime: 260 },
  { name: 'Apr', users: 780, executions: 3908, responseTime: 180 },
  { name: 'May', users: 890, executions: 4800, responseTime: 190 },
  { name: 'Jun', users: 1234, executions: 5800, responseTime: 245 },
];

const mockAgentData = [
  { name: 'GPT-4', value: 45, color: '#3b82f6' },
  { name: 'Claude', value: 30, color: '#10b981' },
  { name: 'Gemini', value: 15, color: '#f59e0b' },
  { name: 'Others', value: 10, color: '#6b7280' },
];

const mockWorkflowData = [
  { name: 'Mon', successful: 120, failed: 8 },
  { name: 'Tue', successful: 140, failed: 12 },
  { name: 'Wed', successful: 110, failed: 6 },
  { name: 'Thu', successful: 160, failed: 15 },
  { name: 'Fri', successful: 180, failed: 10 },
  { name: 'Sat', successful: 90, failed: 4 },
  { name: 'Sun', successful: 85, failed: 5 },
];

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* User Growth Chart */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Growth & Activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              User registration and activity trends over time
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Last 6 months
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockUsageData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExecutions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                name="Users"
              />
              <Area 
                type="monotone" 
                dataKey="executions" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorExecutions)" 
                name="Executions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Model Usage */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Usage</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribution of AI model usage
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={mockAgentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {mockAgentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {mockAgentData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {item.value}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Success Rate</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily workflow execution results
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockWorkflowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="successful" stackId="a" fill="#10b981" name="Successful" />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Successful</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Time Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Response Time Trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            Average system response times over time
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Response Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
