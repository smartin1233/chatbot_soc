/**
 * Intent Analysis Engine
 * 
 * Accurately classifies user queries to route to appropriate agents and workflows.
 * Implements pattern matching for analytical vs execution requests with entity extraction
 * and confidence scoring.
 * 
 * Requirements: 6.1, 6.2, 9.1, 9.2, 9.3, 9.4
 */

import { AppState } from './types';

// Intent types based on design specification
export enum IntentType {
  DATA_DESCRIPTION = 'data_description',
  DETAILED_EDA = 'detailed_eda',
  OUTLIER_DETECTION = 'outlier_detection',
  PREPROCESSING = 'preprocessing',
  MODEL_TRAINING = 'model_training',
  FORECASTING_EXECUTION = 'forecasting_execution',
  FORECASTING_ANALYSIS = 'forecasting_analysis',
  INSIGHTS_REQUEST = 'insights_request',
  VISUALIZE_DATA = 'visualize_data',
  GENERAL_QUERY = 'general_query'
}

// Entity types that can be extracted from user queries
export interface Entity {
  type: 'time_period' | 'metric' | 'action' | 'data_reference' | 'model_type';
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

// Intent classification result
export interface Intent {
  type: IntentType;
  confidence: number;
  entities: Entity[];
  requiresWorkflow: boolean;
  targetAgents: string[];
  contextualHints: string[];
}

// User context for intent analysis
export interface UserContext {
  hasUploadedData: boolean;
  hasForecastResults: boolean;
  hasOutlierAnalysis: boolean;
  recentIntents: IntentType[];
  currentWorkflowPhase?: string;
}

/**
 * Intent Analysis Engine
 * Classifies user queries and extracts relevant entities
 */
export class IntentAnalyzer {
  // Pattern definitions for intent classification
  private readonly patterns = {
    dataDescription: [
      /\b(explore|show|display)\s+(the\s+)?(data|dataset)\b/i,
      /\bexplore\s+(my\s+)?data\b/i,
      /\bwhat (does|do) (the\s+)?(data|dataset|values) (look like|show|contain)\b/i,
      /\bgive me (a\s+)?(summary|overview) of (the\s+)?data\b/i,
      /\bdata\s+(overview|summary)\b/i,
    ],
    
    detailedEDA: [
      /\b(detailed|comprehensive|full|complete)\s+(eda|analysis|exploration)\b/i,
      /\bperform\s+(detailed|comprehensive|full)\s+(eda|analysis)\b/i,
      /\bdetailed\s+(data\s+)?(analysis|exploration)\b/i,
      /\bcomprehensive\s+(data\s+)?(analysis|exploration)\b/i,
    ],
    
    outlierDetection: [
      /\b(check|detect|find|identify|show|analyze)\s+(for\s+)?(anomal(y|ies)|outlier(s)?)\b/i,
      /\b(anomal(y|ies)|outlier(s)?)\s+(detection|analysis|check)\b/i,
      /\bare there any\s+(anomal(y|ies)|outlier(s)?|unusual value(s)?)\b/i,
      /\bshow\s+(me\s+)?(the\s+)?(anomal(y|ies)|outlier(s)?)\b/i,
      /\bdetect\s+(data\s+)?(anomal(y|ies)|outlier(s)?)\b/i,
    ],
    
    preprocessing: [
      /\b(clean|preprocess|prepare|fix|handle)\s+(the\s+)?(data|dataset|outlier(s)?)\b/i,
      /\bhow (do I|should I|can I)\s+(clean|fix|handle|deal with)\b/i,
      /\b(remove|impute|transform|cap)\s+(outlier(s)?|missing value(s)?|anomal(y|ies))\b/i,
      /\bdata\s+(cleaning|preparation|preprocessing)\b/i,
      /\bwhat should I do (about|with)\s+(the\s+)?(outlier(s)?|anomal(y|ies)|data issue(s)?)\b/i,
    ],
    
    modelTraining: [
      /\b(train|build|create|configure)\s+(a\s+)?(model|forecast model)\b/i,
      /\bmodel\s+(training|configuration|setup|parameters)\b/i,
      /\b(set up|configure)\s+(forecasting|prediction)\s+(model|parameters)\b/i,
      /\b(select|choose)\s+(a\s+)?(model|algorithm)\b/i,
      /\bhyperparameter(s)?\s+(tuning|optimization)\b/i,
    ],
    
    forecastingExecution: [
      /\b(forecast|predict|project)\s+(the\s+)?(next|coming|future)\b/i,
      /\b(generate|create|run|execute|start)\s+(a\s+)?(forecast|prediction)\b/i,
      /\bwhat will\s+(the\s+)?(value(s)?|number(s)?|data)\s+be\b/i,
      /\bforecast\s+for\s+(next|\d+)\s+(day(s)?|week(s)?|month(s)?|year(s)?)\b/i,
      /\bpredict\s+(the\s+)?(trend|future|next period)\b/i,
    ],
    
    forecastingAnalysis: [
      /\bhow (reliable|accurate|good|trustworthy) is\s+(this|the)\s+forecast\b/i,
      /\bwhat does\s+(this|the)\s+forecast\s+(mean|tell|show|indicate)\b/i,
      /\bhow (can|should) I\s+(use|interpret|understand)\s+(this|the)\s+forecast\b/i,
      /\bwhat decisions can I make\s+(from|based on|with)\s+(this|the)\s+forecast\b/i,
      /\b(explain|interpret|analyze)\s+(this|the)\s+forecast\b/i,
      /\bconfidence\s+(level|interval|bound(s)?)\s+(of|for)\s+(the\s+)?forecast\b/i,
      /\bforecast\s+(quality|reliability|accuracy)\b/i,
    ],
    
    insightsRequest: [
      /\b(insight(s)?|recommendation(s)?|suggestion(s)?|advice)\b/i,
      /\bwhat (should|can) I\s+(do|know|learn)\b/i,
      /\b(key|important|main)\s+(finding(s)?|takeaway(s)?|point(s)?)\b/i,
      /\b(business|actionable)\s+(insight(s)?|intelligence)\b/i,
      /\btell me\s+(something|what)\s+(interesting|important)\b/i,
    ],
  };

