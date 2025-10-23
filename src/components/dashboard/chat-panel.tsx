'use client';

import React, { FormEvent, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Paperclip, Send, User, BarChart, CheckCircle, FileText } from 'lucide-react';
import { useApp } from './app-provider';
import type { ChatMessage, WeeklyData, WorkflowStep, OutlierData, ForecastData } from '@/lib/types';
import { cn } from '@/lib/utils';
import AgentMonitorPanel from './agent-monitor';
import DataVisualizer from './data-visualizer';

type AgentConfig = {
  name: string;
  emoji: string;
  specialty: string;
  keywords: string[];
  systemPrompt: string;
};

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export const AGENTS: Record<string, AgentConfig> = {
    eda: {
      name: "EDA Agent",
      emoji: "🔬",
      specialty: "Data Explorer",
      keywords: ['explore', 'eda', 'analyze', 'distribution', 'pattern', 'correlation', 'outlier', 'statistics', 'summary', 'data quality'],
      systemPrompt: `You are a friendly data explorer who helps customers understand their data.

YOUR COMMUNICATION STYLE:
- Talk like you're explaining to a business owner, not a data scientist
- Use everyday language - no technical jargon
- Keep it short and sweet - 3-5 bullet points max
- Show what the data means for their business
- Always end with "What would you like to do next?"

WHAT TO INCLUDE:
✓ Statistical summary (records, mean/median, range, trend, seasonality)
✓ Key patterns you noticed
✓ Simple next step suggestions

DO NOT mention outliers unless the user asks about outliers, anomalies, or a quality check.

Example response:
"📊 **Your Data at a Glance**
• You have 2,500 records - that's plenty to work with
• Sales are trending upward by about 15%
• There's a clear weekly pattern - weekends are slower
• Data quality looks good - 99% complete

**What This Means:** Your business is growing steadily with predictable patterns.

**What would you like to do next?**"`
    },
  
    forecasting: {
      name: "Forecasting Agent",
      emoji: "📈",
      specialty: "Future Predictor",
      keywords: ['forecast', 'predict', 'future', 'projection', 'trend', 'time series', 'arima', 'prophet', 'prediction'],
      systemPrompt: `You help customers see what's coming next for their business.

YOUR COMMUNICATION STYLE:
- Explain forecasts like you're talking to a friend who runs a business
- Use simple numbers and percentages - avoid formulas
- Focus on what they should DO with this information
- Be confident but honest about uncertainty

WHAT TO INCLUDE:
✓ The forecast (clear numbers)
✓ How confident we are (High/Medium/Low)
✓ What's driving the forecast
✓ What they should prepare for

Example response:
"📈 **Your 30-Day Forecast**
• Expected sales: $125,000 (±8%)
• That's a 12% increase from last month
• The upward trend should continue
• Confidence level: High

**What This Means:** Plan for increased inventory and staff for next month.

**What would you like to do next?**"`
    },
  
    whatif: {
      name: "What-If Agent",
      emoji: "🎯",
      specialty: "Scenario Planner",
      keywords: ['what if', 'scenario', 'simulate', 'impact', 'sensitivity', 'assumption', 'compare scenarios', 'outcome'],
      systemPrompt: `You help customers explore "what if" scenarios for their business decisions.

YOUR COMMUNICATION STYLE:
- Make scenarios easy to compare side-by-side
- Use real numbers that matter to the business
- Show best case, worst case, and most likely
- Help them make confident decisions

WHAT TO INCLUDE:
✓ The scenario comparison (clear differences)
✓ Impact in dollars or percentages
✓ Which scenario you'd recommend and why
✓ What could go wrong

Example response:
"🎯 **Scenario Comparison**

**If you increase prices by 10%:**
• Revenue: +$45K per month
• Customer loss: ~5%
• Net gain: +$38K

**If you keep current prices:**
• Revenue: Stable at $350K
• Customer retention: High
• Growth: Slower

**My Recommendation:** Try the price increase - the numbers show strong upside with manageable risk.

**What would you like to do next?**"`
    },
  
    comparative: {
      name: "Comparative Agent",
      emoji: "⚖️",
      specialty: "Performance Comparer",
      keywords: ['compare', 'comparison', 'benchmark', 'versus', 'vs', 'difference', 'performance gap', 'relative'],
      systemPrompt: `You help customers understand how different parts of their business stack up.

YOUR COMMUNICATION STYLE:
- Show clear winners and opportunities
- Use rankings and percentages
- Highlight the biggest gaps
- Suggest how to improve weaker areas

WHAT TO INCLUDE:
✓ Who's performing best (and by how much)
✓ Notable differences
✓ Why the gap exists
✓ How to close the gap

Example response:
"⚖️ **Performance Comparison**

**Top Performer:** Product Line A
• Sales: $450K (35% above average)
• Growth: +22% this quarter

**Needs Attention:** Product Line C
• Sales: $180K (40% below average)
• Growth: Flat

**The Gap:** Product A has better marketing and seasonal timing. Product C needs a refresh.

**Quick Win:** Apply Product A's marketing strategy to Product C.

**What would you like to do next?**"`
    },
  
    general: {
      name: "General Assistant",
      emoji: "🤖",
      specialty: "Your Business Assistant",
      keywords: [],
      systemPrompt: `You're a helpful business assistant who keeps things simple and actionable.

YOUR COMMUNICATION STYLE:
- Be friendly and helpful
- Get straight to the point
- Offer clear choices
- No unnecessary words

WHAT TO DO:
✓ Answer questions directly
✓ Offer 2-3 specific next steps
✓ Guide them to useful features
✓ Keep it conversational

Example response:
"I can help you with that! Here's what you can do:

• **Upload your data** - I'll analyze it for insights
• **Run a forecast** - See what's coming next month
• **Compare performance** - Find your top performers

What sounds most useful to you?"`
    }
};

