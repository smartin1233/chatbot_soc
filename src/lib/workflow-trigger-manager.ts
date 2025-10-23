/**
 * Workflow Trigger Manager
 * 
 * Intelligently distinguishes between analytical questions and execution requests
 * for forecasting workflows. Routes analytical questions to BI analyst agent and
 * triggers workflows only for explicit execution requests.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { IntentType, UserContext } from './intent-analyzer';

/**
 * Decision result for workflow triggering
 */
export interface WorkflowTriggerDecision {
  shouldTrigger: boolean;
  reason: string;
  alternativeAction: 'route_to_analyst' | 'use_existing_results' | 'clarify_intent' | 'none';
  confidence: number;
  suggestedAgent?: string;
  contextualInfo?: Record<string, any>;
}

/**
 * Agent routing information
 */
export interface AgentRoute {
  agentId: string;
  agentType: string;
  priority: number;
  context: Record<string, any>;
  skipWorkflow: boolean;
}

/**
 * Workflow Trigger Manager
 * Manages intelligent workflow triggering based on query analysis
 */
export class WorkflowTriggerManager {
  // Patterns for analytical questions about forecasts
  private readonly analyticalPatterns = [
    /how (reliable|accurate|good|trustworthy|valid) is\s+(this|the)\s+forecast/i,
    /what does\s+(this|the)\s+forecast\s+(mean|tell|show|indicate|suggest)/i,
    /how (can|should|do) I\s+(use|interpret|understand|read|apply)\s+(this|the)\s+forecast/i,
    /what decisions can I make\s+(from|based on|with|using)\s+(this|the)\s+forecast/i,
    /\b(explain|interpret|analyze|describe)\s+(this|the)\s+forecast/i,
    /\bconfidence\s+(level|interval|bound(s)?)\s+(of|for|in)\s+(the\s+)?forecast/i,
    /\bforecast\s+(quality|reliability|accuracy|performance|validity)/i,
    /\bshould I trust\s+(this|the)\s+forecast/i,
    /\bhow\s+(certain|sure|confident)\s+(are you|is\s+(this|the)\s+forecast)/i,
    /\bwhat (is|are)\s+the\s+(limitation(s)?|assumption(s)?|risk(s)?)\s+of\s+(this|the)\s+forecast/i,
    /\bcan I rely on\s+(this|the)\s+forecast/i,
    /\btell me (about|more about)\s+(this|the)\s+forecast/i,
  ];

  // Patterns for execution requests
  private readonly executionPatterns = [
    /\b(forecast|predict|project)\s+(the\s+)?(next|coming|future|upcoming)/i,
    /\b(generate|create|run|execute|start|make|produce)\s+(a\s+)?(new\s+)?(forecast|prediction)/i,
    /\bwhat will\s+(the\s+)?(value(s)?|number(s)?|data|metric(s)?)\s+be/i,
    /\bforecast\s+for\s+(next|\d+)\s+(day(s)?|week(s)?|month(s)?|year(s)?)/i,
    /\bpredict\s+(the\s+)?(trend|future|next period|upcoming)/i,
    /\bI (want|need)\s+(a\s+)?(forecast|prediction)/i,
    /\bcan you (forecast|predict)/i,
    /\bshow me\s+(a\s+)?(forecast|prediction)\s+for/i,
    /\b(build|train)\s+(a\s+)?(new\s+)?(forecast|prediction)\s+model/i,
  ];

  // Patterns for decision-making questions
  private readonly decisionMakingPatterns = [
    /\bwhat (action(s)?|step(s)?|decision(s)?)\s+(should|can|could) I take/i,
    /\bhow should I\s+(respond|react|act|proceed)/i,
    /\bwhat (is|are)\s+the\s+(implication(s)?|impact|consequence(s)?)/i,
    /\bshould I\s+(increase|decrease|change|adjust|modify)/i,
    /\bwhat (does|do)\s+(this|these)\s+(result(s)?|number(s)?|forecast(s)?)\s+mean for/i,
    /\bhow (will|does|can)\s+(this|the forecast)\s+affect/i,
  ];

  // Patterns indicating existing forecast context
  private readonly existingForecastPatterns = [
    /\b(this|the|current|existing)\s+forecast/i,
    /\b(these|the|current)\s+(result(s)?|prediction(s)?|number(s)?)/i,
    /\bthe\s+(above|previous|last)\s+forecast/i,
  ];

