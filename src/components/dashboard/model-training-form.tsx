"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Calendar, Target, Settings2 } from 'lucide-react';

export interface ModelTrainingConfig {
  // Model Selection
  models: string[];
  
  // Forecast Horizon
  forecastHorizon: number;
  forecastUnit: 'days' | 'weeks' | 'months';
  
  // Confidence Levels
  confidenceLevels: number[];
  
  // Regressors & Features
  includeHolidayEffects: boolean;
  includeSeasonality: boolean;
  seasonalityMode: 'additive' | 'multiplicative';
  
  // Feature Engineering
  featureEngineering: {
    lagFeatures: boolean;
    rollingAverages: boolean;
    trendFeatures: boolean;
  };
  
  // Validation
  validationMethod: 'time_series_cv' | 'holdout';
  validationSplit: number;
}

interface ModelTrainingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (config: ModelTrainingConfig) => void;
  initialConfig?: Partial<ModelTrainingConfig>;
}

const AVAILABLE_MODELS = [
  { id: 'prophet', name: 'Prophet', description: 'Best for seasonal data with holidays' },
  { id: 'xgboost', name: 'XGBoost', description: 'Machine learning approach, high accuracy' },
  { id: 'lightgbm', name: 'LightGBM', description: 'Fast and accurate gradient boosting' },
  { id: 'arima', name: 'ARIMA', description: 'Classical time series method' },
  { id: 'lstm', name: 'LSTM', description: 'Deep learning for complex patterns' },
];

