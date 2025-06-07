'use client';

import React from 'react';
import { Save, Palette, Bell, Shield, User, Key } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPreferences } from '@/types';

// Mock user preferences
const mockPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    taskUpdates: true,
    systemAlerts: false,
  },
  dashboard: {
    refreshInterval: 30,
    defaultView: 'grid',
    showCompletedTasks: true,
  },
};

export function SettingsPanel() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(mockPreferences);
  const [hasChanges, setHasChanges] = React.useState(false);

  const handlePreferenceChange = (section: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Saving preferences:', preferences);
    setHasChanges(false);
    // Implementation will save to backend
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>
              Manage your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                defaultValue="John Doe"
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button variant="outline" className="w-full">
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>
              Manage your security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Enable Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full">
              Manage API Keys
            </Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize the interface appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', 'theme', e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email Notifications</label>
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                className="rounded border-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Push Notifications</label>
              <input
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
                className="rounded border-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Task Updates</label>
              <input
                type="checkbox"
                checked={preferences.notifications.taskUpdates}
                onChange={(e) => handlePreferenceChange('notifications', 'taskUpdates', e.target.checked)}
                className="rounded border-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">System Alerts</label>
              <input
                type="checkbox"
                checked={preferences.notifications.systemAlerts}
                onChange={(e) => handlePreferenceChange('notifications', 'systemAlerts', e.target.checked)}
                className="rounded border-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dashboard Preferences</CardTitle>
            <CardDescription>
              Customize your dashboard experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Refresh Interval (seconds)</label>
                <select
                  value={preferences.dashboard.refreshInterval}
                  onChange={(e) => handlePreferenceChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Default View</label>
                <select
                  value={preferences.dashboard.defaultView}
                  onChange={(e) => handlePreferenceChange('dashboard', 'defaultView', e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showCompleted"
                  checked={preferences.dashboard.showCompletedTasks}
                  onChange={(e) => handlePreferenceChange('dashboard', 'showCompletedTasks', e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="showCompleted" className="text-sm font-medium">
                  Show Completed Tasks
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
