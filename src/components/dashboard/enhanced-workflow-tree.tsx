'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  GitMerge, CheckCircle2, AlertCircle, Clock, GitBranch,
  Play, Bot, Brain, Zap, TrendingUp, Target, Eye,
  MoreVertical, Pause, RotateCcw, FastForward, Settings, X
} from 'lucide-react';
import type { WorkflowStep, WorkflowStatus } from '@/lib/types';
import { useApp } from './app-provider';
import { cn } from '@/lib/utils';

interface EnhancedWorkflowStep extends WorkflowStep {
  progress?: number;
  insights?: string[];
  performance?: {
    actualTime?: number;
    efficiency?: number;
    quality?: number;
  };
  subSteps?: Array<{
    name: string;
    status: 'completed' | 'active' | 'pending';
    duration?: number;
  }>;
}

interface WorkflowMetrics {
  totalSteps: number;
  completedSteps: number;
  activeSteps: number;
  failedSteps: number;
  avgStepTime: number;
  estimatedTimeRemaining: number;
  overallEfficiency: number;
}

const statusConfig: Record<WorkflowStatus, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  animation?: string;
}> = {
  completed: {
    icon: <CheckCircle2 />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-500',
    animation: ''
  },
  active: {
    icon: <Play className="animate-pulse" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-500',
    animation: 'animate-pulse'
  },
  pending: {
    icon: <Clock />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 border-gray-300',
    animation: ''
  },
  error: {
    icon: <AlertCircle />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 border-red-500',
    animation: 'animate-bounce'
  },
};

