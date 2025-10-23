'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  FolderPlus, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  Info,
  Sparkles
} from 'lucide-react';
import { useApp } from './app-provider';

type WorkflowStep = 'welcome' | 'create-bu' | 'create-lob' | 'upload-data' | 'complete';

interface GuidedWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GuidedWorkflow({ open, onOpenChange }: GuidedWorkflowProps) {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('welcome');
  const [buName, setBuName] = useState('');
  const [buDescription, setBuDescription] = useState('');
  const [lobName, setLobName] = useState('');
  const [lobDescription, setLobDescription] = useState('');
  const [createdBuId, setCreatedBuId] = useState<string | null>(null);
  const [createdLobId, setCreatedLobId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const stepProgress = {
    'welcome': 0,
    'create-bu': 25,
    'create-lob': 50,
    'upload-data': 75,
    'complete': 100
  };

  const handleCreateBU = () => {
    if (buName.trim()) {
      dispatch({ type: 'ADD_BU', payload: { name: buName.trim(), description: buDescription.trim() } });
      
      // Find the newly created BU (it will be the last one)
      const newBu = state.businessUnits[state.businessUnits.length - 1];
      if (newBu) {
        setCreatedBuId(newBu.id);
        dispatch({ type: 'SET_SELECTED_BU', payload: newBu });
      }
      
      setCurrentStep('create-lob');
    }
  };

  const handleCreateLOB = () => {
    if (lobName.trim() && createdBuId) {
      dispatch({ type: 'ADD_LOB', payload: { 
        buId: createdBuId, 
        name: lobName.trim(), 
        description: lobDescription.trim() 
      }});
      
      // Find the newly created LOB
      const updatedBu = state.businessUnits.find(bu => bu.id === createdBuId);
      if (updatedBu && updatedBu.lobs.length > 0) {
        const newLob = updatedBu.lobs[updatedBu.lobs.length - 1];
        setCreatedLobId(newLob.id);
        dispatch({ type: 'SET_SELECTED_LOB', payload: newLob });
      }
      
      setCurrentStep('upload-data');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && createdLobId) {
      dispatch({ type: 'UPLOAD_DATA', payload: { lobId: createdLobId, file } });
      setCurrentStep('complete');
    }
  };

  const handleSkipUpload = () => {
    setCurrentStep('complete');
  };

  const handleComplete = () => {
    onOpenChange(false);
    // Add a welcome message
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `🎉 Welcome to your new setup! You've successfully created **${buName}** business unit with **${lobName}** line of business. ${createdLobId && state.businessUnits.find(bu => bu.id === createdBuId)?.lobs.find(lob => lob.id === createdLobId)?.hasData ? 'Your data has been uploaded and is ready for analysis!' : 'You can upload data anytime or start with sample analysis.'}`,
        suggestions: [
          "Explore my data",
          "Generate a forecast", 
          "Show me a sample analysis",
          "What can I do with this app?",
          "Upload more data"
        ]
      }
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Welcome to BI Forecasting Assistant!</h3>
              <p className="text-muted-foreground mt-2">
                Let's get you set up in just 3 quick steps. We'll create your business unit, 
                add a line of business, and optionally upload your data.
              </p>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This guided setup will help you organize your data by business units and lines of business 
                for better analysis and forecasting.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep('create-bu')}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'create-bu':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Create Business Unit</h3>
              <p className="text-muted-foreground">
                A business unit represents a major division of your organization.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bu-name">Business Unit Name *</Label>
                <Input
                  id="bu-name"
                  value={buName}
                  onChange={(e) => setBuName(e.target.value)}
                  placeholder="e.g., North America, Europe, Consumer Products"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="bu-description">Description (Optional)</Label>
                <Input
                  id="bu-description"
                  value={buDescription}
                  onChange={(e) => setBuDescription(e.target.value)}
                  placeholder="Brief description of this business unit"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('welcome')}>
                Back
              </Button>
              <Button onClick={handleCreateBU} disabled={!buName.trim()}>
                Create Business Unit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'create-lob':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <FolderPlus className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Create Line of Business</h3>
              <p className="text-muted-foreground">
                Add a line of business under <strong>{buName}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="lob-name">Line of Business Name *</Label>
                <Input
                  id="lob-name"
                  value={lobName}
                  onChange={(e) => setLobName(e.target.value)}
                  placeholder="e.g., Retail Sales, Online Store, Product Line A"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="lob-description">Description (Optional)</Label>
                <Input
                  id="lob-description"
                  value={lobDescription}
                  onChange={(e) => setLobDescription(e.target.value)}
                  placeholder="Brief description of this line of business"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('create-bu')}>
                Back
              </Button>
              <Button onClick={handleCreateLOB} disabled={!lobName.trim()}>
                Create Line of Business
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'upload-data':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Upload Your Data</h3>
              <p className="text-muted-foreground">
                Upload your sales data for <strong>{lobName}</strong> to start analyzing
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Upload CSV or Excel files with your sales data. You can always upload more data later 
                or start with sample analysis to explore the platform.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button onClick={handleUploadClick} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Choose File to Upload
              </Button>
              
              <Button variant="outline" onClick={handleSkipUpload} className="w-full">
                Skip for Now - I'll Upload Later
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your business unit and line of business are ready to use.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Business Unit:</span>
                <span>{buName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-primary" />
                <span className="font-medium">Line of Business:</span>
                <span>{lobName}</span>
              </div>
              {createdLobId && state.businessUnits.find(bu => bu.id === createdBuId)?.lobs.find(lob => lob.id === createdLobId)?.hasData && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Data:</span>
                  <span>Uploaded and ready</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleComplete}>
                Start Using the Platform
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{stepProgress[currentStep]}%</span>
            </div>
            <Progress value={stepProgress[currentStep]} className="h-2" />
          </div>

          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}