  // Entity extraction patterns
  private readonly entityPatterns = {
    timePeriod: [
      /\b(\d+)\s+(day(s)?|week(s)?|month(s)?|year(s)?)\b/gi,
      /\b(next|coming|following|past|last|previous)\s+(\d+)?\s*(day(s)?|week(s)?|month(s)?|year(s)?)\b/gi,
      /\b(today|tomorrow|yesterday|this week|next week|this month|next month)\b/gi,
    ],
    metric: [
      /\b(accuracy|mape|rmse|r2|confidence|precision|recall)\b/gi,
      /\b(mean|median|average|std|standard deviation|variance|quartile(s)?)\b/gi,
    ],
    action: [
      /\b(forecast|predict|analyze|describe|clean|remove|impute|transform)\b/gi,
    ],
    modelType: [
      /\b(prophet|xgboost|lightgbm|arima|lstm|neural network)\b/gi,
    ],
  };

  /**
   * Analyze user message and classify intent
   */
  analyze(message: string, context: UserContext): Intent {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Classify intent type
    const intentType = this.classifyIntent(normalizedMessage, context);
    
    // Extract entities
    const entities = this.extractEntities(message);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(intentType, normalizedMessage, entities, context);
    
    // Determine if workflow is required
    const requiresWorkflow = this.determineWorkflowRequirement(intentType, context);
    
    // Identify target agents
    const targetAgents = this.identifyTargetAgents(intentType, context);
    
    // Generate contextual hints
    const contextualHints = this.generateContextualHints(intentType, entities, context);
    
    return {
      type: intentType,
      confidence,
      entities,
      requiresWorkflow,
      targetAgents,
      contextualHints,
    };
  }

  /**
   * Classify the intent type based on pattern matching
   */
  private classifyIntent(message: string, context: UserContext): IntentType {
    const scores: Map<IntentType, number> = new Map();
    
    // Score each intent type based on pattern matches
    scores.set(IntentType.DATA_DESCRIPTION, this.scorePatterns(message, this.patterns.dataDescription));
    scores.set(IntentType.DETAILED_EDA, this.scorePatterns(message, this.patterns.detailedEDA));
    scores.set(IntentType.OUTLIER_DETECTION, this.scorePatterns(message, this.patterns.outlierDetection));
    scores.set(IntentType.PREPROCESSING, this.scorePatterns(message, this.patterns.preprocessing));
    scores.set(IntentType.MODEL_TRAINING, this.scorePatterns(message, this.patterns.modelTraining));
    scores.set(IntentType.FORECASTING_EXECUTION, this.scorePatterns(message, this.patterns.forecastingExecution));
    scores.set(IntentType.FORECASTING_ANALYSIS, this.scorePatterns(message, this.patterns.forecastingAnalysis));
    scores.set(IntentType.INSIGHTS_REQUEST, this.scorePatterns(message, this.patterns.insightsRequest));
    
    // Apply context-based adjustments
    this.applyContextualAdjustments(scores, context);
    
    // Find the highest scoring intent
    let maxScore = 0;
    let bestIntent = IntentType.GENERAL_QUERY;
    
    Array.from(scores.entries()).forEach(([intent, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    });
    
    // Return GENERAL_QUERY if no strong match found
    return maxScore > 0.3 ? bestIntent : IntentType.GENERAL_QUERY;
  }

  /**
   * Score a message against a set of patterns
   */
  private scorePatterns(message: string, patterns: RegExp[]): number {
    let score = 0;
    let matchCount = 0;
    
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matchCount++;
        // Give higher weight to earlier patterns (more specific)
        score += 1.0 / (matchCount * 0.5 + 0.5);
      }
    }
    