function EnhancedWorkflowNode({
  step,
  isLast,
  onStepAction
}: {
  step: EnhancedWorkflowStep;
  isLast: boolean;
  onStepAction: (stepId: string, action: string) => void;
}) {
  const config = statusConfig[step.status];
  const [showDetails, setShowDetails] = useState(false);

  return (
    <li className="flex items-start gap-4 pl-2 relative">
      {/* Connection Line */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-px h-full bg-border opacity-50 overflow-auto" />
      )}

      {/* Status Icon */}
      <div className="flex flex-col items-center min-w-0 overflow-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "rounded-full h-10 w-10 flex items-center justify-center border-2 transition-all duration-200 cursor-pointer overflow-auto",
                config.bgColor,
                config.color,
                config.animation,
                step.status === 'active' && 'ring-4 ring-blue-500/30 shadow-lg scale-110'
              )}>
                {React.cloneElement(config.icon as React.ReactElement, {
                  className: "h-5 w-5"
                })}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium capitalize">{step.status}</p>
                {step.performance && (
                  <div className="text-xs space-y-1">
                    {step.performance.efficiency && (
                      <div>Efficiency: {Math.round(step.performance.efficiency * 100)}%</div>
                    )}
                    {step.performance.quality && (
                      <div>Quality: {Math.round(step.performance.quality * 100)}%</div>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Step Content */}
      <div className="flex-1 pb-8 min-w-0">
        <Card className={cn(
          "transition-all duration-200 hover:shadow-md overflow-auto",
          step.status === 'active' && 'ring-2 ring-blue-500/20 shadow-md',
          step.status === 'completed' && 'bg-green-50/50',
          step.status === 'error' && 'bg-red-50/50'
        )}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-medium text-sm truncate",
                  step.status === 'active' && 'text-primary'
                )}>
                  {step.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {step.estimatedTime}
                  </Badge>
                  {step.progress !== undefined && step.status === 'active' && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(step.progress)}% complete
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {step.agent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {step.agent.split(' ')[0]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{step.agent}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setShowDetails(!showDetails)}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Step options</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Progress Bar for Active Steps */}
            {step.status === 'active' && step.progress !== undefined && (
              <Progress value={step.progress} className="mb-3 h-2" />
            )}

            {/* Step Details */}
            <p className="text-xs text-muted-foreground mb-2">{step.details}</p>

            {/* Sub-steps */}
            {step.subSteps && step.subSteps.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Sub-tasks:</p>
                {step.subSteps.map((subStep, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {subStep.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {subStep.status === 'active' && <Clock className="h-3 w-3 text-blue-500 animate-spin" />}
                    {subStep.status === 'pending' && <Clock className="h-3 w-3 text-gray-400" />}
                    <span className={cn(
                      subStep.status === 'completed' && 'line-through text-muted-foreground',
                      subStep.status === 'active' && 'text-primary font-medium'
                    )}>
                      {subStep.name}
                    </span>
                    {subStep.duration && (
                      <span className="text-muted-foreground">({subStep.duration}ms)</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Performance Metrics */}
            {step.performance && (step.status === 'completed' || step.status === 'active') && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {step.performance.actualTime && (
                    <div className="text-center">
                      <div className="font-medium">Time</div>
                      <div className="text-muted-foreground">
                        {Math.round(step.performance.actualTime / 1000)}s
                      </div>
                    </div>
                  )}
                  {step.performance.efficiency && (
                    <div className="text-center">
                      <div className="font-medium">Efficiency</div>
                      <div className="text-muted-foreground">
                        {Math.round(step.performance.efficiency * 100)}%
                      </div>
                    </div>
                  )}
                  {step.performance.quality && (
                    <div className="text-center">
                      <div className="font-medium">Quality</div>
                      <div className="text-muted-foreground">
                        {Math.round(step.performance.quality * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insights */}
            {step.insights && step.insights.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <p className="text-xs font-medium mb-1 flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Key Insights:
                </p>
                <ul className="space-y-1">
                  {step.insights.map((insight, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <Zap className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons for Active Steps */}
            {step.status === 'active' && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => onStepAction(step.id, 'pause')}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => onStepAction(step.id, 'skip')}
                >
                  <FastForward className="h-3 w-3 mr-1" />
                  Skip
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </li>
  );
}

export default function EnhancedWorkflowTree({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const { workflow } = state;
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(400);

  const [enhancedWorkflow, setEnhancedWorkflow] = useState<EnhancedWorkflowStep[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (workflow.length === 0) {
      setEnhancedWorkflow([]);
      setMetrics(null);
      return;
    }

    const enhanced = workflow.map(step => {
      const enhanced: EnhancedWorkflowStep = {
        ...step,
        progress: step.status === 'active' ? Math.floor(Math.random() * 80) + 10 : undefined,
        insights: generateStepInsights(step),
        performance: step.status === 'completed' ? {
          actualTime: Math.floor(Math.random() * 30000) + 10000,
          efficiency: 0.8 + Math.random() * 0.2,
          quality: 0.85 + Math.random() * 0.15
        } : undefined,
        subSteps: generateSubSteps(step)
      };
      return enhanced;
    });

    setEnhancedWorkflow(enhanced);

    const completedSteps = enhanced.filter(s => s.status === 'completed').length;
    const activeSteps = enhanced.filter(s => s.status === 'active').length;
    const failedSteps = enhanced.filter(s => s.status === 'error').length;

    const completedPerformance = enhanced
      .filter(s => s.performance)
      .map(s => s.performance!.actualTime || 0);

    const avgStepTime = completedPerformance.length > 0
      ? completedPerformance.reduce((a, b) => a + b, 0) / completedPerformance.length
      : 0;

    const remainingSteps = enhanced.length - completedSteps - failedSteps;
    const estimatedTimeRemaining = remainingSteps * avgStepTime;

    setMetrics({
      totalSteps: enhanced.length,
      completedSteps,
      activeSteps,
      failedSteps,
      avgStepTime,
      estimatedTimeRemaining,
      overallEfficiency: completedPerformance.length > 0
        ? enhanced.filter(s => s.performance).reduce((sum, s) => sum + (s.performance?.efficiency || 0), 0) / completedPerformance.length
        : 0
    });
  }, [workflow]);

  const generateStepInsights = (step: WorkflowStep): string[] => {
    const insights = [];

    if (step.agent?.includes('EDA')) {
      insights.push('Data quality score: 94/100');
      insights.push('Strong seasonal patterns detected');
      insights.push('3 outliers identified for review');
    } else if (step.agent?.includes('ML')) {
      insights.push('XGBoost showing best performance');
      insights.push('Cross-validation MAPE: 8.2%');
      insights.push('Feature importance: Date, lag-7, seasonal');
    } else if (step.agent?.includes('Forecast')) {
      insights.push('95% confidence intervals calculated');
      insights.push('Next 30 days show 12% growth');
      insights.push('Seasonal uplift expected in Q4');
    }

    return insights.slice(0, 2);
  };

  const generateSubSteps = (step: WorkflowStep) => {
    const subStepOptions = {
      'Data Analysis': [
        { name: 'Load and validate data', status: 'completed' as const, duration: 1200 },
        { name: 'Statistical summary', status: 'completed' as const, duration: 800 },
        { name: 'Pattern detection', status: 'active' as const },
        { name: 'Quality assessment', status: 'pending' as const }
      ],
      'Model Training': [
        { name: 'Feature engineering', status: 'completed' as const, duration: 2100 },
        { name: 'Algorithm selection', status: 'completed' as const, duration: 1500 },
        { name: 'Hyperparameter tuning', status: 'active' as const },
        { name: 'Cross-validation', status: 'pending' as const }
      ],
      'Generate Forecast': [
        { name: 'Model preparation', status: 'completed' as const, duration: 800 },
        { name: 'Forecast calculation', status: 'active' as const },
        { name: 'Confidence intervals', status: 'pending' as const }
      ]
    };

    const stepName = step.name.includes('Analysis') ? 'Data Analysis' :
      step.name.includes('Training') ? 'Model Training' :
        step.name.includes('Forecast') ? 'Generate Forecast' : null;

    return stepName ? subStepOptions[stepName] || [] : [];
  };

  useEffect(() => {
    if (state.isProcessing && workflow.length > 0 && workflow.every(s => s.status === 'completed')) {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, [workflow, dispatch, state.isProcessing]);

  const handleStepAction = (stepId: string, action: string) => {
    switch (action) {
      case 'pause':
        break;
      case 'skip':
        dispatch({
          type: 'UPDATE_WORKFLOW_STEP',
          payload: { id: stepId, status: 'completed' }
        });
        break;
      case 'retry':
        dispatch({
          type: 'UPDATE_WORKFLOW_STEP',
          payload: { id: stepId, status: 'pending' }
        });
        break;
    }
  };

  const showAgentMonitor = () => {
    dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: true });
  };

  const WorkflowMetricsDisplay = () => (
    metrics && (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Workflow Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-medium mb-1">Progress</div>
              <div className="text-muted-foreground">
                {metrics.completedSteps}/{metrics.totalSteps} steps
              </div>
              <Progress
                value={(metrics.completedSteps / metrics.totalSteps) * 100}
                className="mt-1 h-1"
              />
            </div>
            <div>
              <div className="font-medium mb-1">Efficiency</div>
              <div className="text-muted-foreground">
                {Math.round(metrics.overallEfficiency * 100)}%
              </div>
              <Progress
                value={metrics.overallEfficiency * 100}
                className="mt-1 h-1"
              />
            </div>
            <div>
              <div className="font-medium mb-1">Avg Step Time</div>
              <div className="text-muted-foreground">
                {Math.round(metrics.avgStepTime / 1000)}s
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">ETA</div>
              <div className="text-muted-foreground">
                {Math.round(metrics.estimatedTimeRemaining / 1000)}s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  );

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = drawerWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
      setDrawerWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderContent = () => (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* Fixed Metrics Header */}
      {metrics && (
        <div className="flex-shrink-0 p-3 border-b bg-muted/30">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-medium mb-1">Progress</div>
              <div className="text-muted-foreground">
                {metrics.completedSteps}/{metrics.totalSteps} steps
              </div>
              <Progress
                value={(metrics.completedSteps / metrics.totalSteps) * 100}
                className="mt-1 h-1"
              />
            </div>
            <div>
              <div className="font-medium mb-1">Efficiency</div>
              <div className="text-muted-foreground">
                {Math.round(metrics.overallEfficiency * 100)}%
              </div>
              <Progress
                value={metrics.overallEfficiency * 100}
                className="mt-1 h-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 p-4 space-y-3">
        {enhancedWorkflow.length > 0 ? (
          enhancedWorkflow.map((step, index) => (
            <div key={step.id} className="relative">
              <EnhancedWorkflowNode
                step={step}
                isLast={index === enhancedWorkflow.length - 1}
                onStepAction={handleStepAction}
              />
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-10">
            <GitMerge className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium">No Active Workflow</p>
            <p>Start asking questions to see agents working in real-time.</p>
            <div className="mt-4 text-xs space-y-1">
              <p><strong>Try asking:</strong></p>
              <p>• "Explore my data patterns"</p>
              <p>• "Generate a forecast"</p>
              <p>• "Clean and prepare my data"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      {isMobile ? (
        <div style={{ height: '100%', overflow: 'auto' }} className={cn("md:hidden", className)}>
          <Accordion type="single" collapsible className="w-full" defaultValue={isOpen ? "workflow" : ""}>
            <AccordionItem value="workflow">
              <AccordionTrigger onClick={() => setIsOpen(!isOpen)} className="bg-card p-4 border-b">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-6 w-6" />
                  <span className="text-lg font-semibold">Enhanced Workflow</span>
                  {metrics && (
                    <Badge variant="outline">
                      {metrics.completedSteps}/{metrics.totalSteps}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div style={{ height: '50vh', overflow: 'auto' }}>
                  {enhancedWorkflow.length > 0 ? (
                    <ol className="relative flex flex-col space-y-2">
                      {enhancedWorkflow.map((step, index) => (
                        <EnhancedWorkflowNode
                          key={step.id}
                          step={step}
                          isLast={index === enhancedWorkflow.length - 1}
                          onStepAction={handleStepAction}
                        />
                      ))}
                    </ol>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 px-4">
                      <GitMerge className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="font-medium">No Active Workflow</p>
                      <p>Start asking questions to see which business analysts are working on your request in real-time.</p>
                      <div className="mt-4 text-xs space-y-1">
                        <p><strong>Try asking:</strong></p>
                        <p>• "Explore my data patterns"</p>
                        <p>• "Generate a forecast"</p>
                        <p>• "Clean and prepare my data"</p>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ) : (
        <>
          {/* Workflow Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "fixed top-1/2 left-0 -translate-y-1/2 z-30 rounded-l-none rounded-r-md border-l-0 transition-all duration-200",
              "bg-background/80 backdrop-blur-sm border shadow-md hover:shadow-lg",
              "opacity-60 hover:opacity-100",
              isOpen && "opacity-0 pointer-events-none"
            )}
          >
            <GitBranch className="h-4 w-4" />
            {metrics && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {metrics.completedSteps}/{metrics.totalSteps}
              </Badge>
            )}
          </Button>

          {/* Workflow Drawer */}
          <div
            style={{
              height: '100vh',
              width: `${drawerWidth}px`,
              overflow: 'auto',
            }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 bg-background border-r shadow-xl transform transition-transform duration-300 ease-in-out flex",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Main Drawer Content */}
            <Card style={{ height: '100%', overflow: 'auto' }} className="flex-col rounded-none h-full flex-1">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 border-b flex-shrink-0 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <GitBranch className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    {metrics && (
                      <p className="text-sm font-medium">
                        {metrics.completedSteps}/{metrics.totalSteps} • {Math.round(metrics.overallEfficiency * 100)}%
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={showAgentMonitor} className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Show Agent Monitor</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Close Workflow</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent style={{ height: 'calc(100% - 60px)', overflow: 'auto' }} className="p-0 flex-1">
                {renderContent()}
              </CardContent>
            </Card>

            {/* Resize Handle */}
            <div
              className="w-1 cursor-col-resize bg-border hover:bg-primary/60 transition-colors relative group"
              onMouseDown={handleResizeStart}
            />
          </div>

          {/* Overlay */}
          {isOpen && (
            <div
              style={{ height: '100vh' }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setIsOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
