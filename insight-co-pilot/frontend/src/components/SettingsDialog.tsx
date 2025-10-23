import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';
import type { UserSettings, SettingsUpdate, ValidateKeyResponse } from 'types';

interface SettingsDialogProps {
  sessionId: string;
}

export function SettingsDialog({ sessionId }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ]);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);

  // Load settings when dialog opens
  useEffect(() => {
    if (open && sessionId) {
      loadSettings();
    }
  }, [open, sessionId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await brain.get_settings(sessionId);
      const data: UserSettings = await response.json();
      
      if (data.openai_api_key) {
        setMaskedKey(data.openai_api_key);
        setKeyValid(true);
      }
      setSelectedModel(data.selected_model || 'gpt-4o-mini');
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateApiKey = async (key: string) => {
    if (!key || key.length < 20) {
      setKeyValid(false);
      return;
    }

    try {
      setValidating(true);
      const response = await brain.validate_api_key({ api_key: key });
      const result: ValidateKeyResponse = await response.json();
      
      setKeyValid(result.valid);
      
      if (result.valid) {
        toast.success('API key is valid!');
        if (result.available_models && result.available_models.length > 0) {
          setAvailableModels(result.available_models);
        }
      } else {
        toast.error(result.message || 'Invalid API key');
      }
    } catch (error) {
      setKeyValid(false);
      toast.error('Failed to validate API key');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (apiKey && !keyValid) {
      toast.error('Please validate your API key first');
      return;
    }

    try {
      setLoading(true);
      
      const updates: SettingsUpdate = {
        selected_model: selectedModel
      };
      
      // Only update API key if user entered a new one
      if (apiKey && apiKey !== maskedKey) {
        updates.openai_api_key = apiKey;
      }

      const response = await brain.update_settings(sessionId, updates);
      const data: UserSettings = await response.json();
      
      setMaskedKey(data.openai_api_key || null);
      toast.success('Settings saved successfully!');
      setOpen(false);
      
      // Clear the input field
      setApiKey('');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI API key and select the model for the chatbot.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* API Key Section */}
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type="password"
                  placeholder={maskedKey || "sk-..."}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyValid(null);
                  }}
                  className="pr-10"
                />
                {keyValid !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {keyValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={() => validateApiKey(apiKey)}
                disabled={validating || !apiKey || apiKey.length < 20}
                variant="secondary"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating
                  </>
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
            {maskedKey && (
              <p className="text-xs text-muted-foreground">
                Current key: {maskedKey}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Your API key is stored securely and never shared.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              gpt-4o-mini is recommended for cost-effective performance.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