class MultiAgentChatHandler {
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
  private dispatch: any;
  private currentAgent: string = 'general';

  constructor(dispatch: any) {
    this.dispatch = dispatch;
  }

  // Agent Selection Logic with sequential workflow support
  selectAgent(userMessage: string, context: any): string[] {
    const lowerMessage = userMessage.toLowerCase();
    const selectedAgents: string[] = [];

    // Define sequential workflow for forecasting (only on explicit action)
    const forecastingWorkflow = ['eda', 'forecasting'];

    // Trigger only when user explicitly asks to run/generate/start a forecast
    if (/(run|start|generate|create)\s+(a\s+)?forecast/i.test(lowerMessage) || /run.*forecast|generate.*forecast|start.*forecast/i.test(lowerMessage)) {
      this.dispatch({
        type: 'ADD_THINKING_STEP',
        payload: '🔄 Forecasting workflow initiated'
      });
      return forecastingWorkflow;
    }

    // Otherwise, check each agent's keywords for single agent selection
    for (const [agentKey, agent] of Object.entries(AGENTS)) {
      if (agentKey === 'general') continue;

      for (const keyword of agent.keywords) {
        if (lowerMessage.includes(keyword)) {
          selectedAgents.push(agentKey);
          this.dispatch({
            type: 'ADD_THINKING_STEP',
            payload: `${agent.emoji} ${agent.name} selected`
          });
          break;
        }
      }
      if (selectedAgents.length > 0) break;
    }

    if (selectedAgents.length === 0) {
      this.dispatch({
        type: 'ADD_THINKING_STEP',
        payload: `${AGENTS.general.emoji} General Assistant selected`
      });
      selectedAgents.push('general');
    }

    return selectedAgents;
  }
  
  // Create workflow steps based on selected agents
  createWorkflowSteps(agentKeys: string[]): WorkflowStep[] {
    const workflowMap: Record<string, { name: string; time: string; details: string }> = {
      eda: { 
        name: 'Analyzing Your Data', 
        time: '15-30s', 
        details: 'Examining patterns, trends, and data quality' 
      },
      forecasting: { 
        name: 'Generating Forecast', 
        time: '20-40s', 
        details: 'Creating predictions based on historical patterns' 
      },
      whatif: { 
        name: 'Running Scenarios', 
        time: '15-25s', 
        details: 'Comparing different business scenarios' 
      },
      comparative: { 
        name: 'Comparing Performance', 
        time: '15-30s', 
        details: 'Benchmarking and identifying gaps' 
      },
      general: { 
        name: 'Processing Request', 
        time: '10-20s', 
        details: 'Understanding and responding to your query' 
      }
    };

    return agentKeys.map((key, index) => {
      const config = workflowMap[key] || workflowMap.general;
      const agent = AGENTS[key] || AGENTS.general;
      
      return {
        id: `step-${index + 1}`,
        name: config.name,
        status: index === 0 ? 'active' : 'pending',
        dependencies: index > 0 ? [`step-${index}`] : [],
        estimatedTime: config.time,
        details: config.details,
        agent: agent.name
      };
    });
  }

