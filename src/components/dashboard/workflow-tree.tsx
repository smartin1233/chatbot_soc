
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitMerge, CheckCircle2, AlertCircle, Clock, GitBranch, MoreVertical, Play, Bot } from 'lucide-react';
import type { WorkflowStep, WorkflowStatus } from '@/lib/types';
import { useApp } from './app-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const statusConfig: Record<WorkflowStatus, { icon: React.ReactNode; color: string }> = {
  completed: { icon: <CheckCircle2 />, color: 'text-green-500' },
  active: { icon: <Play className="animate-pulse" />, color: 'text-blue-500' },
  pending: { icon: <Clock />, color: 'text-gray-400' },
  error: { icon: <AlertCircle />, color: 'text-red-500' },
};

function WorkflowNode({ step }: { step: WorkflowStep }) {
  const config = statusConfig[step.status];

  return (
    <li className="flex items-start gap-4 pl-2">
      <div className="flex flex-col items-center h-full">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "rounded-full h-8 w-8 flex items-center justify-center bg-card border", 
                        config.color,
                        step.status === 'active' ? 'ring-4 ring-blue-500/30 border-blue-500' : 'border-border'
                    )}>
                        {React.cloneElement(config.icon as React.ReactElement, { className: "h-5 w-5"})}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p className="capitalize">{step.status}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        {/* Render connecting line only if it's not the last step */}
        <div className="w-px flex-grow bg-border my-2" />
      </div>
      <div className="pt-1 pb-8 flex-1">
        <div className="flex items-center justify-between group">
            <p className={cn("font-medium", step.status === 'active' && 'text-primary')}>{step.name}</p>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p className="max-w-xs">{step.details}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground -mt-1">{step.estimatedTime}</p>
        {step.agent && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                <Bot className="h-3 w-3" />
                <span>{step.agent}</span>
            </div>
        )}
      </div>
    </li>
  );
}


export default function WorkflowTree({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const { workflow } = state;
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);


  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!state.isProcessing || workflow.every(s => s.status === 'completed')) {
        if (state.isProcessing) {
            dispatch({ type: 'SET_PROCESSING', payload: false });
        }
        return;
    };
  
    const interval = setInterval(() => {
        const currentIndex = workflow.findIndex(step => step.status === 'active');
        
        if (currentIndex !== -1) {
            // Complete the current step
            dispatch({ 
                type: 'UPDATE_WORKFLOW_STEP', 
                payload: { id: workflow[currentIndex].id, status: 'completed' } 
            });
            
            // Activate the next step if it exists
            if (currentIndex + 1 < workflow.length) {
                dispatch({ 
                    type: 'UPDATE_WORKFLOW_STEP', 
                    payload: { id: workflow[currentIndex + 1].id, status: 'active' } 
                });
            }
        } else {
             // If no step is active, find the first pending one and activate it
            const firstPendingIndex = workflow.findIndex(step => step.status === 'pending');
            if (firstPendingIndex !== -1) {
                 dispatch({ 
                    type: 'UPDATE_WORKFLOW_STEP', 
                    payload: { id: workflow[firstPendingIndex].id, status: 'active' } 
                });
            }
        }
    }, 2500);
  
    return () => clearInterval(interval);
  }, [workflow, dispatch, state.isProcessing]);


  const renderContent = () => (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
        <div className='p-4'>
            {workflow.length > 0 ? (
                <ol className='relative flex flex-col'>
                    {workflow.map((step, index) => (
                       <React.Fragment key={step.id}>
                            <WorkflowNode step={step} />
                        </React.Fragment>
                    ))}
                </ol>
            ) : (
                <div className="text-center text-sm text-muted-foreground py-10 px-4">
                    <GitMerge className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
                    <p className='font-medium'>No Active Workflow</p>
                    <p>Ask the assistant to start a forecast or analysis to see the steps here.</p>
                </div>
            )}
        </div>
        </ScrollArea>
    </div>
  );
  
  const showAgentMonitor = () => {
    dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: true });
  };

  if (isMobile) {
    return (
      <div className={cn("md:hidden", className)}>
        <Accordion type="single" collapsible className="w-full" defaultValue={isOpen ? "workflow" : ""}>
          <AccordionItem value="workflow">
            <AccordionTrigger onClick={() => setIsOpen(!isOpen)} className="bg-card p-4 border-b">
              <div className="flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                <span className="text-lg font-semibold">Current Workflow</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="h-[50vh] overflow-y-auto">
                {renderContent()}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  return (
    <Card className={cn('flex-col border-r rounded-none hidden md:flex', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 border-b">
        <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            <CardTitle className="text-lg">Current Workflow</CardTitle>
        </div>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={showAgentMonitor} className="h-8 w-8">
                        <Bot className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>Show Agent Monitor</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    