    return score;
  }

  /**
   * Apply contextual adjustments to intent scores
   */
  private applyContextualAdjustments(scores: Map<IntentType, number>, context: UserContext): void {
    // If user has forecast results, boost forecasting analysis over execution
    if (context.hasForecastResults) {
      const analysisScore = scores.get(IntentType.FORECASTING_ANALYSIS) || 0;
      const executionScore = scores.get(IntentType.FORECASTING_EXECUTION) || 0;
      
      // Boost analysis if scores are close
      if (Math.abs(analysisScore - executionScore) < 0.3) {
        scores.set(IntentType.FORECASTING_ANALYSIS, analysisScore * 1.5);
      }
    }
    
    // If user has outlier analysis, boost preprocessing
    if (context.hasOutlierAnalysis) {
      const preprocessingScore = scores.get(IntentType.PREPROCESSING) || 0;
      scores.set(IntentType.PREPROCESSING, preprocessingScore * 1.3);
    }
    
    // If no data uploaded, reduce data-dependent intents
    if (!context.hasUploadedData) {
      scores.set(IntentType.DATA_DESCRIPTION, (scores.get(IntentType.DATA_DESCRIPTION) || 0) * 0.5);
      scores.set(IntentType.OUTLIER_DETECTION, (scores.get(IntentType.OUTLIER_DETECTION) || 0) * 0.5);
      scores.set(IntentType.FORECASTING_EXECUTION, (scores.get(IntentType.FORECASTING_EXECUTION) || 0) * 0.5);
    }
  }