  async generateResponse(userMessage: string, context: any) {
    this.dispatch({ type: 'ADD_THINKING_STEP', payload: '🔍 Analyzing request...' });

    // Select appropriate agents (could be multiple for sequential workflow)
    const agentsToUse = this.selectAgent(userMessage, context);
    
    // CREATE WORKFLOW STEPS IMMEDIATELY
    const workflowSteps = this.createWorkflowSteps(agentsToUse);
    this.dispatch({ type: 'SET_WORKFLOW', payload: workflowSteps });
    
    let finalResponse = '';
    let finalReportData = null;
    let finalAgentType = 'general';

    for (let i = 0; i < agentsToUse.length; i++) {
      const agentKey = agentsToUse[i];
      this.currentAgent = agentKey;
      finalAgentType = agentKey;
      const agent = AGENTS[agentKey];
      const systemPrompt = this.buildSystemPrompt(context, agent);
      const currentStepId = `step-${i + 1}`;

      // Mark current step as active
      this.dispatch({ 
        type: 'UPDATE_WORKFLOW_STEP', 
        payload: { id: currentStepId, status: 'active' } 
      });

      this.conversationHistory.push({ role: "user", content: userMessage });

      try {
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `🔗 Connecting to AI for ${agent.name}...` });

        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `${agent.emoji} ${agent.name} processing...` });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...this.conversationHistory
          ],
          temperature: 0.3,
          max_tokens: 800
        });

        const aiResponse = completion.choices[0].message.content ?? "";
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `✅ ${agent.name} analysis complete` });

        // Mark current step as completed
        this.dispatch({ 
          type: 'UPDATE_WORKFLOW_STEP', 
          payload: { id: currentStepId, status: 'completed' } 
        });

        // Append response for final output
        finalResponse += aiResponse + '\n';

        // Parse report data if present
        const reportMatch = aiResponse.match(/\[REPORT_DATA\]([\s\S]*?)\[\/REPORT_DATA\]/);
        if (reportMatch) {
          try {
            finalReportData = JSON.parse(reportMatch[1].trim());
            this.dispatch({ type: 'ADD_THINKING_STEP', payload: '📄 Report data extracted' });
          } catch (e) {
            console.error('Failed to parse report data:', e);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        this.conversationHistory.push({ role: "assistant", content: aiResponse });

      } catch (error) {
        console.error('AI Error:', error);
        
        // Mark step as error
        this.dispatch({ 
          type: 'UPDATE_WORKFLOW_STEP', 
          payload: { id: currentStepId, status: 'error' } 
        });
        
        this.dispatch({ type: 'CLEAR_THINKING_STEPS' });
        return {
          response: "Sorry, I'm having trouble connecting right now. Please try again.",
          agentType: 'general',
          reportData: null
        };
      }
    }

    this.dispatch({ type: 'CLEAR_THINKING_STEPS' });
    return {
      response: finalResponse.trim() || "Sorry, I couldn't generate a response.",
      agentType: finalAgentType,
      reportData: finalReportData
    };
  }


  // Removed duplicate generateResponse function to fix TS error

  buildSystemPrompt(context: any, agent: AgentConfig) {
    const { selectedBu, selectedLob, userPrompt } = context;
    this.dispatch({ type: 'ADD_THINKING_STEP', payload: '📋 Building context...' });

    let dataContext = 'No data uploaded yet';
    let dataInsights = '';

    if (selectedLob?.hasData) {
      const dq = selectedLob.dataQuality;
      const wantsOutliers = /\b(outlier|anomal|quality\s*check)\b/i.test(userPrompt || '');
      dataContext = `
📊 YOUR DATA:
• ${selectedLob.recordCount} records
• Data quality: ${dq?.completeness >= 90 ? 'Excellent' : dq?.completeness >= 70 ? 'Good' : 'Needs improvement'} (${dq?.completeness}% complete)
• Trend: ${dq?.trend || 'Stable'}
• Pattern: ${dq?.seasonality?.replace(/_/g, ' ') || 'No clear pattern yet'}
${wantsOutliers ? `• Outliers: ${dq?.outliers || 0} potential anomalies` : ''}
`;

      this.dispatch({ type: 'ADD_THINKING_STEP', payload: '✓ Context loaded' });
    }

    return `${agent.systemPrompt}

🏢 BUSINESS INFO:
• Business Unit: ${selectedBu?.name || 'Not selected'}
• Line of Business: ${selectedLob?.name || 'Not selected'}

${dataContext}

💬 CUSTOMER ASKED:
"${userPrompt || ''}"

⚡ YOUR RESPONSE RULES:
1. Keep it SHORT - 3-5 bullet points max
2. Use SIMPLE language - pretend you're talking to your friend
3. Focus on ACTIONS they can take
4. Be SPECIFIC to their business (${selectedLob?.name || 'their data'})
5. End with "What would you like to do next?"
6. If unsure, ask a clarifying question. Do not fabricate details.
7. Only discuss outliers when the user asks about outliers, anomalies, or quality checks.
8. Use emojis to make it friendly 😊

Remember: You're ${agent.specialty} - use your expertise to help them succeed!`;
  }
}