export default function ModelTrainingForm({ open, onOpenChange, onSubmit, initialConfig }: ModelTrainingFormProps) {
  const [config, setConfig] = useState<ModelTrainingConfig>({
    models: initialConfig?.models || ['prophet', 'xgboost', 'lightgbm'],
    forecastHorizon: initialConfig?.forecastHorizon || 30,
    forecastUnit: initialConfig?.forecastUnit || 'days',
    confidenceLevels: initialConfig?.confidenceLevels || [80, 90, 95],
    includeHolidayEffects: initialConfig?.includeHolidayEffects ?? true,
    includeSeasonality: initialConfig?.includeSeasonality ?? true,
    seasonalityMode: initialConfig?.seasonalityMode || 'additive',
    featureEngineering: {
      lagFeatures: initialConfig?.featureEngineering?.lagFeatures ?? true,
      rollingAverages: initialConfig?.featureEngineering?.rollingAverages ?? true,
      trendFeatures: initialConfig?.featureEngineering?.trendFeatures ?? true,
    },
    validationMethod: initialConfig?.validationMethod || 'time_series_cv',
    validationSplit: initialConfig?.validationSplit || 0.2,
  });

  const handleModelToggle = (modelId: string) => {
    setConfig(prev => ({
      ...prev,
      models: prev.models.includes(modelId)
        ? prev.models.filter(m => m !== modelId)
        : [...prev.models, modelId]
    }));
  };

  const handleConfidenceLevelToggle = (level: number) => {
    setConfig(prev => ({
      ...prev,
      confidenceLevels: prev.confidenceLevels.includes(level)
        ? prev.confidenceLevels.filter(l => l !== level)
        : [...prev.confidenceLevels, level].sort((a, b) => a - b)
    }));
  };

  const handleSubmit = () => {
    if (config.models.length === 0) {
      alert('Please select at least one model');
      return;
    }
    if (config.confidenceLevels.length === 0) {
      alert('Please select at least one confidence level');
      return;
    }
    onSubmit(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configure Forecasting Parameters
          </DialogTitle>
          <DialogDescription>
            Customize your forecast settings - choose models, time horizon, confidence levels, and advanced features for accurate predictions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Model Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-semibold">Forecasting Models</Label>
            </div>
            <p className="text-sm text-muted-foreground">Select which ML models to train for your forecast (multiple models will be compared)</p>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_MODELS.map(model => (
                <div
                  key={model.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    config.models.includes(model.id)
                      ? 'border-purple-500 bg-purple-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleModelToggle(model.id)}
                >
                  <Checkbox
                    checked={config.models.includes(model.id)}
                    onCheckedChange={() => handleModelToggle(model.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">{model.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Forecast Horizon */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label className="text-base font-semibold">Forecast Time Period</Label>
            </div>
            <p className="text-sm text-muted-foreground">How far into the future do you want to forecast?</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horizon">Number of Periods</Label>
                <Input
                  id="horizon"
                  type="number"
                  min="1"
                  max="365"
                  value={config.forecastHorizon}
                  onChange={(e) => setConfig(prev => ({ ...prev, forecastHorizon: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={config.forecastUnit}
                  onValueChange={(value: 'days' | 'weeks' | 'months') => 
                    setConfig(prev => ({ ...prev, forecastUnit: value }))
                  }
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Confidence Levels */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <Label className="text-base font-semibold">Prediction Confidence Levels</Label>
            </div>
            <p className="text-sm text-muted-foreground">Choose confidence intervals for forecast uncertainty ranges (higher % = wider range)</p>
            <div className="flex gap-3">
              {[80, 90, 95, 99].map(level => (
                <Badge
                  key={level}
                  variant={config.confidenceLevels.includes(level) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => handleConfidenceLevelToggle(level)}
                >
                  {level}%
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Regressors & Seasonality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <Label className="text-base font-semibold">External Regressors & Patterns</Label>
            </div>
            <p className="text-sm text-muted-foreground">Include external factors that may influence your forecast</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="holiday"
                  checked={config.includeHolidayEffects}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeHolidayEffects: checked as boolean }))
                  }
                />
                <Label htmlFor="holiday" className="font-normal cursor-pointer">
                  Holiday effects (accounts for holidays impacting your data)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="seasonality"
                  checked={config.includeSeasonality}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeSeasonality: checked as boolean }))
                  }
                />
                <Label htmlFor="seasonality" className="font-normal cursor-pointer">
                  Seasonality patterns (weekly, monthly, yearly cycles)
                </Label>
              </div>
              {config.includeSeasonality && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="seasonality-mode" className="text-sm">Seasonality Mode</Label>
                  <Select
                    value={config.seasonalityMode}
                    onValueChange={(value: 'additive' | 'multiplicative') => 
                      setConfig(prev => ({ ...prev, seasonalityMode: value }))
                    }
                  >
                    <SelectTrigger id="seasonality-mode" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="additive">Additive</SelectItem>
                      <SelectItem value="multiplicative">Multiplicative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Feature Engineering */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-600" />
              <Label className="text-base font-semibold">Advanced Feature Engineering</Label>
            </div>
            <p className="text-sm text-muted-foreground">Enhance model accuracy with engineered features from your historical data</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="lag"
                  checked={config.featureEngineering.lagFeatures}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      featureEngineering: { ...prev.featureEngineering, lagFeatures: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="lag" className="font-normal cursor-pointer">
                  Lag features (use past values as predictors)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="rolling"
                  checked={config.featureEngineering.rollingAverages}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      featureEngineering: { ...prev.featureEngineering, rollingAverages: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="rolling" className="font-normal cursor-pointer">
                  Rolling averages (smooth short-term fluctuations)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="trend"
                  checked={config.featureEngineering.trendFeatures}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      featureEngineering: { ...prev.featureEngineering, trendFeatures: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="trend" className="font-normal cursor-pointer">
                  Trend features (capture growth/decline patterns)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Validation Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Model Validation Strategy</Label>
            <p className="text-sm text-muted-foreground">How should we test forecast accuracy before deployment?</p>
            <Select
              value={config.validationMethod}
              onValueChange={(value: 'time_series_cv' | 'holdout') => 
                setConfig(prev => ({ ...prev, validationMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time_series_cv">Time Series Cross-Validation (Recommended - more robust)</SelectItem>
                <SelectItem value="holdout">Holdout Validation (Faster - single split)</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label htmlFor="split" className="text-sm">Test Data Size: {(config.validationSplit * 100).toFixed(0)}% of historical data</Label>
              <Input
                id="split"
                type="range"
                min="0.1"
                max="0.3"
                step="0.05"
                value={config.validationSplit}
                onChange={(e) => setConfig(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                {config.validationSplit <= 0.15 ? 'Small test set - faster but less reliable' : 
                 config.validationSplit >= 0.25 ? 'Large test set - slower but more reliable' :
                 'Balanced test set - good trade-off'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={config.models.length === 0}>
            Generate Forecast
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
