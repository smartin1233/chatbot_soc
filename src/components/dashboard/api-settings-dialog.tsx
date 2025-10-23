'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, SecuredInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings, Key, CheckCircle, XCircle, RefreshCw,
  AlertTriangle, Info, Zap, Globe, Lock
} from 'lucide-react';
import { enhancedAPIClient, validateAPIKey } from '@/lib/enhanced-api-client';

interface APISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function APISettingsDialog({ open, onOpenChange }: APISettingsDialogProps) {
  const [config, setConfig] = useState(enhancedAPIClient.getConfig());
  const [testing, setTesting] = useState({ openai: false, openrouter: false });
  const [testResults, setTestResults] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(() => {
    const defaultKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    return enhancedAPIClient.getConfig().openaiKey === defaultKey;
  });
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [restrictedKeyError, setRestrictedKeyError] = useState('');

  useEffect(() => {
    const updateConfig = (newConfig: any) => setConfig(newConfig);
    enhancedAPIClient.onConfigChange(updateConfig);

    // Initial health check
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await enhancedAPIClient.healthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleTestKey = async (provider: 'openai' | 'openrouter') => {
    setTesting(prev => ({ ...prev, [provider]: true }));

    try {
      const apiKey = provider === 'openai' ? config.openaiKey : config.openrouterKey;
      const result = await enhancedAPIClient.testAPIKey(provider, apiKey);

      setTestResults(prev => ({
        ...prev,
        [provider]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { isValid: false, error: 'Test failed' }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = async () => {
    // Validate API key against restricted keys
    const validation = validateAPIKey(config.openaiKey.trim());
    if (!validation.isValid) {
      if (validation.error && validation.error.includes('restricted')) {
        // Auto-clear the field for restricted keys
        setConfig(prev => ({ ...prev, openaiKey: '' }));
        setRestrictedKeyError(validation.error);
        alert(validation.error);
        return;
      } else {
        // Other validation errors (empty key, etc.)
        setRestrictedKeyError(validation.error || '');
        alert(validation.error);
        return;
      }
    }

    // Validate at least one provider is enabled
    if (config.enableOpenAI === false && config.enableOpenRouter === false) {
      alert('At least one API provider must be enabled');
      return;
    }

    // If preferred provider is disabled, switch to the enabled one
    if (config.preferredProvider === 'openai' && config.enableOpenAI === false) {
      config.preferredProvider = 'openrouter';
    } else if (config.preferredProvider === 'openrouter' && config.enableOpenRouter === false) {
      config.preferredProvider = 'openai';
    }

    setSaving(true);

    try {
      // Trim the API key before saving
      const trimmedConfig = { ...config, openaiKey: config.openaiKey.trim() };
      enhancedAPIClient.updateConfig(trimmedConfig);

      // Refresh health status
      await checkHealth();

      // Show success and close after delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (provider: 'openai' | 'openrouter') => {
    if (testing[provider]) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }

    const result = testResults[provider];
    if (result?.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (result?.isValid === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    const health = healthStatus?.[provider];
    if (health?.available) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (health?.available === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusMessage = (provider: 'openai' | 'openrouter') => {
    const result = testResults[provider];
    if (result?.isValid) return 'API key is valid and working';
    if (result?.error) return result.error;

    const health = healthStatus?.[provider];
    if (health?.available) return 'Connected and available';
    if (health?.error) return health.error;

    return 'Status unknown - test your API key';
  };

  // Helper function to check if using default key
  const checkIfDefaultKey = (apiKey: string): boolean => {
    const defaultKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    return apiKey === defaultKey;
  };

  // Handle key input changes with override detection
  const handleKeyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const defaultKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    
    // Check if user is changing from default key
    if (config.openaiKey === defaultKey && newValue !== defaultKey) {
      setShowOverrideWarning(true);
    }
    
    // Update config
    setConfig(prev => ({ ...prev, openaiKey: newValue }));
    
    // Update isUsingDefaultKey state
    setIsUsingDefaultKey(checkIfDefaultKey(newValue));
    
    // Clear restricted key error when typing
    setRestrictedKeyError('');
  };

  // Handle reset to default key
  const handleResetToDefault = () => {
    const defaultKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    setConfig(prev => ({ ...prev, openaiKey: defaultKey }));
    setShowOverrideWarning(false);
    setIsUsingDefaultKey(true);
    setTestResults(prev => ({ ...prev, openai: undefined }));
    setRestrictedKeyError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration & Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Health Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                System Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">OpenAI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon('openai')}
                    <Badge variant={healthStatus?.openai?.available ? 'default' : 'destructive'}>
                      {healthStatus?.openai?.available ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">OpenRouter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon('openrouter')}
                    <Badge variant={healthStatus?.openrouter?.available ? 'default' : 'destructive'}>
                      {healthStatus?.openrouter?.available ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="providers">API Providers</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              {/* OpenAI Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    OpenAI Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">API Key</Label>
                    <div className="flex gap-2">
                      <SecuredInput
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={config.openaiKey}
                        onChange={handleKeyInputChange}
                        className={`font-mono ${showOverrideWarning ? 'border-yellow-500 border-2' : ''}`}
                      />
                      {!isUsingDefaultKey && (
                        <Button
                          variant="outline"
                          onClick={handleResetToDefault}
                          title="Reset to default API key"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleTestKey('openai')}
                        disabled={!config.openaiKey || testing.openai}
                      >
                        {testing.openai ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                    </div>
                    {showOverrideWarning && (
                      <Alert className="bg-yellow-50 border-yellow-500">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          ⚠️ You are overriding the default API key. Make sure you enter a valid key.
                        </AlertDescription>
                      </Alert>
                    )}
                    {restrictedKeyError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {restrictedKeyError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon('openai')}
                      <span className={`${testResults.openai?.isValid || healthStatus?.openai?.available
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                        }`}>
                        {getStatusMessage('openai')}
                      </span>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>OpenAI Setup:</strong> Provides highest quality responses.<br />
                      1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" className="underline font-medium">platform.openai.com/api-keys</a><br />
                      2. Create a new API key<br />
                      3. Add billing information (pay-per-use)<br />
                      4. Copy and paste your key above<br />
                      <span className="text-xs text-muted-foreground">Costs ~$0.002 per 1000 words</span>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* OpenRouter Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    OpenRouter Configuration (Fallback)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openrouter-key">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="openrouter-key"
                        type="password"
                        placeholder="sk-or-v1-..."
                        value={config.openrouterKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, openrouterKey: e.target.value }))}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleTestKey('openrouter')}
                        disabled={!config.openrouterKey || testing.openrouter}
                      >
                        {testing.openrouter ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon('openrouter')}
                      <span className={`${testResults.openrouter?.isValid || healthStatus?.openrouter?.available
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                        }`}>
                        {getStatusMessage('openrouter')}
                      </span>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>OpenRouter Setup (Recommended for Free Usage):</strong><br />
                      1. Visit <a href="https://openrouter.ai/keys" target="_blank" className="underline font-medium">openrouter.ai/keys</a><br />
                      2. Sign up with Google/GitHub (free)<br />
                      3. Generate API key (no billing required)<br />
                      4. Copy and paste your key above<br />
                      <span className="text-xs text-green-600 font-medium">✅ Free tier: $1 credit + free models available</span>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Provider Enable/Disable</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="enable-openai" className="font-medium">OpenAI</Label>
                      <p className="text-sm text-muted-foreground">Enable OpenAI API for high-quality responses</p>
                    </div>
                    <Switch
                      id="enable-openai"
                      checked={config.enableOpenAI !== false}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableOpenAI: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="enable-openrouter" className="font-medium">OpenRouter</Label>
                      <p className="text-sm text-muted-foreground">Enable OpenRouter API for free models</p>
                    </div>
                    <Switch
                      id="enable-openrouter"
                      checked={config.enableOpenRouter !== false}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableOpenRouter: checked }))}
                    />
                  </div>

                  {!config.enableOpenAI && !config.enableOpenRouter && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warning:</strong> At least one API provider must be enabled for the system to function.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Provider Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preferred Provider</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="prefer-openai"
                          name="provider"
                          value="openai"
                          checked={config.preferredProvider === 'openai'}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            preferredProvider: e.target.value as 'openai' | 'openrouter'
                          }))}
                          disabled={config.enableOpenAI === false}
                        />
                        <Label htmlFor="prefer-openai" className={config.enableOpenAI === false ? 'text-muted-foreground' : ''}>
                          OpenAI (High Quality) {config.enableOpenAI === false && '(Disabled)'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="prefer-openrouter"
                          name="provider"
                          value="openrouter"
                          checked={config.preferredProvider === 'openrouter'}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            preferredProvider: e.target.value as 'openai' | 'openrouter'
                          }))}
                          disabled={config.enableOpenRouter === false}
                        />
                        <Label htmlFor="prefer-openrouter" className={config.enableOpenRouter === false ? 'text-muted-foreground' : ''}>
                          OpenRouter (Free) {config.enableOpenRouter === false && '(Disabled)'}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model Selection</Label>
                    {config.preferredProvider === 'openai' ? (
                      <select
                        id="model"
                        className="w-full p-2 border border-input rounded-md"
                        value={config.model}
                        onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                      >
                        <option value="gpt-4.1-mini">GPT-4.1 Mini (Recommended - Latest & Fast)</option>
                        <option value="gpt-4.1">GPT-4.1 (Latest Premium)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (Fast & Efficient)</option>
                        <option value="gpt-4o">GPT-4o (Premium Quality)</option>
                        <option value="o1-mini">O1 Mini (Advanced Reasoning)</option>
                        <option value="gpt-4">GPT-4 (High Quality)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cost Effective)</option>
                      </select>
                    ) : (
                      <select
                        id="openrouter-model"
                        className="w-full p-2 border border-input rounded-md"
                        value={(config as any).openrouterModel || 'meta-llama/llama-4-maverick:free'}
                        onChange={(e) => setConfig(prev => ({ ...prev, openrouterModel: e.target.value }))}
                      >
                        <option value="deepseek/deepseek-chat-v3.1:free">deepseek/deepseek-chat-v3.1:free</option>
                        <option value="meta-llama/llama-4-maverick:free">meta-llama/llama-4-maverick:free</option>
                        <option value="x-ai/grok-4-fast:free">x-ai/grok-4-fast:free</option>
                      </select>
                    )}
                  </div>

                  {/* Forecasting Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="forecast-horizon">Forecast Horizon</Label>
                      <select
                        id="forecast-horizon"
                        className="w-full p-2 border border-input rounded-md"
                        value={(config as any).forecastHorizonDays || 30}
                        onChange={(e) => setConfig(prev => ({ ...prev, forecastHorizonDays: Number(e.target.value) }))}
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confidence">Confidence Level</Label>
                      <select
                        id="confidence"
                        className="w-full p-2 border border-input rounded-md"
                        value={(config as any).confidenceLevel || 0.95}
                        onChange={(e) => setConfig(prev => ({ ...prev, confidenceLevel: Number(e.target.value) }))}
                      >
                        <option value={0.8}>80%</option>
                        <option value={0.9}>90%</option>
                        <option value={0.95}>95%</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Forecast Model Selection</Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {['Prophet','ARIMA','XGBoost','LightGBM','LSTM'].map(m => (
                        <label key={m} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={((config as any).selectedModels || []).includes(m)}
                            onChange={(e) => {
                              const current = new Set((config as any).selectedModels || []);
                              if (e.target.checked) current.add(m); else current.delete(m);
                              setConfig(prev => ({ ...prev, selectedModels: Array.from(current) }));
                            }}
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fallback Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Automatic Fallback Enabled:</strong> If your preferred provider fails,
                      the system will automatically try the alternative provider to ensure uninterrupted service.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cache Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Response Caching</Label>
                      <p className="text-sm text-muted-foreground">Cache responses to improve performance</p>
                    </div>
                    <Switch checked={true} />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => enhancedAPIClient.clearCache()}
                    className="w-full"
                  >
                    Clear Cache
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm font-mono bg-muted/50 p-3 rounded">
                    <div>Cache Stats: {JSON.stringify(enhancedAPIClient.getCacheStats(), null, 2)}</div>
                    <div>Queue Size: {enhancedAPIClient.getQueueSize()}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={checkHealth}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Status
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-1" />
                )}
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