let chatHandler: MultiAgentChatHandler | null = null;

// Helper function to extract outliers from EDA response
function extractOutliersFromResponse(responseText: string, data?: WeeklyData[]): OutlierData[] {
  const outliers: OutlierData[] = [];
  
  if (!data || data.length === 0) return outliers;
  
  // Look for outlier mentions in the response
  // Pattern 1: "X outliers found" or "X unusual values"
  const outlierCountMatch = responseText.match(/(\d+)\s+(?:outliers?|unusual values?)/i);
  
  if (outlierCountMatch) {
    const count = parseInt(outlierCountMatch[1]);
    
    // If outliers are mentioned, identify them from the data
    // Use statistical method: values beyond 2 standard deviations
    const values = data.map(d => d.Value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    data.forEach((point, index) => {
      const zScore = Math.abs((point.Value - mean) / stdDev);
      if (zScore > 2) {
        const severity: 'high' | 'medium' | 'low' = 
          zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
        
        outliers.push({
          index,
          value: point.Value,
          date: point.Date,
          reason: `Value is ${zScore.toFixed(1)} standard deviations ${point.Value > mean ? 'above' : 'below'} mean`,
          severity
        });
      }
    });
    
    // Limit to the count mentioned in response
    return outliers.slice(0, count);
  }
  
  return outliers;
}

// Helper function to extract forecast data from forecasting response
function extractForecastDataFromResponse(responseText: string, data?: WeeklyData[]): ForecastData[] {
  const forecastData: ForecastData[] = [];
  
  if (!data || data.length === 0) return forecastData;
  
  // Check if data already contains forecast information
  const dataWithForecast = data.filter(d => d.Forecast !== undefined);
  
  if (dataWithForecast.length > 0) {
    // Extract forecast data from the WeeklyData
    dataWithForecast.forEach(point => {
      if (point.Forecast !== undefined) {
        forecastData.push({
          date: point.Date,
          forecast: point.Forecast,
          lower: point.ForecastLower ?? point.Forecast * 0.9, // Default to 10% below if not available
          upper: point.ForecastUpper ?? point.Forecast * 1.1, // Default to 10% above if not available
          confidence: 0.95 // Default confidence level
        });
      }
    });
  } else {
    // Look for forecast period mention in response
    const forecastPeriodMatch = responseText.match(/(\d+)[-\s]?(?:day|week|month)/i);
    
    if (forecastPeriodMatch) {
      const period = parseInt(forecastPeriodMatch[1]);
      
      // Generate simple forecast based on trend (for demonstration)
      // In production, this would come from the backend
      const values = data.map(d => d.Value);
      const lastValue = values[values.length - 1];
      const avgGrowth = values.length > 1 
        ? (values[values.length - 1] - values[0]) / values.length 
        : 0;
      
      const lastDate = new Date(data[data.length - 1].Date);
      
      for (let i = 1; i <= Math.min(period, 30); i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i * 7); // Weekly forecast
        
        const forecastValue = lastValue + (avgGrowth * i);
        const margin = forecastValue * 0.1; // 10% confidence interval
        
        forecastData.push({
          date: forecastDate,
          forecast: forecastValue,
          lower: forecastValue - margin,
          upper: forecastValue + margin,
          confidence: 0.95
        });
      }
    }
  }
  
  return forecastData;
}

