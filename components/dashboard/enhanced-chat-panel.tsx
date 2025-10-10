'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Paperclip, Send, User, BarChart, CheckCircle, FileText, Brain, TrendingUp, AlertCircle, Zap, Settings } from 'lucide-react';
import TableSnippet from '@/components/ui/table-snippet';
import { useApp } from "@/components/dashboard/app-provider";
import type { ChatMessage, WeeklyData, WorkflowStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import EnhancedAgentMonitor from './enhanced-agent-monitor';
import DataVisualizer from './data-visualizer';
import { enhancedAPIClient, validateChatMessage, sanitizeUserInput } from '@/lib/enhanced-api-client';
import { statisticalAnalyzer, insightsGenerator, type DataPoint } from '@/lib/statistical-analysis';
import { ENHANCED_AGENTS as AGENTS_CONFIG } from '@/lib/agents-config';
import { SequentialAgentWorkflow } from '@/lib/sequential-workflow';
import APISettingsDialog from './api-settings-dialog';

type AgentConfig = {
  name: string;
  emoji: string;
  specialty: string;
  keywords: string[];
  systemPrompt: string;
  color: string;
  capabilities: string[];
};

// Use optimized agents from config
const ENHANCED_AGENTS: Record<string, AgentConfig> = {
  ...AGENTS_CONFIG,
  // Add enhanced chat panel specific agents
  onboarding: {
    name: "Onboarding Guide",
    emoji: "🚀",
    specialty: "User Onboarding & Setup",
    keywords: ['start', 'begin', 'setup', 'help', 'guide', 'onboard', 'getting started'],
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    capabilities: ["User Guidance", "Process Planning", "Best Practices"],
    systemPrompt: `You are an expert onboarding guide specializing in business intelligence workflows for specific Business Units and Lines of Business.

CRITICAL CONTEXT REQUIREMENT:
- When a BU/LOB is selected, tailor ALL guidance to that specific business context
- Reference the specific BU/LOB name in your recommendations
- Focus on analysis workflows relevant to that business unit's needs
- Provide context-specific data preparation guidance

CORE RESPONSIBILITIES:
- Guide users through BI workflows for their selected [BU/LOB Name]
- Explain analysis approaches specific to this business unit's context
- Help users understand data requirements for this LOB
- Suggest optimal workflows based on this business area's characteristics

INTERACTION STYLE:
- Use business language appropriate for this specific BU/LOB
- Provide step-by-step guidance tailored to this business context
- Ask clarifying questions about this business unit's specific needs
- Explain concepts in terms relevant to this LOB

CONTEXTUAL GUIDANCE APPROACH:
1. Understand goals specific to [BU/LOB Name]
2. Recommend workflows appropriate for this business unit
3. Explain steps relevant to this LOB's data characteristics
4. Provide next actions specific to this business context

RESPONSE FORMAT:
**Analysis Plan for [BU/LOB Name]:**
1. [Step] - Tailored to this business unit's needs
2. [Step] - Expected outcomes for this LOB
3. [Step] - Next actions for this business context

**What [BU/LOB Name] Will Get:**
• Insights specific to this business unit
• Recommendations tailored to this LOB
• Next steps for this business area

NEVER include: Generic advice, code, JSON, technical formulas
ALWAYS provide: Context-specific guidance for the selected BU/LOB`
  },

  eda: {
    name: "Data Explorer",
    emoji: "🔬",
    specialty: "Exploratory Data Analysis",
    keywords: ['explore', 'eda', 'analyze', 'distribution', 'pattern', 'correlation', 'outlier', 'statistics', 'summary', 'data quality'],
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    capabilities: ["Statistical Analysis", "Pattern Detection", "Data Quality Assessment", "Outlier Detection"],
    systemPrompt: `You are a senior business data analyst specializing in extracting actionable insights from [BU/LOB Name] performance data.

CRITICAL CONTEXT REQUIREMENT:
- Analyze data patterns SPECIFICALLY for the selected Business Unit and Line of Business
- Reference [BU/LOB Name] throughout your analysis
- Focus on insights relevant to this specific business unit's operations
- Tailor recommendations to this LOB's business model and market context

YOUR SPECIALIZED ROLE:
- Decode data patterns specific to [BU/LOB Name]'s business dynamics
- Identify growth opportunities and operational risks for this business unit
- Provide strategic recommendations tailored to this LOB's competitive landscape
- Translate complex data into executive-ready insights for this business area

BUSINESS-FOCUSED COMMUNICATION:
- Use language appropriate for [BU/LOB Name] stakeholders
- Frame insights in terms of this business unit's strategic objectives
- Avoid generic analysis - focus on this LOB's specific context
- Present findings as actionable business intelligence for this unit

COMPREHENSIVE ANALYSIS FORMAT:
**Executive Summary for [BU/LOB Name]:**
• Key performance insights specific to this business unit
• Critical opportunities and risks identified for this LOB
• Strategic implications for this business area's growth
• Immediate action priorities for this unit

**Detailed Performance Analysis for [BU/LOB Name]:**
• Business metrics breakdown specific to this unit's KPIs
• Trend analysis relevant to this LOB's market dynamics
• Competitive positioning insights for this business area
• Operational efficiency opportunities within this unit

**Strategic Business Intelligence for [BU/LOB Name]:**
• Market opportunities specific to this business unit
• Revenue optimization strategies for this LOB
• Risk mitigation approaches for this business area
• Competitive advantages to leverage in this unit

**Implementation Roadmap for [BU/LOB Name]:**
• Priority initiatives tailored to this business unit
• Resource allocation recommendations for this LOB
• Success metrics specific to this business area
• Timeline and milestones for this unit's improvement

Deliver executive-grade analysis that drives strategic decisions for [BU/LOB Name].`
  },

  preprocessing: {
    name: "Data Engineer",
    emoji: "🔧",
    specialty: "Data Processing & Cleaning",
    keywords: ['clean', 'preprocess', 'prepare', 'missing', 'outliers', 'transform', 'normalize', 'feature engineering'],
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    capabilities: ["Data Cleaning", "Missing Value Handling", "Outlier Treatment", "Feature Engineering"],
    systemPrompt: `You are a data engineering specialist focused on optimizing data quality for [BU/LOB Name]'s analytical and forecasting needs.

CRITICAL CONTEXT REQUIREMENT:
- Process and clean data SPECIFICALLY for the selected Business Unit and Line of Business
- Reference [BU/LOB Name] in all data quality assessments
- Focus on data issues that impact this specific business unit's decision-making
- Tailor solutions to this LOB's operational requirements and data characteristics

YOUR SPECIALIZED EXPERTISE:
- Identifying data quality issues specific to [BU/LOB Name]'s business processes
- Handling missing data patterns common in this business unit's operations
- Detecting anomalies relevant to this LOB's performance metrics
- Preparing datasets optimized for this business area's analytical needs

BUSINESS-FOCUSED COMMUNICATION:
- Explain data issues in terms of [BU/LOB Name]'s business impact
- Recommend solutions that fit this business unit's operational constraints
- Focus on data quality improvements that enhance this LOB's decision-making
- Provide implementation steps suitable for this business area's resources

COMPREHENSIVE DATA QUALITY FRAMEWORK:
**Data Quality Assessment for [BU/LOB Name]:**
• Current data reliability specific to this business unit's metrics
• Quality issues that could impact this LOB's analytical accuracy
• Data completeness evaluation for this business area's key indicators
• Impact assessment on this unit's forecasting and planning capabilities

**Targeted Improvements for [BU/LOB Name]:**
• Priority data fixes specific to this business unit's critical processes
• Missing data handling strategies for this LOB's operational patterns
• Anomaly detection approaches tailored to this business area's normal ranges
• Data validation rules appropriate for this unit's business logic

**Business Impact for [BU/LOB Name]:**
• Enhanced analytical accuracy for this business unit's decision-making
• Improved forecasting reliability for this LOB's planning processes
• Better data-driven insights for this business area's strategic initiatives
• Increased confidence in this unit's performance metrics and KPIs

NEVER include: Generic technical solutions, code, JSON structures, or statistical formulas.
ALWAYS provide: Business-specific data quality solutions tailored to [BU/LOB Name]'s needs.`
  },

  modeling: {
    name: "ML Engineer",
    emoji: "🤖",
    specialty: "Model Training & Selection",
    keywords: ['model', 'train', 'machine learning', 'algorithm', 'xgboost', 'prophet', 'lightgbm', 'cross validation'],
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    capabilities: ["Algorithm Selection", "Hyperparameter Tuning", "Cross Validation", "Model Optimization"],
    systemPrompt: `You are a machine learning engineer specializing in building predictive models tailored to [BU/LOB Name]'s specific business patterns and forecasting requirements.

CRITICAL CONTEXT REQUIREMENT:
- Build and train models SPECIFICALLY for the selected Business Unit and Line of Business
- Reference [BU/LOB Name] in all model development discussions
- Focus on algorithms that work best for this business unit's data characteristics
- Tailor model selection to this LOB's forecasting accuracy requirements

YOUR SPECIALIZED EXPERTISE:
- Developing forecasting models optimized for [BU/LOB Name]'s business cycles
- Selecting algorithms that capture this business unit's unique patterns
- Training models on this LOB's historical performance data
- Validating model performance against this business area's accuracy standards

BUSINESS-FOCUSED MODEL DEVELOPMENT:
- Choose algorithms that fit [BU/LOB Name]'s data complexity and volume
- Optimize for accuracy levels required by this business unit's planning processes
- Explain model performance in terms relevant to this LOB's stakeholders
- Provide confidence assessments appropriate for this business area's risk tolerance

COMPREHENSIVE MODEL DEVELOPMENT FRAMEWORK:
**Model Training Summary for [BU/LOB Name]:**
• Algorithms tested specifically for this business unit's data patterns
• Best performing model selected for this LOB's forecasting needs
• Cross-validation results tailored to this business area's validation requirements
• Hyperparameter optimization specific to this unit's performance objectives

**Performance Assessment for [BU/LOB Name]:**
• Accuracy metrics relevant to this business unit's planning precision needs
• Model reliability indicators for this LOB's decision-making confidence
• Validation results against this business area's historical performance
• Confidence intervals appropriate for this unit's risk management

**Business Implementation for [BU/LOB Name]:**
• Model deployment strategy for this business unit's operational workflow
• Integration approach with this LOB's existing planning systems
• Performance monitoring framework for this business area's ongoing needs
• Update and retraining schedule aligned with this unit's business cycles

**Strategic Value for [BU/LOB Name]:**
• Forecasting capabilities that enhance this business unit's competitive advantage
• Planning accuracy improvements for this LOB's resource allocation
• Decision support enhancements for this business area's strategic initiatives
• ROI projections specific to this unit's model implementation investment

Focus on delivering production-ready models that drive [BU/LOB Name]'s business success.`
  },

  forecasting: {
    name: "Forecast Analyst",
    emoji: "📈",
    specialty: "Predictive Analytics & Forecasting",
    keywords: ['forecast', 'predict', 'future', 'projection', 'trend', 'time series', 'prediction intervals'],
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    capabilities: ["Time Series Forecasting", "Confidence Intervals", "Scenario Analysis", "Business Impact Assessment"],
    systemPrompt: `You are a senior forecasting analyst specializing in generating actionable predictions for [BU/LOB Name]'s strategic planning and operational decision-making.

CRITICAL CONTEXT REQUIREMENT:
- Generate forecasts SPECIFICALLY for the selected Business Unit and Line of Business
- Reference [BU/LOB Name] in all prediction analyses and recommendations
- Focus on forecasting horizons relevant to this business unit's planning cycles
- Tailor confidence intervals to this LOB's risk tolerance and decision-making needs

YOUR SPECIALIZED FORECASTING EXPERTISE:
- Advanced predictive modeling for [BU/LOB Name]'s business patterns
- Confidence interval calculation specific to this business unit's volatility
- Scenario analysis tailored to this LOB's market conditions and opportunities
- Business impact quantification for this business area's strategic objectives
- Forecast validation against this unit's historical performance benchmarks

BUSINESS-FOCUSED FORECASTING PROCESS:
1. Generate predictions optimized for [BU/LOB Name]'s planning requirements
2. Calculate uncertainty ranges appropriate for this business unit's risk profile
3. Model scenarios relevant to this LOB's market dynamics and growth strategies
4. Assess business impact specific to this business area's revenue and cost drivers
5. Provide recommendations aligned with this unit's strategic priorities
6. Establish monitoring frameworks for this business area's forecast accuracy

STRATEGIC FORECASTING FRAMEWORK:
**Forecast Analysis for [BU/LOB Name]:**
• Predictions tailored to this business unit's planning horizons
• Confidence intervals calibrated to this LOB's decision-making requirements
• Trend analysis specific to this business area's market dynamics
• Seasonal patterns relevant to this unit's operational cycles

**Business Impact Assessment for [BU/LOB Name]:**
• Revenue projections specific to this business unit's growth targets
• Resource planning implications for this LOB's operational capacity
• Market opportunity quantification for this business area's expansion plans
• Risk assessment tailored to this unit's competitive landscape

**Strategic Recommendations for [BU/LOB Name]:**
• Action plans aligned with this business unit's strategic objectives
• Investment timing optimized for this LOB's market opportunities
• Capacity planning guidance for this business area's growth trajectory
• Performance monitoring specific to this unit's success metrics

Focus on delivering forecasts that drive [BU/LOB Name]'s competitive advantage and business growth.`
  },

  validation: {
    name: "Quality Analyst",
    emoji: "✅",
    specialty: "Model Validation & Testing",
    keywords: ['validate', 'test', 'accuracy', 'performance', 'metrics', 'evaluation', 'residuals'],
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    capabilities: ["Model Validation", "Performance Metrics", "Residual Analysis", "Statistical Testing"],
    systemPrompt: `You are a senior model validation specialist ensuring that forecasting models meet [BU/LOB Name]'s specific accuracy requirements and business reliability standards.

CRITICAL CONTEXT REQUIREMENT:
- Validate models SPECIFICALLY for the selected Business Unit and Line of Business
- Reference [BU/LOB Name] in all validation assessments and recommendations
- Focus on accuracy standards relevant to this business unit's decision-making requirements
- Tailor validation criteria to this LOB's risk tolerance and operational needs

YOUR SPECIALIZED VALIDATION EXPERTISE:
- Performance evaluation against [BU/LOB Name]'s business accuracy benchmarks
- Reliability testing for this business unit's forecasting confidence requirements
- Model robustness assessment for this LOB's market volatility conditions
- Business value validation for this business area's strategic planning needs
- Quality assurance aligned with this unit's operational decision-making standards

BUSINESS-FOCUSED VALIDATION PROCESS:
1. Evaluate model accuracy against [BU/LOB Name]'s planning precision requirements
2. Test reliability standards appropriate for this business unit's risk profile
3. Validate model assumptions against this LOB's business dynamics
4. Assess business value delivery for this business area's strategic objectives
5. Test model stability under this unit's typical market conditions
6. Provide deployment recommendations for this business area's operational workflow

COMPREHENSIVE VALIDATION FRAMEWORK:
**Model Performance Assessment for [BU/LOB Name]:**
• Accuracy metrics evaluated against this business unit's planning standards
• Reliability indicators specific to this LOB's forecasting confidence needs
• Performance benchmarks compared to this business area's historical accuracy
• Quality assurance results for this unit's decision-making requirements

**Business Confidence Evaluation for [BU/LOB Name]:**
• Trust levels appropriate for this business unit's strategic planning
• Reliability assessment for this LOB's operational decision-making
• Confidence intervals calibrated to this business area's risk tolerance
• Deployment readiness for this unit's forecasting workflow integration

**Validation Recommendations for [BU/LOB Name]:**
• Model deployment strategy for this business unit's operational environment
• Monitoring protocols specific to this LOB's performance tracking needs
• Update schedules aligned with this business area's planning cycles
• Quality control measures for this unit's ongoing forecasting accuracy

**Risk Assessment for [BU/LOB Name]:**
• Model limitations relevant to this business unit's decision-making context
• Uncertainty factors specific to this LOB's market conditions
• Mitigation strategies for this business area's forecasting risks
• Performance monitoring alerts for this unit's accuracy thresholds

Focus on ensuring model reliability that supports [BU/LOB Name]'s confident business decision-making.`
  },

  insights: {
    name: "Business Analyst",
    emoji: "💡",
    specialty: "Business Insights & Strategy",
    keywords: ['insights', 'business', 'strategy', 'impact', 'recommendations', 'opportunities', 'risks'],
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    capabilities: ["Business Intelligence", "Strategic Analysis", "Risk Assessment", "Opportunity Identification"],
    systemPrompt: `You are a senior business intelligence analyst specializing in extracting strategic insights and competitive advantages from [BU/LOB Name]'s data patterns and market performance.

CRITICAL CONTEXT REQUIREMENT:
- Extract insights SPECIFICALLY for the selected Business Unit and Line of Business
- Reference [BU/LOB Name] in all strategic analysis and recommendations
- Focus on opportunities and risks relevant to this business unit's market position
- Tailor insights to this LOB's competitive landscape and growth objectives

YOUR SPECIALIZED INSIGHTS EXPERTISE:
- Strategic intelligence extraction from [BU/LOB Name]'s performance data
- Market opportunity identification specific to this business unit's capabilities
- Competitive analysis tailored to this LOB's industry dynamics
- ROI quantification for this business area's investment decisions
- Strategic roadmap development for this unit's growth initiatives

BUSINESS-FOCUSED INSIGHTS PROCESS:
1. Analyze data patterns for [BU/LOB Name]'s strategic implications
2. Identify growth opportunities specific to this business unit's market position
3. Quantify business impact potential for this LOB's revenue and profitability
4. Assess competitive risks and advantages for this business area
5. Develop strategic recommendations aligned with this unit's objectives
6. Create implementation plans for this business area's resource capabilities

STRATEGIC INTELLIGENCE FRAMEWORK:
**Strategic Insights for [BU/LOB Name]:**
• Market intelligence specific to this business unit's competitive landscape
• Performance patterns that reveal this LOB's strategic advantages
• Growth opportunities aligned with this business area's capabilities
• Competitive positioning insights for this unit's market differentiation

**Business Impact Analysis for [BU/LOB Name]:**
• Revenue optimization opportunities specific to this business unit's customer base
• Cost efficiency improvements for this LOB's operational processes
• Market expansion potential for this business area's growth strategy
• Profitability enhancement strategies for this unit's financial performance

**Risk and Opportunity Assessment for [BU/LOB Name]:**
• Market threats specific to this business unit's competitive position
• Operational risks relevant to this LOB's business model
• Strategic opportunities for this business area's market expansion
• Investment priorities for this unit's competitive advantage development

**Strategic Recommendations for [BU/LOB Name]:**
• Priority initiatives for this business unit's growth acceleration
• Resource allocation strategies for this LOB's competitive positioning
• Market entry or expansion plans for this business area's opportunities
• Performance improvement roadmap for this unit's strategic objectives

Focus on delivering strategic intelligence that drives [BU/LOB Name]'s competitive success and market leadership.`
  },

  general: {
    name: "BI Assistant",
    emoji: "🤖",
    specialty: "General BI Support",
    keywords: [],
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    capabilities: ["General Support", "Guidance", "Information"],
    systemPrompt: `You are a business intelligence consultant providing specialized support for [BU/LOB Name]'s analytical and strategic decision-making needs.

CRITICAL CONTEXT REQUIREMENT:
- When a BU/LOB is selected, provide support SPECIFICALLY for that Business Unit and Line of Business
- Reference [BU/LOB Name] in all guidance and recommendations
- Focus on BI processes relevant to this business unit's operational context
- Tailor advice to this LOB's industry characteristics and business model

SPECIALIZED RESPONSIBILITIES:
- Provide BI guidance tailored to [BU/LOB Name]'s specific analytical needs
- Direct users to specialized agents appropriate for this business unit's requirements
- Answer questions about data analysis in the context of this LOB's business objectives
- Explain BI concepts using examples relevant to this business area's operations

BUSINESS-FOCUSED INTERACTION STYLE:
- Use language and examples appropriate for [BU/LOB Name]'s stakeholders
- Provide guidance that considers this business unit's resource constraints
- Offer recommendations aligned with this LOB's strategic priorities
- Focus on solutions that fit this business area's operational workflow

CONTEXTUAL SUPPORT FRAMEWORK:
**For [BU/LOB Name] Specifically:**
- BI process guidance tailored to this business unit's analytical maturity
- Agent recommendations based on this LOB's current analytical priorities
- Data analysis approaches suitable for this business area's decision-making style
- Implementation advice considering this unit's technical and resource capabilities

**When No BU/LOB Selected:**
- General BI guidance with emphasis on selecting appropriate business context
- Recommendations to establish BU/LOB selection for more targeted support
- Overview of analytical capabilities available once business context is defined
- Guidance on setting up business unit structure for optimal BI workflow

Always aim to provide contextually relevant support that advances [BU/LOB Name]'s analytical capabilities and business objectives.`
  }
};

class EnhancedMultiAgentChatHandler {
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
  private dispatch: any;
  private currentAgent: string = 'general';
  private performanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    cacheHitRate: 0
  };

  constructor(dispatch: any) {
    this.dispatch = dispatch;
  }

  // Enhanced agent selection with workflow intelligence
  selectOptimalAgents(userMessage: string, context: any): {
    agents: string[];
    workflow: WorkflowStep[];
    reasoning: string;
  } {
    const lowerMessage = userMessage.toLowerCase();
    const selectedAgents: string[] = [];
    let workflow: WorkflowStep[] = [];
    let reasoning = '';

    // Onboarding detection
    if (/(start|begin|help|guide|getting started|onboard|setup)/i.test(lowerMessage) && !context.selectedLob?.hasData) {
      selectedAgents.push('onboarding');
      reasoning = 'User needs onboarding guidance';
      workflow = [
        { id: 'step-1', name: 'Business Setup', status: 'pending', dependencies: [], estimatedTime: '2m', details: 'Select Business Unit and Line of Business', agent: 'Onboarding Guide' },
        { id: 'step-2', name: 'Data Upload', status: 'pending', dependencies: ['step-1'], estimatedTime: '1m', details: 'Upload your dataset for analysis', agent: 'Onboarding Guide' },
        { id: 'step-3', name: 'Analysis Planning', status: 'pending', dependencies: ['step-2'], estimatedTime: '30s', details: 'Plan your analysis workflow', agent: 'Onboarding Guide' }
      ];
    }
    // Complete forecasting workflow - use sequential workflow
    else if (/(forecast|predict|train|process|complete analysis|end to end)/i.test(lowerMessage)) {
      selectedAgents.push('sequential_workflow');
      reasoning = 'Complete sequential forecasting workflow requested';
      workflow = [
        { id: 'step-1', name: 'Exploratory Data Analysis', status: 'pending', dependencies: [], estimatedTime: '45s', details: `Comprehensive statistical analysis of ${context.selectedBu?.name} - ${context.selectedLob?.name} data`, agent: 'Data Explorer' },
        { id: 'step-2', name: 'Data Preprocessing', status: 'pending', dependencies: ['step-1'], estimatedTime: '30s', details: `Clean and prepare ${context.selectedLob?.name} data for modeling`, agent: 'Data Engineer' },
        { id: 'step-3', name: 'Model Training', status: 'pending', dependencies: ['step-2'], estimatedTime: '2m', details: `Train forecasting models for ${context.selectedBu?.name} patterns`, agent: 'ML Engineer' },
        { id: 'step-4', name: 'Model Validation', status: 'pending', dependencies: ['step-3'], estimatedTime: '30s', details: `Validate model accuracy for ${context.selectedLob?.name} requirements`, agent: 'Quality Analyst' },
        { id: 'step-5', name: 'Forecast Generation', status: 'pending', dependencies: ['step-4'], estimatedTime: '15s', details: `Generate predictions for ${context.selectedBu?.name} planning`, agent: 'Forecast Analyst' },
        { id: 'step-6', name: 'Business Insights', status: 'pending', dependencies: ['step-5'], estimatedTime: '20s', details: `Extract strategic insights for ${context.selectedLob?.name} decision-making`, agent: 'Business Analyst' }
      ];
    }
    // Individual agent selection
    else {
      for (const [agentKey, agent] of Object.entries(ENHANCED_AGENTS)) {
        if (agentKey === 'general') continue;

        for (const keyword of agent.keywords) {
          if (lowerMessage.includes(keyword)) {
            selectedAgents.push(agentKey);
            reasoning = `${agent.name} selected for ${keyword}-related query`;
            workflow = [
              { id: 'step-1', name: agent.specialty, status: 'pending', dependencies: [], estimatedTime: '30s', details: `${agent.specialty} analysis`, agent: agent.name }
            ];
            break;
          }
        }
        if (selectedAgents.length > 0) break;
      }
    }

    if (selectedAgents.length === 0) {
      selectedAgents.push('general');
      reasoning = 'General assistant for broad query';
      workflow = [
        { id: 'step-1', name: 'General Assistance', status: 'pending', dependencies: [], estimatedTime: '10s', details: 'Provide general help', agent: 'BI Assistant' }
      ];
    }

    this.dispatch({
      type: 'ADD_THINKING_STEP',
      payload: `🧠 Agent Selection: ${reasoning}`
    });

    return { agents: selectedAgents, workflow, reasoning };
  }

  async generateEnhancedResponse(userMessage: string, context: any) {
    const startTime = Date.now();
    this.performanceMetrics.requestCount++;

    // Validate input
    const validation = validateChatMessage(userMessage);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const sanitizedMessage = sanitizeUserInput(userMessage);

    this.dispatch({ type: 'ADD_THINKING_STEP', payload: '🔍 Analyzing request with enhanced intelligence...' });

    // Select optimal agents and workflow
    const { agents, workflow, reasoning } = this.selectOptimalAgents(sanitizedMessage, context);

    // Set workflow if multi-step
    if (workflow.length > 1) {
      this.dispatch({ type: 'SET_WORKFLOW', payload: workflow });
    }

    let finalResponse = '';
    let finalReportData = null;
    let finalAgentType = 'general';
    let aggregatedInsights: any = {};

    // Timeout promise to avoid long waits
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI response timed out')), 15000); // 15 seconds timeout
    });

    try {
      const responsePromise = (async () => {
        // Always use filtered data context for all agents
        const filteredData =
          context.selectedLob?.mockData?.filter((item: any) => {
            if (!context.dateRange?.start || !context.dateRange?.end) return true;
            const d = new Date(item.Date);
            return d >= context.dateRange.start && d <= context.dateRange.end;
          }) ?? [];

        // Handle sequential workflow differently
        if (agents.includes('sequential_workflow')) {
          this.dispatch({ type: 'ADD_THINKING_STEP', payload: '🔄 Executing sequential workflow with LOB data...' });

          try {
            // Create sequential workflow with actual LOB data
            const sequentialWorkflow = new SequentialAgentWorkflow(context, filteredData);

            // Execute complete workflow
            const workflowResult = await sequentialWorkflow.executeCompleteWorkflow();

            finalResponse = workflowResult.finalResponse;
            finalReportData = {
              title: `Complete Analysis Report for ${context.selectedBu?.name} - ${context.selectedLob?.name}`,
              workflowState: workflowResult.workflowState,
              stepResults: workflowResult.stepByStepResults
            };

            this.dispatch({ type: 'ADD_THINKING_STEP', payload: '✅ Sequential workflow completed successfully' });

          } catch (error) {
            console.error('Sequential workflow error:', error);
            finalResponse = `⚠️ Error in sequential workflow: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        } else {
          // Handle individual agents
          for (const agentKey of agents) {
            this.currentAgent = agentKey;
            finalAgentType = agentKey;
            const agent = ENHANCED_AGENTS[agentKey];

            try {
              this.dispatch({ type: 'ADD_THINKING_STEP', payload: `${agent.emoji} ${agent.name} analyzing...` });

              // Enhanced context building with statistical analysis and filtered data
              const enhancedContext = {
                ...context,
                filteredData,
                dateRange: context.dateRange,
                selectedLob: {
                  ...context.selectedLob,
                  mockData: filteredData
                }
              };
              const systemPrompt = this.buildEnhancedSystemPrompt(enhancedContext, agent);

              this.conversationHistory.push({ role: "user", content: sanitizedMessage });

              const completion = await enhancedAPIClient.createChatCompletion({
                model: "gpt-4-turbo",
                messages: [
                  { role: "system", content: systemPrompt },
                  ...this.conversationHistory.slice(-10) // Keep recent context
                ],
                temperature: agentKey === 'insights' ? 0.7 : 0.5,
                max_tokens: 1200,
                useCache: true
              });

              const aiResponse = completion.choices[0].message.content ?? "";
              this.dispatch({ type: 'ADD_THINKING_STEP', payload: `✅ ${agent.name} analysis complete` });

              // Extract and parse [REPORT_DATA] block if present
              let reportData = null;
              const reportMatch = aiResponse.match(/\[REPORT_DATA\]([\s\S]*?)\[\/REPORT_DATA\]/);
              if (reportMatch) {
                try {
                  // Attempt to fix single-quoted or unquoted property names
                  let jsonStr = reportMatch[1].trim();
                  // Replace single quotes with double quotes
                  jsonStr = jsonStr.replace(/'/g, '"');
                  // Add double quotes around unquoted property names
                  jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                  reportData = JSON.parse(jsonStr);
                  aggregatedInsights[agentKey] = reportData;
                  if (agents.length === 1) {
                    finalReportData = reportData;
                  }
                } catch (e) {
                  console.error("Failed to parse [REPORT_DATA]:", e, reportMatch[1]);
                }
              }

              // Clean response - remove any JSON structures that might appear
              const cleanResponse = aiResponse.replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/g, '').trim();

              // Append clean response
              if (agents.length === 1) {
                finalResponse = cleanResponse;
              } else {
                finalResponse += `## ${agent.name}\n${cleanResponse}\n\n`;
              }

              await new Promise(resolve => setTimeout(resolve, 200));
              this.conversationHistory.push({ role: "assistant", content: cleanResponse });

            } catch (error) {
              console.error(`${agent.name} Error:`, error);
              this.performanceMetrics.errorCount++;

              finalResponse += `## ${agent.name}\n⚠️ ${error instanceof Error ? error.message : 'An unexpected error occurred'}\n\n`;
            }
          }
        }
      })();

      await Promise.race([responsePromise, timeoutPromise]);

    } catch (error) {
      console.error('AI response error or timeout:', error);
      if (!finalResponse) {
        finalResponse = "I'm sorry, but the AI service is currently unavailable. Please try again later.";
      }
    }

    // Generate comprehensive report for multi-agent workflows
    if (agents.length > 1 && Object.keys(aggregatedInsights).length > 0) {
      finalReportData = this.generateComprehensiveReport(aggregatedInsights);
    }

    // Update performance metrics
    const responseTime = Date.now() - startTime;
    this.performanceMetrics.avgResponseTime =
      (this.performanceMetrics.avgResponseTime * (this.performanceMetrics.requestCount - 1) + responseTime) / this.performanceMetrics.requestCount;
    this.performanceMetrics.cacheHitRate = enhancedAPIClient.getCacheStats().hitRate;

    this.dispatch({ type: 'CLEAR_THINKING_STEPS' });

    return {
      response: finalResponse.trim() || "I apologize, but I couldn't generate a complete response. Please try again.",
      agentType: finalAgentType,
      reportData: finalReportData,
      performance: this.performanceMetrics,
      multiAgent: agents.length > 1
    };
  }

  private async buildEnhancedContext(context: any, agentKey: string) {
    let enhancedContext = { ...context };

    // Add statistical analysis if data is available
    if (context.selectedLob?.hasData && context.selectedLob?.mockData) {
      const dataPoints: DataPoint[] = context.selectedLob.mockData.map((item: any) => ({
        date: new Date(item.Date),
        value: item.Value,
        orders: item.Orders
      }));

      // Generate statistical insights
      if (agentKey === 'eda' || agentKey === 'insights') {
        const statisticalSummary = statisticalAnalyzer.generateSummary(dataPoints);
        const trendAnalysis = statisticalAnalyzer.analyzeTrend(dataPoints);
        const seasonalityAnalysis = statisticalAnalyzer.analyzeSeasonality(dataPoints);
        const qualityReport = insightsGenerator.generateDataQualityReport(dataPoints);

        enhancedContext.statisticalAnalysis = {
          summary: statisticalSummary,
          trend: trendAnalysis,
          seasonality: seasonalityAnalysis,
          quality: qualityReport
        };
      }
    }

    return enhancedContext;
  }

  private buildEnhancedSystemPrompt(context: any, agent: AgentConfig): string {
    const { selectedBu, selectedLob, statisticalAnalysis } = context;

    // Get the actual BU/LOB names for context replacement
    const buLobName = selectedBu && selectedLob
      ? `${selectedBu.name} - ${selectedLob.name}`
      : 'the selected business unit';

    // Replace [BU/LOB Name] placeholders in the agent's system prompt
    let contextualizedPrompt = agent.systemPrompt.replace(/\[BU\/LOB Name\]/g, buLobName);

    let businessContext = 'No business data selected';

    if (selectedLob?.hasData) {
      const dq = selectedLob.dataQuality;
      businessContext = `
BUSINESS SITUATION:
You are analyzing data for ${selectedBu?.name || 'the business'} - ${selectedLob?.name || 'department'}.
The dataset contains ${selectedLob.recordCount} records showing ${dq?.trend || 'stable'} performance trends.
Data quality is ${dq?.completeness || 95}% complete with ${dq?.outliers || 0} unusual data points to investigate.`;

      // Add business-friendly insights for analysis
      if (statisticalAnalysis) {
        const trend = statisticalAnalysis.trend;
        const quality = statisticalAnalysis.quality;

        businessContext += `

BUSINESS INSIGHTS AVAILABLE:
The data shows ${trend.direction} performance with ${(trend.confidence * 100).toFixed(0)}% confidence.
${statisticalAnalysis.seasonality.hasSeasonality ? 'Seasonal patterns are present' : 'Performance is consistent throughout periods'}.
Overall data reliability: ${quality.score}/100 (${quality.score > 80 ? 'High' : quality.score > 60 ? 'Medium' : 'Low'}).

Please provide a detailed, data-specific analysis and actionable insights based on this data context. Avoid generic advice or instructions.`;
      }
    } else if (selectedBu && selectedLob) {
      // Even without data, provide BU/LOB context
      businessContext = `
BUSINESS CONTEXT:
You are working with ${selectedBu.name} - ${selectedLob.name}.
Currently no data is uploaded for this business unit. Guide the user on next steps for data analysis.`;
    }

    return `${contextualizedPrompt}

${businessContext}

RESPONSE GUIDELINES:
- Always reference the specific Business Unit and Line of Business by name when available
- Provide comprehensive, detailed analysis while using business-friendly language
- Include specific numbers, percentages, and quantified insights when data is available
- Explain the business significance of patterns and trends for this specific BU/LOB
- Offer detailed recommendations with clear reasoning for this business context
- Use executive-level language that demonstrates expertise
- Structure responses with clear sections and bullet points for readability
- Include confidence levels and reliability assessments in business terms

AVOID: Code, JSON, technical formulas, programming syntax
INCLUDE: Detailed business insights specific to ${buLobName}, specific metrics, comprehensive recommendations, strategic implications

Your responses should be thorough and valuable for business decision-making in the context of ${buLobName}.`;
  }

  private generateComprehensiveReport(insights: any) {
    const sections: any = {};

    // Aggregate insights from all agents
    Object.keys(insights).forEach(agentKey => {
      const data = insights[agentKey];
      if (data.title) sections[agentKey] = data;
    });

    return {
      title: "Comprehensive Business Intelligence Analysis",
      executiveSummary: "Multi-agent analysis combining statistical insights, data quality assessment, forecasting, and strategic recommendations.",
      sections,
      overallRecommendations: this.synthesizeRecommendations(insights),
      confidence: this.calculateOverallConfidence(insights)
    };
  }

  private synthesizeRecommendations(insights: any): string[] {
    const allRecommendations: string[] = [];

    Object.values(insights).forEach((data: any) => {
      if (data.recommendations) {
        allRecommendations.push(...data.recommendations);
      }
    });

    // Remove duplicates and prioritize
    return Array.from(new Set(allRecommendations)).slice(0, 5);
  }

  private calculateOverallConfidence(insights: any): number {
    const confidenceScores: number[] = [];

    Object.values(insights).forEach((data: any) => {
      if (data.confidence) confidenceScores.push(data.confidence);
      if (data.qualityScore) confidenceScores.push(data.qualityScore / 100);
    });

    return confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0.5;
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheStats: enhancedAPIClient.getCacheStats(),
      queueSize: enhancedAPIClient.getQueueSize()
    };
  }
}