  /**
   * Extract entities from the message
   */
  private extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];
    
    // Extract time periods
    for (const pattern of this.entityPatterns.timePeriod) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'time_period',
          value: match[0],
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }
    
    // Extract metrics
    for (const pattern of this.entityPatterns.metric) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'metric',
          value: match[0],
          confidence: 0.85,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }
    
    // Extract actions
    for (const pattern of this.entityPatterns.action) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'action',
          value: match[0],
          confidence: 0.8,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }
    
    // Extract model types
    for (const pattern of this.entityPatterns.modelType) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'model_type',
          value: match[0],
          confidence: 0.95,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }
    
    return entities;
  }

  /**
   * Calculate confidence score for the intent classification
   */
  private calculateConfidence(
    intentType: IntentType,
    message: string,
    entities: Entity[],
    context: UserContext
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on entity extraction
    if (entities.length > 0) {
      confidence += Math.min(entities.length * 0.1, 0.3);
    }
    
    // Boost confidence for specific intent types with strong patterns
    const patternMap: Record<IntentType, RegExp[]> = {
      [IntentType.DATA_DESCRIPTION]: this.patterns.dataDescription,
      [IntentType.OUTLIER_DETECTION]: this.patterns.outlierDetection,
      [IntentType.PREPROCESSING]: this.patterns.preprocessing,
      [IntentType.MODEL_TRAINING]: this.patterns.modelTraining,
      [IntentType.FORECASTING_EXECUTION]: this.patterns.forecastingExecution,
      [IntentType.FORECASTING_ANALYSIS]: this.patterns.forecastingAnalysis,
      [IntentType.INSIGHTS_REQUEST]: this.patterns.insightsRequest,
      [IntentType.GENERAL_QUERY]: [],
    };
    
    const patterns = patternMap[intentType];
    const matchCount = patterns.filter(p => p.test(message)).length;
    
    if (matchCount > 0) {
      confidence += Math.min(matchCount * 0.15, 0.4);
    }
    
    // Adjust based on context alignment
    if (this.isContextAligned(intentType, context)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Check if intent aligns with current context
   */
  private isContextAligned(intentType: IntentType, context: UserContext): boolean {
    switch (intentType) {
      case IntentType.FORECASTING_ANALYSIS:
        return context.hasForecastResults;
      case IntentType.PREPROCESSING:
        return context.hasOutlierAnalysis;
      case IntentType.DATA_DESCRIPTION:
      case IntentType.OUTLIER_DETECTION:
        return context.hasUploadedData;
      default:
        return true;
    }
  }

  /**
   * Determine if the intent requires workflow execution
   */
  private determineWorkflowRequirement(intentType: IntentType, context: UserContext): boolean {
    switch (intentType) {
      case IntentType.FORECASTING_EXECUTION:
        return true;
      case IntentType.MODEL_TRAINING:
        return true;
      case IntentType.OUTLIER_DETECTION:
        return !context.hasOutlierAnalysis;
      case IntentType.PREPROCESSING:
        return true;
      case IntentType.DATA_DESCRIPTION:
      case IntentType.FORECASTING_ANALYSIS:
      case IntentType.INSIGHTS_REQUEST:
      case IntentType.GENERAL_QUERY:
        return false;
      default:
        return false;
    }
  }

  /**
   * Identify target agents for the intent
   */
  private identifyTargetAgents(intentType: IntentType, context: UserContext): string[] {
    const agentMap: Record<IntentType, string[]> = {
      [IntentType.DATA_DESCRIPTION]: ['eda_agent'],
      [IntentType.DETAILED_EDA]: ['eda_agent'],
      [IntentType.OUTLIER_DETECTION]: ['outlier_detection_agent'],
      [IntentType.PREPROCESSING]: ['preprocessing_agent'],
      [IntentType.MODEL_TRAINING]: ['model_training_agent'],
      [IntentType.FORECASTING_EXECUTION]: ['forecasting_agent', 'validation_agent'],
      [IntentType.FORECASTING_ANALYSIS]: ['bi_analyst_agent'],
      [IntentType.INSIGHTS_REQUEST]: ['insights_agent', 'bi_analyst_agent'],
      [IntentType.VISUALIZE_DATA]: ['visualization_agent'],
      [IntentType.GENERAL_QUERY]: ['general_agent'],
    };
    
    return agentMap[intentType] || ['general_agent'];
  }

  /**
   * Generate contextual hints for the orchestrator
   */
  private generateContextualHints(
    intentType: IntentType,
    entities: Entity[],
    context: UserContext
  ): string[] {
    const hints: string[] = [];
    
    // Add hints based on intent type
    switch (intentType) {
      case IntentType.FORECASTING_ANALYSIS:
        if (context.hasForecastResults) {
          hints.push('use_existing_forecast_results');
          hints.push('avoid_workflow_trigger');
        }
        break;
      case IntentType.FORECASTING_EXECUTION:
        hints.push('trigger_forecasting_workflow');
        break;
      case IntentType.DATA_DESCRIPTION:
        hints.push('exclude_outlier_analysis');
        hints.push('focus_on_basic_statistics');
        hints.push('simple_exploration_only');
        break;
      case IntentType.DETAILED_EDA:
        hints.push('comprehensive_analysis');
        hints.push('include_outlier_analysis');
        hints.push('detailed_patterns');
        break;
      case IntentType.OUTLIER_DETECTION:
        hints.push('activate_outlier_detection');
        hints.push('detailed_outlier_info');
        hints.push('prepare_visualization_with_outliers');
        break;
      case IntentType.VISUALIZE_DATA:
        hints.push('show_visualization');
        hints.push('highlight_outliers_if_detected');
        break;
      case IntentType.MODEL_TRAINING:
        hints.push('show_training_form_first');
        hints.push('collect_parameters');
        break;
      case IntentType.PREPROCESSING:
        hints.push('provide_step_by_step_guidance');
        hints.push('suggest_multiple_options');
        break;
    }
    
    // Add hints based on extracted entities
    const hasTimePeriod = entities.some(e => e.type === 'time_period');
    if (hasTimePeriod && intentType === IntentType.FORECASTING_EXECUTION) {
      hints.push('custom_forecast_horizon');
    }
    
    const hasModelType = entities.some(e => e.type === 'model_type');
    if (hasModelType) {
      hints.push('specific_model_requested');
    }
    
    return hints;
  }

  /**
   * Helper method to create user context from app state
   */
  static createContextFromAppState(state: AppState): UserContext {
    const selectedBu = state.businessUnits.find(bu => bu.id === state.selectedBuId);
    const selectedLob = selectedBu?.lobs.find(lob => lob.id === state.selectedLobId);
    
    return {
      hasUploadedData: selectedLob?.hasData || false,
      hasForecastResults: state.analyzedData.hasForecasting || false,
      hasOutlierAnalysis: state.analyzedData.outliers.length > 0,
      recentIntents: [],
      currentWorkflowPhase: state.analyzedData.lastAnalysisType || undefined,
    };
  }
}
