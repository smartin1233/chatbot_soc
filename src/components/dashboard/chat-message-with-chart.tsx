"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, User, BarChart, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, WeeklyData } from '@/lib/types';
import InlineChartMessage from './inline-chart-message';
import { dynamicChartGenerator } from '@/lib/dynamic-chart-generator';

interface ChatMessageWithChartProps {
  message: ChatMessage;
  userQuery?: string;
  statisticalAnalysis?: any;
  onSuggestionClick?: (suggestion: string) => void;
  onVisualizeClick?: (messageId: string) => void;
  onGenerateReport?: (messageId: string) => void;
  thinkingSteps?: string[];
}

/**
 * Enhanced Chat Message Component with Inline Chart Support
 * Automatically renders charts based on query intent
 */
export default function ChatMessageWithChart({
  message,
  userQuery,
  statisticalAnalysis,
  onSuggestionClick,
  onVisualizeClick,
  onGenerateReport,
  thinkingSteps = []
}: ChatMessageWithChartProps) {
  
  const isUser = message.role === 'user';
  
  // Detect if chart should be shown inline
  const shouldShowInlineChart = React.useMemo(() => {
    if (!userQuery || !message.visualization?.data) return false;
    
    const intent = dynamicChartGenerator.detectVisualizationIntent(userQuery);
    return intent.needsChart;
  }, [userQuery, message.visualization]);

  // Agent badge info
  const getAgentBadge = () => {
    if (isUser || !message.agentType) return null;
    
    const agentEmojis: Record<string, string> = {
      eda: '🔬',
      forecasting: '📈',
      whatif: '🎯',
      comparative: '⚖️',
      general: '🤖'
    };
    
    const agentNames: Record<string, string> = {
      eda: 'Data Explorer',
      forecasting: 'Forecasting',
      whatif: 'Scenario Planner',
      comparative: 'Performance Comparer',
      general: 'Assistant'
    };
    
    return {
      emoji: agentEmojis[message.agentType] || '🤖',
      name: agentNames[message.agentType] || 'Assistant'
    };
  };

  const agentBadge = getAgentBadge();

  return (
    <div className={cn(
      'flex items-start gap-3 w-full',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {agentBadge?.emoji || <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-prose flex-1", isUser ? "order-1" : "")}>
        {/* Agent Badge */}
        {!isUser && agentBadge && agentBadge.name !== 'Assistant' && (
          <div className="mb-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="font-medium">{agentBadge.name}</span>
          </div>
        )}
        
        {/* Message Content */}
        <div className={cn(
          'rounded-lg p-3 text-sm',
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        )}>
          {message.isTyping ? (
            <div className="space-y-3">
              {/* Typing indicator */}
              <div className="flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span 
                    key={i}
                    className="h-2 w-2 animate-pulse rounded-full bg-current" 
                    style={{ animationDelay: `${delay}s` }} 
                  />
                ))}
              </div>
              
              {/* Thinking steps */}
              {thinkingSteps.length > 0 && (
                <div className="mt-3 space-y-2">
                  {thinkingSteps.map((step, i) => {
                    const isActive = i === thinkingSteps.length - 1;
                    return (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 animate-in slide-in-from-left duration-300"
                        style={{ 
                          animationDelay: `${i * 100}ms`,
                          opacity: isActive ? 1 : 0.5
                        }}
                      >
                        {isActive ? (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        )}
                        <span className={cn(
                          "text-xs transition-all duration-300",
                          isActive ? "text-current font-medium" : "text-muted-foreground/60"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: message.content
                  .replace(/\[WORKFLOW_PLAN\][\s\S]*?\[\/WORKFLOW_PLAN\]/, '')
                  .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br />') 
              }} 
            />
          )}
        </div>
        
        {/* Inline Chart - Automatically shown based on query intent */}
        {!message.isTyping && shouldShowInlineChart && message.visualization?.data && userQuery && (
          <InlineChartMessage
            data={message.visualization.data}
            query={userQuery}
            statisticalAnalysis={statisticalAnalysis}
            onExpand={() => onVisualizeClick?.(message.id)}
          />
        )}
        
        {/* Manual Visualization Button - Shown when chart not auto-displayed */}
        {!message.isTyping && !shouldShowInlineChart && message.visualization && !message.visualization.isShowing && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onVisualizeClick?.(message.id)}
            >
              <BarChart className="mr-2 h-4 w-4" />
              {message.visualization.data.some((d: any) => d.Forecast !== undefined) 
                ? 'Show Actual & Forecast Chart' 
                : message.visualization.showOutliers
                ? 'Show Data with Outliers'
                : 'Visualize Data'}
            </Button>
          </div>
        )}
        
        {/* Expanded Visualization - When manually toggled */}
        {message.visualization?.isShowing && message.visualization.data && userQuery && (
          <InlineChartMessage
            data={message.visualization.data}
            query={userQuery}
            statisticalAnalysis={statisticalAnalysis}
            className="mt-2"
          />
        )}
        
        {/* Suggested Actions */}
        {!message.isTyping && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 bg-muted/30 dark:bg-muted/10 p-2 rounded-lg">
            <div className="text-xs font-medium mb-1.5 text-muted-foreground">
              Suggested Actions:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => onSuggestionClick?.(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Report Generation */}
        {!message.isTyping && message.canGenerateReport && onGenerateReport && (
          <div className="mt-2">
            <Button 
              size="sm" 
              variant="default" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => onGenerateReport(message.id)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        )}
        
        {/* Token Usage (if available) */}
        {!message.isTyping && message.tokenUsage && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {message.tokenUsage.totalTokens} tokens
              {message.tokenUsage.fromCache && ' (cached)'}
            </Badge>
          </div>
        )}
      </div>
      
      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
