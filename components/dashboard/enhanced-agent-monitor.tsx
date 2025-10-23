'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Brain, Activity, Zap, Users, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Cpu, MemoryStick, Network, Database,
  Eye, Settings, RefreshCw, Download, BarChart3, Target,
  Workflow, MessageSquare, Globe, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { enhancedOrchestrator, type EnhancedAgent, type BusinessInsight, type ActionableRecommendation } from '@/ai/enhanced-agent-orchestrator';

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  avgQuality: number;
  avgSuccessRate: number;
  systemLoad: number;
  uptime: string;
  throughput: number;
  errorRate: number;
}

interface AgentCommunication {
  id: string;
  timestamp: Date;
  from: string;
  to: string;
  message: string;
  type: 'handoff' | 'data' | 'insight' | 'error';
  status: 'sent' | 'received' | 'processed';
}

export default function EnhancedAgentMonitor({ className }: { className?: string }) {
  const [agents, setAgents] = useState<EnhancedAgent[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [recommendations, setRecommendations] = useState<ActionableRecommendation[]>([]);
  const [communications, setCommunications] = useState<AgentCommunication[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulated real-time data updates
  useEffect(() => {
    const updateData = () => {
      // Get agent status from orchestrator
      const agentStatus = enhancedOrchestrator.getAgentStatus();
      setAgents(agentStatus);

      // Get system metrics
      const metrics = enhancedOrchestrator.getSystemMetrics();
      setSystemMetrics({
        ...metrics,
        uptime: formatUptime(Date.now() - (24 * 60 * 60 * 1000)), // 24 hours ago
        throughput: Math.floor(Math.random() * 100) + 50,
        errorRate: Math.random() * 2
      });

      // Simulate insights
      setInsights([
        {
          id: 'insight-1',
          type: 'performance',
          title: 'Agent Performance Optimization',
          description: 'EDA Agent showing 95% efficiency, 3% above baseline',
          confidence: 0.95,
          severity: 'medium',
          businessImpact: 'Improved analysis speed and accuracy',
          recommendedActions: ['Monitor performance trends', 'Consider load balancing'],
          dataSupport: { efficiency: 0.95, baseline: 0.92 }
        },
        {
          id: 'insight-2',
          type: 'trend',
          title: 'Workflow Optimization Success',
          description: 'Multi-agent coordination reducing completion time by 18%',
          confidence: 0.88,
          severity: 'low',
          businessImpact: 'Faster insights delivery to business users',
          recommendedActions: ['Scale successful patterns', 'Document best practices'],
          dataSupport: { improvement: 0.18, baseline_time: 120000 }
        }
      ]);

      // Simulate recommendations
      setRecommendations([
        {
          id: 'rec-1',
          priority: 'high',
          category: 'data_quality',
          title: 'Implement Automated Quality Checks',
          description: 'Deploy automated data validation to prevent quality issues',
          expectedOutcome: 'Reduce data quality issues by 40%',
          effort: 'medium',
          timeline: '2-3 weeks',
          dependencies: ['Development resources', 'Testing environment']
        },
        {
          id: 'rec-2',
          priority: 'medium',
          category: 'modeling',
          title: 'Enhance Model Ensemble',
          description: 'Add additional algorithms to improve forecast accuracy',
          expectedOutcome: 'Improve MAPE by 2-3 percentage points',
          effort: 'high',
          timeline: '4-6 weeks',
          dependencies: ['Algorithm research', 'Performance testing']
        }
      ]);

      // Simulate agent communications
      setCommunications(prev => {
        const newComms = generateMockCommunications();
        return [...newComms, ...prev].slice(0, 50); // Keep last 50 communications
      });
    };

    updateData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateData, 3000); // Update every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trigger data update
    const agentStatus = enhancedOrchestrator.getAgentStatus();
    setAgents(agentStatus);
    
    setIsRefreshing(false);
  };

  const generateMockCommunications = (): AgentCommunication[] => {
    const agentNames = ['EDA Agent', 'ML Engineer', 'Forecast Analyst', 'Business Analyst'];
    const messageTypes = ['handoff', 'data', 'insight', 'error'] as const;
    const messages = [
      'Data quality assessment complete - ready for preprocessing',
      'Model training finished - accuracy: 92.5%',
      'Forecast generated with 95% confidence intervals',
      'Business insights extracted - 3 opportunities identified',
      'Outlier detection complete - 2 anomalies found',
      'Feature engineering successful - 12 features created'
    ];

    return Array.from({ length: 3 }, (_, i) => ({
      id: `comm-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 60000), // Within last minute
      from: agentNames[Math.floor(Math.random() * agentNames.length)],
      to: agentNames[Math.floor(Math.random() * agentNames.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      type: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      status: 'processed'
    }));
  };

  const formatUptime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'idle': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'onboarding': return '🚀';
      case 'eda': return '🔬';
      case 'preprocessing': return '🔧';
      case 'modeling': return '🤖';
      case 'validation': return '✅';
      case 'forecasting': return '📈';
      case 'insights': return '💡';
      default: return '🤖';
    }
  };

  const SystemOverview = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {systemMetrics?.activeAgents || 0}/{systemMetrics?.totalAgents || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(((systemMetrics?.activeAgents || 0) / Math.max(systemMetrics?.totalAgents || 1, 1)) * 100)}% utilization
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Load</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round((systemMetrics?.systemLoad || 0) * 100)}%
          </div>
          <Progress value={(systemMetrics?.systemLoad || 0) * 100} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round((systemMetrics?.avgSuccessRate || 0) * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Quality: {Math.round((systemMetrics?.avgQuality || 0) * 100)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Throughput</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {systemMetrics?.throughput || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            requests/min
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const AgentGrid = () => (
    <div className="grid gap-4">
      {agents.map(agent => (
        <Card key={agent.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getAgentTypeIcon(agent.type)}</span>
                <div>
                  <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {agent.specialization?.join(', ') || 'General capabilities'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAgentStatusIcon(agent.status)}
                <Badge variant="outline" className="text-xs">
                  {agent.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Target className="h-3 w-3" />
                  <span className="font-medium">Performance</span>
                </div>
                <div className="space-y-1">
                  <div>Success: {Math.round(agent.successRate * 100)}%</div>
                  <div>Quality: {Math.round(agent.quality * 100)}%</div>
                  <div>Load: {Math.round(agent.currentLoad * 100)}%</div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="h-3 w-3" />
                  <span className="font-medium">Resources</span>
                </div>
                <div className="space-y-1">
                  <div>CPU: {Math.round(agent.cpuUsage * 100)}%</div>
                  <div>Memory: {Math.round(agent.memoryUsage * 100)}%</div>
                  <div>Errors: {agent.errorCount}</div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Timing</span>
                </div>
                <div className="space-y-1">
                  <div>Avg: {Math.round(agent.avgCompletionTime / 1000)}s</div>
                  <div>Last: {agent.lastActivity ? new Date(agent.lastActivity).toLocaleTimeString() : 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                <strong>Current Task:</strong> {agent.task}
              </div>
              {agent.capabilities && (
                <div className="text-xs text-muted-foreground mt-1">
                  <strong>Capabilities:</strong> {agent.capabilities.join(', ')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const InsightsPanel = () => (
    <div className="space-y-4">
      {insights.map(insight => (
        <Card key={insight.id} className={cn(
          "border-l-4",
          insight.severity === 'critical' && "border-l-red-500",
          insight.severity === 'high' && "border-l-orange-500", 
          insight.severity === 'medium' && "border-l-yellow-500",
          insight.severity === 'low' && "border-l-green-500"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{insight.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {Math.round(insight.confidence * 100)}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
            <div className="text-xs">
              <div className="mb-1"><strong>Business Impact:</strong> {insight.businessImpact}</div>
              <div><strong>Recommended Actions:</strong></div>
              <ul className="list-disc list-inside ml-2 mt-1">
                {insight.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const RecommendationsPanel = () => (
    <div className="space-y-4">
      {recommendations.map(rec => (
        <Card key={rec.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{rec.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={rec.priority === 'urgent' ? 'destructive' : 
                              rec.priority === 'high' ? 'default' : 'secondary'}>
                  {rec.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {rec.category}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div><strong>Expected Outcome:</strong> {rec.expectedOutcome}</div>
                <div><strong>Timeline:</strong> {rec.timeline}</div>
              </div>
              <div>
                <div><strong>Effort:</strong> {rec.effort}</div>
                <div><strong>Dependencies:</strong> {rec.dependencies.join(', ')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const CommunicationsPanel = () => (
    <div className="space-y-2">
      {communications.slice(0, 20).map(comm => (
        <div key={comm.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex-shrink-0 mt-1">
            {comm.type === 'handoff' && <Workflow className="h-3 w-3 text-blue-500" />}
            {comm.type === 'data' && <Database className="h-3 w-3 text-green-500" />}
            {comm.type === 'insight' && <Brain className="h-3 w-3 text-purple-500" />}
            {comm.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{comm.from}</span>
              <span>→</span>
              <span>{comm.to}</span>
              <span>•</span>
              <span>{comm.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="text-sm">{comm.message}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("flex flex-col space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Enhanced Agent Intelligence
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring and insights for multi-agent system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4 opacity-50" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <SystemOverview />

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6">
          <ScrollArea className="h-[60vh]">
            <AgentGrid />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <ScrollArea className="h-[60vh]">
            <InsightsPanel />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <ScrollArea className="h-[60vh]">
            <RecommendationsPanel />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <ScrollArea className="h-[60vh]">
            <CommunicationsPanel />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}