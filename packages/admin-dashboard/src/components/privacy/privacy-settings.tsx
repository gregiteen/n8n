'use client';

import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Globe,
  Users,
  FileText
} from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";



interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'data' | 'security' | 'compliance' | 'user';
  impact: 'low' | 'medium' | 'high';
  required?: boolean;
}

export function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'data_minimization',
      title: 'Data Minimization',
      description: 'Automatically minimize data collection to only what is necessary for operations.',
      enabled: true,
      category: 'data',
      impact: 'high',
      required: true
    },
    {
      id: 'anonymization',
      title: 'Automatic Anonymization',
      description: 'Anonymize user data after specified retention periods.',
      enabled: true,
      category: 'data',
      impact: 'high'
    },
    {
      id: 'encryption_at_rest',
      title: 'Encryption at Rest',
      description: 'Encrypt all data stored in databases and file systems.',
      enabled: true,
      category: 'security',
      impact: 'high',
      required: true
    },
    {
      id: 'encryption_in_transit',
      title: 'Encryption in Transit',
      description: 'Encrypt all data transmission between services and clients.',
      enabled: true,
      category: 'security',
      impact: 'high',
      required: true
    },
    {
      id: 'access_logging',
      title: 'Comprehensive Access Logging',
      description: 'Log all data access and modification events for audit trails.',
      enabled: true,
      category: 'compliance',
      impact: 'medium'
    },
    {
      id: 'right_to_erasure',
      title: 'Right to Erasure (GDPR)',
      description: 'Enable automated data deletion upon user request.',
      enabled: true,
      category: 'compliance',
      impact: 'high'
    },
    {
      id: 'consent_management',
      title: 'Granular Consent Management',
      description: 'Allow users to manage specific consent for different data processing activities.',
      enabled: true,
      category: 'user',
      impact: 'medium'
    },
    {
      id: 'data_portability',
      title: 'Data Portability',
      description: 'Enable users to export their data in a machine-readable format.',
      enabled: false,
      category: 'user',
      impact: 'low'
    },
    {
      id: 'purpose_limitation',
      title: 'Purpose Limitation',
      description: 'Restrict data usage to specified purposes only.',
      enabled: true,
      category: 'data',
      impact: 'high'
    },
    {
      id: 'privacy_by_design',
      title: 'Privacy by Design',
      description: 'Apply privacy-by-design principles to all new features.',
      enabled: true,
      category: 'compliance',
      impact: 'high'
    }
  ]);

  const [complianceLevel, setComplianceLevel] = useState('gdpr');
  const [dataRegion, setDataRegion] = useState('eu');

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id && !setting.required
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data':
        return Database;
      case 'security':
        return Lock;
      case 'compliance':
        return FileText;
      case 'user':
        return Users;
      default:
        return Shield;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'data':
        return 'bg-blue-100 text-blue-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'compliance':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
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

  const enabledCount = settings.filter(s => s.enabled).length;
  const complianceScore = Math.round((enabledCount / settings.length) * 100);

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{complianceScore}%</p>
                <p className="text-sm text-green-600">Compliance Score</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{enabledCount}/{settings.length}</p>
                <p className="text-sm text-blue-600">Features Enabled</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-50 border border-purple-200">
              <Globe className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{complianceLevel.toUpperCase()}</p>
                <p className="text-sm text-purple-600">Compliance Level</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Privacy Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure system-wide privacy and compliance settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="compliance-level">Compliance Framework</Label>
              <Select value={complianceLevel} onValueChange={setComplianceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select compliance framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gdpr">GDPR (General Data Protection Regulation)</SelectItem>
                  <SelectItem value="ccpa">CCPA (California Consumer Privacy Act)</SelectItem>
                  <SelectItem value="pipeda">PIPEDA (Personal Information Protection)</SelectItem>
                  <SelectItem value="lgpd">LGPD (Lei Geral de Proteção de Dados)</SelectItem>
                  <SelectItem value="custom">Custom Compliance Framework</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-region">Data Processing Region</Label>
              <Select value={dataRegion} onValueChange={setDataRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data processing region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">European Union</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="global">Global (Multi-region)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {complianceLevel === 'gdpr' && dataRegion !== 'eu' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> GDPR compliance is selected but data processing region is outside the EU. 
                Consider reviewing data transfer mechanisms and adequacy decisions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Security Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure individual privacy and security features
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.map((setting) => {
              const CategoryIcon = getCategoryIcon(setting.category);
              
              return (
                <div key={setting.id} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CategoryIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium">{setting.title}</h4>
                        {setting.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        <Badge className={getCategoryColor(setting.category)} variant="outline">
                          {setting.category}
                        </Badge>
                        <Badge className={getImpactColor(setting.impact)} variant="outline">
                          {setting.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={() => toggleSetting(setting.id)}
                      disabled={setting.required}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <Key className="mr-2 h-4 w-4" />
              Generate Privacy Report
            </Button>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Review Data Flows
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export Configuration
            </Button>
            <Button variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Run Compliance Audit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