let enhancedChatHandler: EnhancedMultiAgentChatHandler | null = null;

// Enhanced Chat Bubble with performance indicators
function EnhancedChatBubble({
  message,
  onSuggestionClick,
  onVisualizeClick,
  onGenerateReport,
  thinkingSteps,
  performance
}: {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onVisualizeClick: (messageId: string) => void;
  onGenerateReport?: (messageId: string) => void;
  thinkingSteps: string[];
  performance?: any;
}) {
  const isUser = message.role === 'user';
  const agentInfo = message.agentType ? ENHANCED_AGENTS[message.agentType as keyof typeof ENHANCED_AGENTS] : null;
  const [showPerformance, setShowPerformance] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Function to extract summary and details from content
  const extractSummaryAndDetails = (text: string) => {
    // Heuristic: summary is up to first "##" or "Details"/"Analysis" section, rest is details
    const splitRegex = /\n{2,}|(?=## )|(?=Details:|Analysis:|^---$)/im;
    const parts = text.split(splitRegex);
    const summary = parts[0];
    const details = parts.slice(1).join('\n\n');
    return { summary, details };
  };

  const { summary, details } = extractSummaryAndDetails(message.content);

  // Visually appealing summary/details toggle
  return (
    <div className={cn('flex items-start gap-3 w-full', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(
            "text-lg font-semibold",
            agentInfo?.color || "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
          )}>
            {agentInfo?.emoji || <Bot />}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-4xl", isUser ? "order-1" : "")}>
        {/* Enhanced Agent Badge */}
        {!isUser && agentInfo && agentInfo.name !== 'BI Assistant' && (
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs font-medium", agentInfo.color)}>
              <span className="mr-1">{agentInfo.emoji}</span>
              {agentInfo.name}
            </Badge>
            <span className="text-xs text-muted-foreground">• {agentInfo.specialty}</span>
            {performance && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowPerformance(!showPerformance)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Performance
              </Button>
            )}
          </div>
        )}

        {/* Performance Metrics Display */}
        {showPerformance && performance && !isUser && (
          <Card className="mb-2 p-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Cache Hit Rate: {(performance.cacheHitRate * 100).toFixed(1)}%</div>
              <div>Avg Response: {performance.avgResponseTime}ms</div>
              <div>Requests: {performance.requestCount}</div>
              <div>Errors: {performance.errorCount}</div>
            </div>
          </Card>
        )}

        <div className={cn(
          'rounded-xl p-4 text-sm max-w-none',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50 border'
        )}>
          {message.isTyping ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-pulse rounded-full bg-current"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Enhanced AI processing...</span>
              </div>

              {/* Enhanced Thinking Steps with Progress */}
              {thinkingSteps.length > 0 && (
                <div className="space-y-2">
                  <Progress value={(thinkingSteps.length / 6) * 100} className="h-1" />
                  {thinkingSteps.map((step, i) => {
                    const isActive = i === thinkingSteps.length - 1;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 animate-in slide-in-from-left duration-300"
                        style={{
                          animationDelay: `${i * 100}ms`,
                          opacity: isActive ? 1 : 0.6
                        }}
                      >
                        {isActive ? (
                          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className={cn(
                          "text-xs transition-all duration-300",
                          isActive ? "text-foreground font-medium" : "text-muted-foreground/70"
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
            <div>
              {/* Summary always visible, details toggle */}
              <div className="mb-2" style={{ lineHeight: 1.6 }}>
                <div dangerouslySetInnerHTML={{
                  __html: summary
                    .replace(/\[WORKFLOW_PLAN\][\s\S]*?\[\/WORKFLOW_PLAN\]/, '')
                    .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, '')
                    .replace(/## (.*?)$/gm, '<h3 class="text-base font-semibold mt-2 mb-1 text-foreground">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong className="font-semibold">$1</strong>')
                    .replace(/• (.*?)(?=\n|$)/g, '<li className="ml-4">$1</li>')
                    .replace(/\n/g, '<br />')
                }} />
              </div>
              {details && details.trim().length > 0 && (
                <Button size="sm" variant="outline" className="mb-2" onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              )}
              {showDetails && details && (
                <div className="mt-2 p-3 bg-muted/20 rounded border text-xs whitespace-pre-wrap font-mono overflow-auto max-h-60">
                  {details}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Visualization Display */}
        {message.visualization?.isShowing && message.visualization.data && (
          <div className="mt-3 rounded-lg border bg-card p-3">
            <DataVisualizer
              data={message.visualization.data}
              target={message.visualization.target as 'Value' | 'Orders'}
              isRealData={true}
            />
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="mt-3 space-y-2">
          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-3">
              <div className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Suggested Next Steps
              </div>
              <div className="flex flex-wrap gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {message.visualization && !message.visualization.isShowing && (
              <Button size="sm" variant="outline" onClick={() => onVisualizeClick(message.id)}>
                <BarChart className="mr-2 h-3 w-3" />
                Visualize Data
              </Button>
            )}
            {message.canGenerateReport && onGenerateReport && (
              <Button
                size="sm"
                variant="default"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => onGenerateReport(message.id)}
              >
                <FileText className="mr-2 h-3 w-3" />
                Generate Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback><User /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