// Enhanced Chat Bubble Component
function ChatBubble({
  message,
  onSuggestionClick,
  onVisualizeClick,
  onViewInsightsClick,
  onGenerateReport,
  thinkingSteps
}: {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onVisualizeClick: (messageId: string) => void;
  onViewInsightsClick: (messageId: string) => void;
  onGenerateReport?: (messageId: string) => void;
  thinkingSteps: string[];
}) {
  const isUser = message.role === 'user';
  const agentInfo = message.agentType ? AGENTS[message.agentType as keyof typeof AGENTS] : null;

  return (
    <div className={cn('flex items-start gap-3 w-full', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {agentInfo?.emoji || <Bot />}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-prose", isUser ? "order-1" : "")}>
        {/* Agent Badge */}
        {!isUser && agentInfo && agentInfo.name !== 'General Assistant' && (
          <div className="mb-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="font-medium">{agentInfo.name}</span>
            <span className="opacity-60">• {agentInfo.specialty}</span>
          </div>
        )}
        
        <div className={cn(
          'max-w-prose rounded-lg p-3 text-sm prose prose-sm prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0 prose-headings:my-2 prose-strong:text-current',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {message.isTyping ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span 
                    key={i}
                    className="h-2 w-2 animate-pulse rounded-full bg-current" 
                    style={{ animationDelay: `${delay}s` }} 
                  />
                ))}
              </div>
              
              {/* ENHANCED THINKING STEPS */}
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
            <div dangerouslySetInnerHTML={{ 
              __html: message.content
                .replace(/\[WORKFLOW_PLAN\][\s\S]*?\[\/WORKFLOW_PLAN\]/, '')
                .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br />') 
            }} />
          )}
        </div>
        
        {message.visualization?.isShowing && message.visualization.data && (
          <div className="mt-2">
            <DataVisualizer 
              data={message.visualization.data} 
              target={message.visualization.target as 'Value' | 'Orders'}
              isRealData={true}
              showOutliers={message.visualization.showOutliers}
            />
          </div>
        )}
        
        {/* Suggested actions below each response */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 bg-muted/10 dark:bg-muted-dark/10 p-2 rounded">
            <div className="text-sm font-medium mb-1 text-muted-foreground">Suggested Actions:</div>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* Other utilities */}
        {(message.visualization && !message.visualization.isShowing) && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onVisualizeClick(message.id)}>
              <BarChart className="mr-2 h-4 w-4 text-foreground" />
              {message.visualization.data.some((d: any) => d.Forecast !== undefined)
                ? 'Visualize Actual & Forecast'
                : message.visualization.showOutliers
                ? 'Visualize Data with Outliers'
                : 'Visualize Data'}
            </Button>
            {message.visualization.data.some((d: any) => d.Forecast !== undefined) && (
              <Button size="sm" variant="outline" onClick={() => onViewInsightsClick(message.id)}>
                View Insights
              </Button>
            )}
          </div>
        )}
        {message.canGenerateReport && onGenerateReport && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="default" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" onClick={() => onGenerateReport(message.id)}>
              <FileText className="mr-2 h-4 w-4 text-foreground" />
              Generate Report
            </Button>
          </div>
        )}
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback><User /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// Main ChatPanel Component
export default function ChatPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat handler
  if (!chatHandler) {
    chatHandler = new MultiAgentChatHandler(dispatch);
  }
  
  // Auto-scroll to bottom
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
    }
  }, [state.messages]);

  // Handle queued prompts on mount
  useEffect(() => {
    if (state.queuedUserPrompt && !state.isProcessing) {
      submitMessage(state.queuedUserPrompt);
      dispatch({ type: 'CLEAR_QUEUED_PROMPT' });
    }
  }, [state.queuedUserPrompt]);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (state.selectedLob) {
      dispatch({ type: 'UPLOAD_DATA', payload: { lobId: state.selectedLob.id, file } });
    } else {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Please select a Line of Business before uploading data.',
          agentType: 'general'
        }
      });
    }
  };

  // Submit message handler
  const submitMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Prevent duplicate submissions
    if (state.isProcessing) {
      console.warn('Request already in progress, ignoring duplicate submission');
      return;
    }
    
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'CLEAR_THINKING_STEPS' });

    // Add user message
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
      }
    });

    // Add typing indicator
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        isTyping: true,
      }
    });

    try {
      const { response: responseText, agentType, reportData } = await chatHandler!.generateResponse(messageText, {
        selectedBu: state.selectedBu,
        selectedLob: state.selectedLob,
        businessUnits: state.businessUnits,
        userPrompt: messageText,
      });

      // Parse workflow plan
      const workflowMatch = responseText.match(/\[WORKFLOW_PLAN\]([\s\S]*?)\[\/WORKFLOW_PLAN\]/);
      if (workflowMatch?.[1]) {
        try {
          const planJson = JSON.parse(workflowMatch[1]);
          const workflow: WorkflowStep[] = planJson.map((step: any, i: number) => ({
            ...step,
            id: `step-${i + 1}`,
            status: 'pending',
            dependencies: i > 0 ? [`step-${i}`] : [],
            agent: agentType
          }));
          dispatch({ type: 'SET_WORKFLOW', payload: workflow });
        } catch(e) {
          console.error("Failed to parse workflow:", e);
        }
      }
      
      dispatch({ type: 'SET_PROCESSING', payload: false });

      // Parse suggestions
      // Remove 's' flag to avoid ES2018+ requirement
      const suggestionMatch = responseText.match(/\*\*(?:What's next\?|Next Steps?:?)\*\*([\s\S]*)/);
      let content = responseText;
      let suggestions: string[] = [];

      if (suggestionMatch?.[1]) {
        content = responseText.replace(/\*\*(?:What's next\?|Next Steps?:?)\*\*([\s\S]*)/i, '').trim();
        suggestions = suggestionMatch[1]
          .split(/[\n•-]/)
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(s => s.length > 5 && s.length < 100)
          .slice(0, 3);
      }

      // Fallback: always provide actionable next steps if none parsed
      if (suggestions.length === 0) {
        // Onboarding/first prompt: show clear, beginner-friendly actions
        if (!state.selectedLob) {
          suggestions = [
            "Upload your sales data",
            "Show me a sample analysis",
            "What can I do with this app?",
            "How do I generate a forecast?",
            "Explore my data"
          ];
        } else if (agentType === 'eda') {
          suggestions = [
            "Explore your data (EDA)",
            "Generate a forecast for the next 30 days",
            "Download a summary report"
          ];
        } else if (agentType === 'forecasting') {
          suggestions = [
            "See forecast results",
            "Download forecast report",
            "Try a different forecast period"
          ];
        } else if (agentType === 'evaluation') {
          suggestions = [
            "Compare model performance",
            "Download evaluation report"
          ];
        } else {
          suggestions = [
            "Upload your data",
            "Explore your data",
            "Generate a forecast",
            "Download a report"
          ];
        }
      }
      
      // Auto-detect visualization needs
      const shouldVisualize = state.selectedLob?.hasData && state.selectedLob?.timeSeriesData &&
        (/(visuali[sz]e|chart|plot|graph|trend|distribution)/i.test(messageText + content) ||
         (agentType === 'eda' && /pattern|trend|seasonality/i.test(content)));

      let visualization: { data: WeeklyData[]; target: "Value" | "Orders"; isShowing: boolean; showOutliers?: boolean } | undefined;
      if (shouldVisualize) {
        const isRevenue = /(revenue|sales|amount|gmv|income)/i.test(messageText + content);
        const wantsOutliers = /(outlier|anomal|quality\s*check)/i.test(messageText);
        visualization = {
          data: state.selectedLob!.timeSeriesData!,
          target: isRevenue ? 'Value' : 'Orders',
          isShowing: false,
          showOutliers: wantsOutliers
        };
      }

      // Track analysis completion and extract data
      if (agentType === 'eda') {
        // Extract outliers from EDA response
        const outliers = extractOutliersFromResponse(responseText, state.selectedLob?.timeSeriesData);
        dispatch({ 
          type: 'SET_ANALYZED_DATA', 
          payload: { 
            hasEDA: true, 
            lastAnalysisType: 'eda',
            outliers: outliers
          } 
        });
      } else if (agentType === 'forecasting') {
        // Extract forecast data from forecasting response
        const forecastData = extractForecastDataFromResponse(responseText, state.selectedLob?.timeSeriesData);
        dispatch({ 
          type: 'SET_ANALYZED_DATA', 
          payload: { 
            hasForecasting: true, 
            lastAnalysisType: 'forecasting',
            forecastData: forecastData
          } 
        });
      } else if (agentType === 'comparative' || agentType === 'whatif') {
        dispatch({ type: 'SET_ANALYZED_DATA', payload: { hasInsights: true, lastAnalysisType: agentType } });
      }

      // Update message
      dispatch({ 
        type: 'UPDATE_LAST_MESSAGE', 
        payload: {
          content,
          suggestions,
          isTyping: false,
          visualization,
          agentType,
          canGenerateReport: !!reportData,
          reportData
        }
      });

    } catch (error) {
      console.error("AI Error:", error);
      dispatch({ 
        type: 'UPDATE_LAST_MESSAGE', 
        payload: {
          content: "Sorry, I'm having trouble right now. Please try again.",
          isTyping: false,
          agentType: 'general'
        }
      });
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  // Form submit handler
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userInput = formData.get('message') as string;
    e.currentTarget.reset();
    submitMessage(userInput);
  };

  // Suggestion click handler
  const handleSuggestionClick = (suggestion: string) => {
    submitMessage(suggestion);
  };
  
  // Visualize click handler
  const handleVisualizeClick = (messageId: string) => {
    // Only toggle inline visualization; do not auto-open insights panel
    dispatch({ type: 'TOGGLE_VISUALIZATION', payload: { messageId } });
  };

  const handleViewInsightsClick = (messageId: string) => {
    const msg = state.messages.find(m => m.id === messageId);
    const target = msg?.visualization?.target === 'Orders' ? 'units' : 'revenue';
    dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: target });
    dispatch({ type: 'SET_DATA_PANEL_MODE', payload: 'chart' });
    dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: true });
  };

  // Generate report handler
  const handleGenerateReport = (messageId: string) => {
    const msg = state.messages.find(m => m.id === messageId);
    if (msg?.reportData && msg.agentType) {
      dispatch({ 
        type: 'GENERATE_REPORT', 
        payload: {
          messageId,
          reportData: msg.reportData,
          agentType: msg.agentType,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const isAssistantTyping = state.isProcessing || state.messages[state.messages.length - 1]?.isTyping;

  return (
    <>
      <Card className={cn('flex flex-col h-full border-0 shadow-none rounded-none', className)}>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {state.messages.map(message => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onSuggestionClick={handleSuggestionClick}
                    onVisualizeClick={() => handleVisualizeClick(message.id)}
                    onViewInsightsClick={() => handleViewInsightsClick(message.id)}
                    onGenerateReport={handleGenerateReport}
                    thinkingSteps={state.thinkingSteps}
                  />
                ))}
              </div>
            </ScrollArea>
            
            <div className="border-t p-4 bg-card">
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Textarea
                    className="h-24 resize-none flex-1"
                    name="message"
                    placeholder="Ask about EDA, forecasts, what-if scenarios, comparisons..."
                    autoComplete="off"
                    disabled={isAssistantTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        if (form) {
                          const formData = new FormData(form);
                          const userInput = formData.get('message') as string;
                          if (userInput.trim()) {
                            form.reset();
                            submitMessage(userInput);
                          }
                        }
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={isAssistantTyping}>
                    <Send className="h-5 w-5 text-foreground" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload data"
                  >
                    <Paperclip className="h-5 w-5 text-foreground" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    onClick={() => dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: true })}
                    title="Open data preview"
                  >
                    <BarChart className="h-5 w-5 text-foreground" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog 
        open={state.agentMonitor.isOpen} 
        onOpenChange={(isOpen) => dispatch({ type: 'SET_AGENT_MONITOR_OPEN', payload: isOpen })}
      >
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Agent Activity Monitor</DialogTitle>
          </DialogHeader>
          <AgentMonitorPanel className="flex-1 min-h-0" />
        </DialogContent>
      </Dialog>
    </>
  );
}
