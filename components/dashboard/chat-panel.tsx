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
import { useApp } from "@/components/dashboard/app-provider";
import type { ChatMessage, WeeklyData, WorkflowStep } from '@/lib/types';
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

// NOTE: This file contains legacy code. Use enhanced-chat-panel.tsx instead
// which properly uses the enhancedAPIClient with user-configured API keys

import OpenAI from "openai";

// Legacy OpenAI client - should not be used in production
// Use enhancedAPIClient from @/lib/enhanced-api-client instead
const openai = new OpenAI({
  apiKey: "", // API key should be configured by user via settings
  dangerouslyAllowBrowser: true,
});

export const AGENTS: Record<string, AgentConfig> = {
    eda: {
      name: "EDA Agent",
      emoji: "🔬",
      specialty: "Exploratory Data Analysis",
      keywords: ['explore', 'eda', 'analyze', 'distribution', 'pattern', 'correlation', 'outlier', 'statistics', 'summary', 'data quality'],
      systemPrompt: `You are an EDA specialist focused on data exploration and pattern discovery.

INSTRUCTIONS FOR CUSTOMER-FRIENDLY RESPONSES:
- Use simple, clear language for users with no prior knowledge.
- Provide key statistical information and highlights as concise bullet points.
- Avoid long paragraphs and technical jargon.
- Focus on actionable insights the user can understand.
- Include data quality metrics, trends, seasonality, and outliers clearly.
- Suggest next steps in simple, direct terms.

REPORT GENERATION:
When analysis is complete, include a structured report section:
[REPORT_DATA]
{
  "title": "EDA Report: [Topic]",
  "insights": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "metrics": [{"name": "Metric Name", "value": "Value with unit"}],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"]
}
[/REPORT_DATA]

Focus on actionable insights. Adapt response length to analysis complexity.`
    },
  
    forecasting: {
      name: "Forecasting Agent",
      emoji: "📈",
      specialty: "Predictive Analytics",
      keywords: ['forecast', 'predict', 'future', 'projection', 'trend', 'time series', 'arima', 'prophet', 'prediction'],
      systemPrompt: `You are a forecasting specialist focused on predictive analytics.

INSTRUCTIONS FOR CUSTOMER-FRIENDLY RESPONSES:
- Use simple, clear language for users with no prior knowledge.
- Provide key forecast numbers and highlights as concise bullet points.
- Avoid long paragraphs and technical jargon.
- Focus on actionable insights the user can understand.
- Include trend, seasonality, accuracy metrics, and confidence intervals clearly.
- Suggest next steps in simple, direct terms.

REPORT GENERATION:
Include structured forecast report:
[REPORT_DATA]
{
  "title": "Forecast Report: [Period]",
  "insights": ["Forecast insight 1", "Trend analysis", "Seasonality impact"],
  "metrics": [{"name": "Forecasted Value", "value": "Number ± confidence"}],
  "recommendations": ["Recommended action", "Risk mitigation strategy"]
}
[/REPORT_DATA]

Be precise with numbers. Provide meaningful context for predictions.`
    },
  
    whatif: {
      name: "What-If Agent",
      emoji: "🎯",
      specialty: "Scenario Analysis",
      keywords: ['what if', 'scenario', 'simulate', 'impact', 'sensitivity', 'assumption', 'compare scenarios', 'outcome'],
      systemPrompt: `You are a scenario analysis specialist focused on what-if modeling.

INSTRUCTIONS FOR CUSTOMER-FRIENDLY RESPONSES:
- Use simple, clear language for users with no prior knowledge.
- Provide key scenario outcomes and impacts as concise bullet points.
- Avoid long paragraphs and technical jargon.
- Focus on actionable insights the user can understand.
- Include scenario comparisons, impact percentages, and key assumptions clearly.
- Suggest next steps in simple, direct terms.

REPORT GENERATION:
Include scenario comparison report:
[REPORT_DATA]
{
  "title": "Scenario Analysis: [Topic]",
  "insights": ["Scenario outcome 1", "Impact assessment 2", "Trade-off analysis"],
  "metrics": [{"name": "Baseline", "value": "X"}, {"name": "Scenario A", "value": "Y (+Z%)"}],
  "recommendations": ["Best scenario justification", "Risk considerations"]
}
[/REPORT_DATA]

Show clear cause-effect relationships. Quantify impacts where possible.`
    },
  
    comparative: {
      name: "Comparative Agent",
      emoji: "⚖️",
      specialty: "Benchmarking",
      keywords: ['compare', 'comparison', 'benchmark', 'versus', 'vs', 'difference', 'performance gap', 'relative'],
      systemPrompt: `You are a comparative analysis specialist focused on benchmarking.

INSTRUCTIONS FOR CUSTOMER-FRIENDLY RESPONSES:
- Use simple, clear language for users with no prior knowledge.
- Provide key comparison results and insights as concise bullet points.
- Avoid long paragraphs and technical jargon.
- Focus on actionable insights the user can understand.
- Include performance rankings, gap quantification, and best practices clearly.
- Suggest next steps in simple, direct terms.

REPORT GENERATION:
Include comparative analysis report:
[REPORT_DATA]
{
  "title": "Comparative Analysis: [Entities]",
  "insights": ["Performance ranking", "Significant gap identification", "Best practice insight"],
  "metrics": [{"name": "Entity A", "value": "Score"}, {"name": "Entity B", "value": "Score"}],
  "recommendations": ["Best practice to adopt", "Gap closure strategy"]
}
[/REPORT_DATA]

Use tables for multi-entity comparisons. Highlight significant differences.`
    },
  
    general: {
      name: "General Assistant",
      emoji: "🤖",
      specialty: "General BI Support",
      keywords: [],
      systemPrompt: `You are a business intelligence assistant providing general support.

INSTRUCTIONS FOR CUSTOMER-FRIENDLY RESPONSES:
- Use simple, clear language for users with no prior knowledge.
- Provide brief, direct answers with actionable insights.
- Avoid unnecessary filler or pleasantries.
- For complex questions, provide structured, concise analysis.
- Focus on what the user actually needs.

Focus on the user's actual need. Be helpful, precise, and valuable.`
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

    // Define sequential workflow for forecasting
    const forecastingWorkflow = ['eda', 'forecasting'];

    // Check if message matches forecasting keywords
    if (/(forecast|predict|train|process|clean)/i.test(lowerMessage)) {
      this.dispatch({
        type: 'ADD_THINKING_STEP',
        payload: '🔄 Dynamic workflow for forecasting triggered'
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
  
  async generateResponse(userMessage: string, context: any) {
    this.dispatch({ type: 'ADD_THINKING_STEP', payload: '🔍 Analyzing request...' });

    // Select appropriate agents (could be multiple for sequential workflow)
    const agentsToUse = this.selectAgent(userMessage, context);
    let finalResponse = '';
    let finalReportData = null;
    let finalAgentType = 'general';

    for (const agentKey of agentsToUse) {
      this.currentAgent = agentKey;
      finalAgentType = agentKey;
      const agent = AGENTS[agentKey];
      const systemPrompt = this.buildSystemPrompt(context, agent);

      this.conversationHistory.push({ role: "user", content: userMessage });

      try {
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `🔗 Connecting to AI for ${agent.name}...` });

        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `${agent.emoji} ${agent.name} processing...` });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // GPT-4.1 as requested
          messages: [
            { role: "system", content: systemPrompt + "\n\nPlease respond concisely with bullet points, numbers, and statistical explanations. Avoid verbose explanations." },
            ...this.conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 800
        });

        const aiResponse = completion.choices[0].message.content ?? "";
        this.dispatch({ type: 'ADD_THINKING_STEP', payload: `✅ ${agent.name} analysis complete` });

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

        // Parse workflow plan for dynamic steps
        const workflowMatch = aiResponse.match(/\[WORKFLOW_PLAN\](.*?)\[\/WORKFLOW_PLAN\]/s);
        if (workflowMatch) {
          try {
            const planJson = JSON.parse(workflowMatch[1]);
            const workflow = planJson.map((step: any, i: number) => ({
              ...step,
              id: `step-${i + 1}`,
              status: 'pending',
              dependencies: i > 0 ? [`step-${i}`] : [],
              agent: agentKey
            }));
            this.dispatch({ type: 'SET_WORKFLOW', payload: workflow });
          } catch (e) {
            console.error("Failed to parse workflow:", e);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        this.conversationHistory.push({ role: "assistant", content: aiResponse });

      } catch (error) {
        console.error('OpenRouter Error:', error);
        this.dispatch({ type: 'CLEAR_THINKING_STEPS' });
        return {
          response: "Sorry, I'm having trouble connecting right now. Please try again.",
          agentType: 'general',
          reportData: null
        }
  // };
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

    let dataContext = 'No data available';
    let dataInsights = '';

    if (selectedLob?.hasData) {
      const dq = selectedLob.dataQuality;
      dataContext = `
DATA SUMMARY:
- Records: ${selectedLob.recordCount}
- Completeness: ${dq?.completeness}%
- Trend: ${dq?.trend || 'stable'}
- Seasonality: ${dq?.seasonality?.replace(/_/g, ' ') || 'unknown'}
- Outliers: ${dq?.outliers || 0} detected
`;

      // Provide data insights for EDA agent
      if (agent.name === 'EDA Agent') {
        dataInsights = `
DETECTED PATTERNS:
- Data quality: ${dq?.completeness >= 90 ? 'High' : dq?.completeness >= 70 ? 'Medium' : 'Low'}
- Consider temporal coverage and variability
`;
      }

      this.dispatch({ type: 'ADD_THINKING_STEP', payload: '✓ Context loaded' });
    }

    // Optimized system prompt for specific, balanced, LOB-aware, non-generic responses
    return `
${agent.systemPrompt}

BUSINESS CONTEXT:
- Business Unit: ${selectedBu?.name || 'None selected'}
- Line of Business: ${selectedLob?.name || 'None selected'}
${dataContext}
${dataInsights}

USER PROMPT:
"${userPrompt || ''}"

RESPONSE RULES:
1. Your response must be specific to the selected Line of Business and the user's prompt. Do NOT provide generic or irrelevant information.
2. Do NOT answer for other BUs/LOBs or provide general advice.
3. The response should be concise, balanced, and directly address the user's request—avoid excessive detail or being too brief.
4. If the user prompt is ambiguous, ask a clarifying question.
5. After your main response, output a list of all possible next actions the user can take, based on the current context and workflow, in the following format:

**What can you do next?**
- [Action 1]
- [Action 2]
- [Action 3]
(Include all relevant options: Upload Data, Run EDA, Train Model, Generate Forecast, Download Report, etc.)

6. For workflow requests, use format: [WORKFLOW_PLAN][{steps}][/WORKFLOW_PLAN]

Your specialty: ${agent.specialty}
Leverage your expertise to provide deep, meaningful, and context-aware insights.
`;
  }
}

let chatHandler: MultiAgentChatHandler | null = null;

// Enhanced Chat Bubble Component
function ChatBubble({ 
  message, 
  onSuggestionClick, 
  onVisualizeClick,
  onGenerateReport,
  thinkingSteps 
}: { 
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onVisualizeClick: (messageId: string) => void;
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
              Visualize Data
            </Button>
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

  // Handle queued prompts
  useEffect(() => {
    if (state.queuedUserPrompt) {
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
      const shouldVisualize = state.selectedLob?.hasData && state.selectedLob?.mockData && 
        (/(visuali[sz]e|chart|plot|graph|trend|distribution)/i.test(messageText + content) ||
         (agentType === 'eda' && /pattern|trend|seasonality/i.test(content)));

      let visualization: { data: WeeklyData[]; target: "Value" | "Orders"; isShowing: boolean } | undefined;
      if (shouldVisualize) {
        const isRevenue = /(revenue|sales|amount|gmv|income)/i.test(messageText + content);
        visualization = {
          data: state.selectedLob!.mockData!,
          target: isRevenue ? 'Value' : 'Orders',
          isShowing: false,
        };
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
    const msg = state.messages.find(m => m.id === messageId);
    // Map target to expected values to fix type error
    const target = msg?.visualization?.target === "Orders" ? "Orders" : "Value";
    dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: target });
    dispatch({ type: 'SET_DATA_PANEL_MODE', payload: 'chart' });
    dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: true });
    dispatch({ type: 'TOGGLE_VISUALIZATION', payload: { messageId } });
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
