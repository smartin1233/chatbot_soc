'use client';
import { AGENTS } from './chat-panel';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Cpu, HardDrive, AlertCircle, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { mockAgents, agentCommunications } from '@/lib/data';
import type { Agent, AgentStatus, AgentCommunication } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';

const statusConfig: Record<AgentStatus, { icon: React.ReactNode; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { icon: <Activity className="h-4 w-4" />, color: 'text-green-500', badgeVariant: 'default' },
  idle: { icon: <Clock className="h-4 w-4" />, color: 'text-gray-500', badgeVariant: 'secondary' },
  error: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-500', badgeVariant: 'destructive' },
  completed: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-blue-500', badgeVariant: 'outline' },
};

function AgentStatusCard({ agent }: { agent: Agent }) {
  const config = statusConfig[agent.status];
  return (
    <Card className="bg-card/50">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">{agent.name}</CardTitle>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Badge variant={config.badgeVariant} className="capitalize flex items-center gap-1">
                            {React.cloneElement(config.icon as React.ReactElement, { className: `h-3 w-3` })}
                            {agent.status}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{agent.task}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <CardDescription className="text-xs truncate">Task: {agent.task}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU</span>
            <Progress value={agent.cpuUsage} className="w-1/2 h-2" />
            <span>{agent.cpuUsage}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2"><HardDrive className="h-4 w-4" /> Memory</span>
            <Progress value={agent.memoryUsage} className="w-1/2 h-2" />
            <span>{agent.memoryUsage}%</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2">
            <div className="flex flex-col items-center">
                <span className="font-medium">{agent.successRate}%</span>
                <span className="text-muted-foreground">Success</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="font-medium">{agent.avgCompletionTime / 1000}s</span>
                <span className="text-muted-foreground">Avg Time</span>
            </div>
             <div className="flex flex-col items-center">
                <span className="font-medium">{agent.errorCount}</span>
                <span className="text-muted-foreground">Errors</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommunicationLog({ comm }: { comm: AgentCommunication }) {
    return (
        <div className="text-xs p-2 rounded-md bg-muted/50">
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold">{comm.from}</span>
                <span className="text-muted-foreground">&rarr; {comm.to}</span>
            </div>
            <p className="text-muted-foreground">{comm.message}</p>
        </div>
    )
}

export default function AgentMonitorPanel({ className }: { className?: string }) {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prevAgents =>
        prevAgents.map(agent => {
          if (Math.random() > 0.7) { // 30% chance to change state
            const statuses: AgentStatus[] = ['active', 'idle', 'error', 'completed'];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const newTask = newStatus === 'active' ? 'Processing forecast...' : 'Idle';
            return {
              ...agent,
              status: newStatus,
              task: newTask,
              cpuUsage: Math.floor(Math.random() * (newStatus === 'active' ? 70 : 10) + 5),
              memoryUsage: Math.floor(Math.random() * (newStatus === 'active' ? 40 : 15) + 10),
            };
          }
          return {
             ...agent,
              cpuUsage: Math.max(5, agent.cpuUsage + (Math.random() - 0.5) * 5),
              memoryUsage: Math.max(10, agent.memoryUsage + (Math.random() - 0.5) * 8),
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`flex flex-col ${className}`}>
        <CardHeader className="flex flex-row items-center gap-2 p-4 border-b">
            <BarChart2 className="h-6 w-6" />
            <CardTitle className="text-lg">Agent Activity Monitor</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                    <div className="space-y-4">
                        {/* Agent Types Reference */}
                        <h3 className="text-sm font-semibold text-muted-foreground px-1">AGENT TYPES</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-1 mb-4">
                          {Object.entries(AGENTS).map(([key, agent]) => (
                            <div key={key} className="flex items-center gap-2 p-2 bg-card/50 rounded">
                              <span className="text-2xl">{agent.emoji}</span>
                              <div>
                                <p className="font-medium">{agent.name}</p>
                                <p className="text-xs text-muted-foreground">{agent.specialty}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <h3 className="text-sm font-semibold text-muted-foreground px-1">ACTIVE AGENTS</h3>
                    {agents.map(agent => (
                            <AgentStatusCard key={agent.id} agent={agent} />
                        ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground px-1">COMMUNICATION LOG</h3>
                        <div className="space-y-2">
                        {agentCommunications.map((comm, index) => (
                            <CommunicationLog key={index} comm={comm} />
                        ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