  /**
   * Determine if a forecasting workflow should be triggered
   */
  shouldTriggerForecast(message: string, context: UserContext): WorkflowTriggerDecision {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check if this is an analytical question
    if (this.isAnalyticalQuestion(normalizedMessage)) {
      return this.createAnalyticalDecision(message, context);
    }
    
    // Check if this is an execution request
    if (this.isExecutionRequest(normalizedMessage)) {
      return this.createExecutionDecision(message, context);
    }
    
    // Check if this is a decision-making question
    if (this.isDecisionMakingQuestion(normalizedMessage)) {
      return this.createDecisionMakingDecision(message, context);
    }
    
    // Check if message references existing forecast
    if (this.referencesExistingForecast(normalizedMessage) && context.hasForecastResults) {
      return this.createExistingForecastDecision(message, context);
    }
    
    // Default: clarify intent
    return this.createClarificationDecision(message, context);
  }

  /**
   * Check if message is an analytical question
   */
  private isAnalyticalQuestion(message: string): boolean {
    return this.analyticalPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is an execution request
   */
  private isExecutionRequest(message: string): boolean {
    return this.executionPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is a decision-making question
   */
  private isDecisionMakingQuestion(message: string): boolean {
    return this.decisionMakingPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message references existing forecast
   */
  private referencesExistingForecast(message: string): boolean {
    return this.existingForecastPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Create decision for analytical questions
   */
  private createAnalyticalDecision(message: string, context: UserContext): WorkflowTriggerDecision {
    const hasForecast = context.hasForecastResults;
    
    return {
      shouldTrigger: false,
      reason: hasForecast
        ? 'Analytical question about existing forecast - routing to BI analyst'
        : 'Analytical question but no forecast exists - suggesting forecast creation first',
      alternativeAction: hasForecast ? 'route_to_analyst' : 'clarify_intent',
      confidence: hasForecast ? 0.9 : 0.7,
      suggestedAgent: hasForecast ? 'bi_analyst_agent' : undefined,
      contextualInfo: {
        queryType: 'analytical',
        hasForecastContext: hasForecast,
        requiresExistingData: true,
      },
    };
  }

  /**
   * Create decision for execution requests
   */
  private createExecutionDecision(message: string, context: UserContext): WorkflowTriggerDecision {
    const hasData = context.hasUploadedData;
    
    return {
      shouldTrigger: hasData,
      reason: hasData
        ? 'Explicit forecast execution request - triggering workflow'
        : 'Forecast requested but no data uploaded - requesting data first',
      alternativeAction: hasData ? 'none' : 'clarify_intent',
      confidence: 0.95,
      contextualInfo: {
        queryType: 'execution',
        hasDataContext: hasData,
        workflowType: 'forecasting',
      },
    };
  }

  /**
   * Create decision for decision-making questions
   */
  private createDecisionMakingDecision(message: string, context: UserContext): WorkflowTriggerDecision {
    const hasForecast = context.hasForecastResults;
    
    return {
      shouldTrigger: false,
      reason: hasForecast
        ? 'Decision-making question about forecast - using existing results'
        : 'Decision-making question but no forecast exists - suggesting forecast creation',
      alternativeAction: hasForecast ? 'use_existing_results' : 'clarify_intent',
      confidence: 0.85,
      suggestedAgent: hasForecast ? 'bi_analyst_agent' : undefined,
      contextualInfo: {
        queryType: 'decision_making',
        hasForecastContext: hasForecast,
        requiresAnalysis: true,
      },
    };
  }

  /**
   * Create decision for questions referencing existing forecast
   */
  private createExistingForecastDecision(message: string, context: UserContext): WorkflowTriggerDecision {
    return {
      shouldTrigger: false,
      reason: 'Question references existing forecast - using current results',
      alternativeAction: 'use_existing_results',
      confidence: 0.9,
      suggestedAgent: 'bi_analyst_agent',
      contextualInfo: {
        queryType: 'existing_forecast_reference',
        hasForecastContext: true,
        useExistingData: true,
      },
    };
  }

  /**
   * Create decision when intent needs clarification
   */
  private createClarificationDecision(message: string, context: UserContext): WorkflowTriggerDecision {
    return {
      shouldTrigger: false,
      reason: 'Intent unclear - requesting clarification',
      alternativeAction: 'clarify_intent',
      confidence: 0.5,
      contextualInfo: {
        queryType: 'unclear',
        needsClarification: true,
      },
    };
  }

  /**
   * Route to appropriate agent based on decision
   */
  routeToAppropriateAgent(decision: WorkflowTriggerDecision, message: string, intentType?: IntentType): AgentRoute {
    // If workflow should trigger, route to workflow orchestrator
    if (decision.shouldTrigger) {
      return {
        agentId: 'workflow_orchestrator',
        agentType: 'orchestrator',
        priority: 1,
        context: {
          triggerWorkflow: true,
          workflowType: decision.contextualInfo?.workflowType || 'forecasting',
          originalMessage: message,
        },
        skipWorkflow: false,
      };
    }

    // Route based on alternative action
    switch (decision.alternativeAction) {
      case 'route_to_analyst':
        return {
          agentId: 'bi_analyst_agent',
          agentType: 'analyst',
          priority: 1,
          context: {
            useExistingForecast: true,
            analysisType: 'forecast_interpretation',
            originalMessage: message,
          },
          skipWorkflow: true,
        };

      case 'use_existing_results':
        return {
          agentId: decision.suggestedAgent || 'bi_analyst_agent',
          agentType: 'analyst',
          priority: 1,
          context: {
            useExistingResults: true,
            queryType: decision.contextualInfo?.queryType,
            originalMessage: message,
          },
          skipWorkflow: true,
        };

      case 'clarify_intent':
        return {
          agentId: 'general_agent',
          agentType: 'general',
          priority: 1,
          context: {
            needsClarification: true,
            reason: decision.reason,
            originalMessage: message,
            suggestions: this.generateClarificationSuggestions(decision, intentType),
          },
          skipWorkflow: true,
        };

      default:
        return {
          agentId: 'general_agent',
          agentType: 'general',
          priority: 1,
          context: {
            originalMessage: message,
          },
          skipWorkflow: true,
        };
    }
  }

  /**
   * Generate clarification suggestions based on context
   */
  private generateClarificationSuggestions(
    decision: WorkflowTriggerDecision,
    intentType?: IntentType
  ): string[] {
    const suggestions: string[] = [];
    
    const contextInfo = decision.contextualInfo;
    
    // Suggest data upload if needed
    if (contextInfo?.hasDataContext === false) {
      suggestions.push('Please upload your data first to generate a forecast');
    }
    
    // Suggest forecast creation if needed
    if (contextInfo?.hasForecastContext === false && contextInfo?.requiresExistingData) {
      suggestions.push('Would you like me to create a forecast first?');
    }
    
    // Suggest clarifying the question
    if (contextInfo?.needsClarification) {
      suggestions.push('Could you clarify if you want to:');
      suggestions.push('1. Generate a new forecast');
      suggestions.push('2. Analyze existing forecast results');
      suggestions.push('3. Get insights about your data');
    }
    
    return suggestions;
  }

  /**
   * Determine if workflow should be triggered based on intent type
   */
  shouldTriggerWorkflowForIntent(intentType: IntentType, context: UserContext): boolean {
    switch (intentType) {
      case IntentType.FORECASTING_EXECUTION:
        return context.hasUploadedData;
      
      case IntentType.FORECASTING_ANALYSIS:
        return false; // Never trigger for analysis questions
      
      case IntentType.MODEL_TRAINING:
        return context.hasUploadedData;
      
      case IntentType.OUTLIER_DETECTION:
        return !context.hasOutlierAnalysis && context.hasUploadedData;
      
      case IntentType.PREPROCESSING:
        return context.hasOutlierAnalysis;
      
      default:
        return false;
    }
  }

  /**
   * Get workflow type for intent
   */
  getWorkflowTypeForIntent(intentType: IntentType): string {
    const workflowMap: Record<IntentType, string> = {
      [IntentType.FORECASTING_EXECUTION]: 'forecasting',
      [IntentType.MODEL_TRAINING]: 'model_training',
      [IntentType.OUTLIER_DETECTION]: 'outlier_detection',
      [IntentType.PREPROCESSING]: 'preprocessing',
      [IntentType.DATA_DESCRIPTION]: 'eda',
      [IntentType.FORECASTING_ANALYSIS]: 'none',
      [IntentType.INSIGHTS_REQUEST]: 'insights',
      [IntentType.GENERAL_QUERY]: 'none',
    };
    
    return workflowMap[intentType] || 'none';
  }

  /**
   * Check if context has required data for workflow
   */
  hasRequiredContext(intentType: IntentType, context: UserContext): boolean {
    switch (intentType) {
      case IntentType.FORECASTING_EXECUTION:
      case IntentType.MODEL_TRAINING:
      case IntentType.DATA_DESCRIPTION:
      case IntentType.OUTLIER_DETECTION:
        return context.hasUploadedData;
      
      case IntentType.FORECASTING_ANALYSIS:
        return context.hasForecastResults;
      
      case IntentType.PREPROCESSING:
        return context.hasOutlierAnalysis;
      
      case IntentType.INSIGHTS_REQUEST:
        return context.hasUploadedData || context.hasForecastResults;
      
      default:
        return true;
    }
  }

  /**
   * Get missing context message
   */
  getMissingContextMessage(intentType: IntentType, context: UserContext): string {
    if (!context.hasUploadedData) {
      return 'Please upload your data first to proceed with this analysis.';
    }
    
    if (intentType === IntentType.FORECASTING_ANALYSIS && !context.hasForecastResults) {
      return 'No forecast results available. Would you like me to generate a forecast first?';
    }
    
    if (intentType === IntentType.PREPROCESSING && !context.hasOutlierAnalysis) {
      return 'Please run outlier detection first to get preprocessing recommendations.';
    }
    
    return 'Some required context is missing. Please provide more information.';
  }
}
