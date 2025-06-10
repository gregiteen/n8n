'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, CheckCircle2, XCircle, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api-instance';
import type { ApiKeyStatus, ApiKeyRequest } from '@/types/api-keys';

const SERVICE_CONFIG = {
  openai: {
    name: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    description: 'Used for GPT models like GPT-4o, GPT-4, etc.'
  },
  anthropic: {
    name: 'Anthropic',
    url: 'https://console.anthropic.com/keys',
    placeholder: 'sk-ant-...',
    description: 'Used for Claude models like Claude 3 Opus, Sonnet, etc.'
  },
  gemini: {
    name: 'Google Gemini',
    url: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...',
    description: 'Used for Google\'s Gemini models'
  },
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/keys',
    placeholder: 'sk-or-...',
    description: 'Provides access to multiple models through one API'
  }
};

export function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await api.apiKeys.getAllKeys();
      setApiKeys(keys);
      
      // Initialize visibility state for all services
      const initialShowState: Record<string, boolean> = {};
      Object.keys(SERVICE_CONFIG).forEach(service => {
        initialShowState[service] = false;
      });
      setShowKey(initialShowState);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const [keyStrength, setKeyStrength] = useState<Record<string, 'weak' | 'medium' | 'strong'>>({});

  const handleInputChange = (serviceName: string, value: string) => {
    setKeyInputs(prev => ({ ...prev, [serviceName]: value }));
    
    // Clear any previous errors
    if (errors[serviceName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[serviceName];
        return newErrors;
      });
    }

    // Evaluate key strength based on the service and format
    evaluateKeyStrength(serviceName, value);
  };

  const evaluateKeyStrength = (serviceName: string, value: string) => {
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (!value) {
      setKeyStrength(prev => ({ ...prev, [serviceName]: strength }));
      return;
    }

    // Check for expected prefixes and lengths
    switch (serviceName) {
      case 'openai':
        if (value.startsWith('sk-') && value.length > 30) {
          strength = 'strong';
        } else if (value.startsWith('sk-') && value.length > 10) {
          strength = 'medium';
        }
        break;
      case 'anthropic':
        if (value.startsWith('sk-ant-') && value.length > 35) {
          strength = 'strong';
        } else if (value.startsWith('sk-ant-') && value.length > 15) {
          strength = 'medium';
        }
        break;
      case 'gemini':
        if (value.startsWith('AIzaSy') && value.length > 30) {
          strength = 'strong';
        } else if (value.length > 20) {
          strength = 'medium';
        }
        break;
      case 'openrouter':
        if ((value.startsWith('sk-or-') || value.startsWith('sk-')) && value.length > 30) {
          strength = 'strong';
        } else if (value.length > 20) {
          strength = 'medium';
        }
        break;
    }

    setKeyStrength(prev => ({ ...prev, [serviceName]: strength }));
  };

  const toggleShowKey = (serviceName: string) => {
    setShowKey(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const saveApiKey = async (serviceName: string) => {
    const apiKey = keyInputs[serviceName]?.trim();
    
    if (!apiKey) {
      setErrors(prev => ({
        ...prev,
        [serviceName]: 'API key cannot be empty'
      }));
      return;
    }
    
    try {
      setValidating(prev => ({ ...prev, [serviceName]: true }));
      
      const keyData: ApiKeyRequest = {
        serviceName: serviceName as any,
        apiKey
      };
      
      // First validate the key
      const validationResult = await api.apiKeys.validateKey(keyData);
      
      if (!validationResult.isValid) {
        setErrors(prev => ({
          ...prev,
          [serviceName]: validationResult.message || 'Invalid API key'
        }));
        setValidating(prev => ({ ...prev, [serviceName]: false }));
        return;
      }
      
      // If valid, save the key
      const result = await api.apiKeys.saveKey(keyData);
      
      // Update the apiKeys state with the new status
      setApiKeys(prev => {
        const existingKeyIndex = prev.findIndex(k => k.serviceName === serviceName);
        if (existingKeyIndex >= 0) {
          const updatedKeys = [...prev];
          updatedKeys[existingKeyIndex] = result;
          return updatedKeys;
        } else {
          return [...prev, result];
        }
      });
      
      // Clear the input
      setKeyInputs(prev => {
        const updated = { ...prev };
        delete updated[serviceName];
        return updated;
      });
      
      toast({
        title: 'Success',
        description: `${SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG].name} API key saved successfully`,
      });
    } catch (error) {
      console.error(`Error saving ${serviceName} API key:`, error);
      toast({
        title: 'Error',
        description: `Failed to save ${SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG].name} API key`,
        variant: 'destructive',
      });
    } finally {
      setValidating(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  const deleteApiKey = async (serviceName: string) => {
    if (!confirm(`Are you sure you want to delete your ${SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG].name} API key?`)) {
      return;
    }
    
    try {
      await api.apiKeys.deleteKey(serviceName);
      
      // Update the state to reflect the deletion
      setApiKeys(prev => prev.filter(key => key.serviceName !== serviceName));
      
      toast({
        title: 'Success',
        description: `${SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG].name} API key deleted successfully`,
      });
    } catch (error) {
      console.error(`Error deleting ${serviceName} API key:`, error);
      toast({
        title: 'Error',
        description: `Failed to delete ${SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG].name} API key`,
        variant: 'destructive',
      });
    }
  };

  const formatLastValidated = (date?: Date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    
    // If it was today
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise return the date
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           `, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const getApiKeyForService = (serviceName: string) => {
    return apiKeys.find(key => key.serviceName === serviceName);
  };

  // Add revalidation interval state
  const [lastRevalidation, setLastRevalidation] = useState<Date | null>(null);
  
  // Function to revalidate all keys
  const revalidateAllKeys = useCallback(async () => {
    if (!apiKeys.length) return;
    
    try {
      const results = await api.apiKeys.revalidateAllKeys();
      
      if (results) {
        setApiKeys(results);
        setLastRevalidation(new Date());
        
        // Show toast only if there are invalid keys
        const invalidKeys = results.filter((key: ApiKeyStatus) => !key.isConnected);
        if (invalidKeys.length > 0) {
          toast({
            title: 'Key validation alert',
            description: `${invalidKeys.length} API key(s) failed validation. Please check your keys.`,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error revalidating keys:', error);
    }
  }, [apiKeys, toast]);
  
  // Periodically revalidate keys
  useEffect(() => {
    // Only set up timer if there are keys to validate
    if (apiKeys.length === 0) return;
    
    // Revalidate every 24 hours (set to shorter for testing if needed)
    const interval = setInterval(() => {
      revalidateAllKeys();
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [apiKeys, revalidateAllKeys]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Service Connections</h2>
          {lastRevalidation && (
            <p className="text-xs text-muted-foreground">
              Last key validation: {formatLastValidated(lastRevalidation)}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={revalidateAllKeys} 
            disabled={loading || !apiKeys.length}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Validate Keys
          </Button>
          <Button size="sm" variant="outline" onClick={loadApiKeys} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {Object.entries(SERVICE_CONFIG).map(([serviceName, config]) => {
        const apiKey = getApiKeyForService(serviceName);
        const isConnected = apiKey?.isConnected;
        
        return (
          <Card key={serviceName}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <KeyRound className="h-5 w-5 mr-2" />
                  {config.name}
                  {isConnected && <CheckCircle2 className="h-5 w-5 ml-2 text-green-500" />}
                  {!isConnected && apiKey && <XCircle className="h-5 w-5 ml-2 text-red-500" />}
                </CardTitle>
              </div>
              <CardDescription>
                {config.description}
                {' '}
                <a 
                  href={config.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  Get key
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-green-600">Connected</span>
                      <p className="text-sm text-muted-foreground">
                        Last validated: {formatLastValidated(apiKey?.lastValidated)}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteApiKey(serviceName)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey[serviceName] ? 'text' : 'password'}
                        placeholder={config.placeholder}
                        value={keyInputs[serviceName] || ''}
                        onChange={(e) => handleInputChange(serviceName, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleShowKey(serviceName)}
                      >
                        {showKey[serviceName] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => saveApiKey(serviceName)}
                      disabled={validating[serviceName] || !keyInputs[serviceName]}
                    >
                      {validating[serviceName] ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                  
                  {/* Key strength indicator */}
                  {keyInputs[serviceName] && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground mr-1">Key strength:</span>
                      <div className="flex items-center space-x-1">
                        <div 
                          className={`h-1.5 w-4 rounded-full ${
                            keyStrength[serviceName] ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <div 
                          className={`h-1.5 w-4 rounded-full ${
                            keyStrength[serviceName] === 'medium' || keyStrength[serviceName] === 'strong' ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <div 
                          className={`h-1.5 w-4 rounded-full ${
                            keyStrength[serviceName] === 'strong' ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className="text-xs ml-1 capitalize">
                          {keyStrength[serviceName] || 'weak'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {errors[serviceName] && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription>{errors[serviceName]}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!isConnected && apiKey && (
                    <p className="text-sm text-red-500">
                      Last validation failed. Please update your API key.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
