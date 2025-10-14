/**
 * Dynamic Suggestion Generator
 * Provides contextually relevant suggestions based on user activity and current state
 */

export interface UserActivity {
  hasSelectedBU: boolean;
  hasSelectedLOB: boolean;
  hasUploadedData: boolean;
  hasPerformedEDA: boolean;
  hasPreprocessed: boolean;
  hasTrainedModels: boolean;
  hasGeneratedForecast: boolean;
  hasViewedInsights: boolean;
  hasCalculatedCapacity?: boolean;
  lastAction: string;
  dataQuality?: number;
  recordCount?: number;
}

export interface SuggestionContext {
  userActivity: UserActivity;
  currentRequest?: string;
  currentResponse?: string;
  agentType?: string;
  hasErrors?: boolean;
}

export class DynamicSuggestionGenerator {
  /**
   * Generate contextually relevant suggestions based on current state
   */
  generateSuggestions(context: SuggestionContext): string[] {
    const { userActivity, currentRequest, agentType, hasErrors } = context;

    // Error state - recovery suggestions
    if (hasErrors) {
      return this.getErrorRecoverySuggestions(userActivity);
    }

    // Initial state - no BU/LOB selected
    if (!userActivity.hasSelectedBU || !userActivity.hasSelectedLOB) {
      return this.getInitialSuggestions();
    }

    // BU/LOB selected but no data
    if (!userActivity.hasUploadedData) {
      return this.getDataUploadSuggestions();
    }

    // PRIORITY: Check what's been completed and suggest next steps
    // This ensures we never suggest something already done

    // If forecast is complete, suggest post-forecast actions
    if (userActivity.hasGeneratedForecast) {
      const suggestions: string[] = [];
      
      // Suggest capacity planning first (if not already done)
      if (!userActivity.hasCalculatedCapacity) {
        suggestions.push('Calculate required headcount');
        suggestions.push('Plan capacity needs');
      }
      
      if (!userActivity.hasViewedInsights) {
        suggestions.push('Generate business insights');
      }

      suggestions.push('Analyze forecast trends');
      suggestions.push('Run scenario analysis');
      return suggestions.slice(0, 4);
    }

    // If models are trained but no forecast, suggest forecasting
    if (userActivity.hasTrainedModels && !userActivity.hasGeneratedForecast) {
      return [
        'Generate 30-day forecast',
        'Create forecast predictions',
        'View model performance',
        'Compare models'
      ];
    }

    // If preprocessing done but no models, suggest modeling
    if (userActivity.hasPreprocessed && !userActivity.hasTrainedModels) {
      return [
        'Train ML models',
        'Run complete forecast',
        'Compare algorithms',
        'Validate data quality'
      ];
    }

    // If EDA done but no preprocessing, suggest next steps
    if (userActivity.hasPerformedEDA && !userActivity.hasPreprocessed) {
      return [
        'Clean and preprocess data',
        'Run complete forecast',
        'Check for anomaly/outliers',
        'Engineer features'
      ];
    }

    // If data uploaded but no EDA, suggest EDA
    if (userActivity.hasUploadedData && !userActivity.hasPerformedEDA) {
      return this.getEDASuggestions();
    }

    // Agent-specific suggestions as fallback
    if (agentType) {
      return this.getAgentSpecificSuggestions(agentType, userActivity);
    }

    // Default advanced suggestions
    return this.getAdvancedSuggestions(userActivity);
  }

  /**
   * Initial suggestions when starting
   */
  private getInitialSuggestions(): string[] {
    return [
      'Create Business Unit',
      'Create Line of Business',
      'View existing BU/LOBs',
      'Help me get started'
    ];
  }

  /**
   * Suggestions for data upload phase
   */
  private getDataUploadSuggestions(): string[] {
    return [
      'Upload CSV/Excel data',
      'Download data template',
      'View data requirements',
      'Use sample data'
    ];
  }

  /**
   * Suggestions for EDA phase
   */
  private getEDASuggestions(): string[] {
    return [
      'Explore data quality',
      'Analyze patterns and trends',
      'Check for seasonality',
      'Identify outliers'
    ];
  }

  /**
   * Suggestions for preprocessing phase
   */
  private getPreprocessingSuggestions(): string[] {
    return [
      'Clean and preprocess data',
      'Handle missing values',
      'Treat outliers',
      'Engineer features'
    ];
  }

  /**
   * Suggestions for forecasting phase
   */
  private getForecastingSuggestions(): string[] {
    return [
      'Run forecast analysis',
      'Generate 30-day forecast',
      'Train ML models',
      'Compare model performance'
    ];
  }

  /**
   * Suggestions for insights phase
   */
  private getInsightsSuggestions(): string[] {
    return [
      'Generate business insights',
      'View forecast details',

      'Plan based on forecast'
    ];
  }

  /**
   * Agent-specific suggestions with variation - NEVER suggest completed steps
   */
  private getAgentSpecificSuggestions(agentType: string, activity: UserActivity): string[] {
    const suggestions: string[] = [];

    switch (agentType) {
      case 'eda':
        // After EDA, suggest next logical steps (NOT EDA again)
        if (!activity.hasPreprocessed) {
          suggestions.push('Clean and preprocess data');
        }
        if (!activity.hasTrainedModels && !activity.hasGeneratedForecast) {
          suggestions.push('Train ML models');
        }
        if (!activity.hasGeneratedForecast) {
          suggestions.push('Run complete forecast');
        }
        suggestions.push('Analyze specific patterns');
        break;

      case 'preprocessing':
        // After preprocessing, suggest modeling/forecasting (NOT preprocessing again)
        if (!activity.hasTrainedModels) {
          suggestions.push('Train forecasting models');
        }
        if (!activity.hasGeneratedForecast) {
          suggestions.push('Generate 30-day forecast');
        }
        suggestions.push('Validate preprocessing results');
        suggestions.push('Check data quality improvements');
        break;

      case 'modeling':
        // After modeling, suggest forecasting/insights (NOT modeling again)
        if (!activity.hasGeneratedForecast) {
          suggestions.push('Generate forecast predictions');
        }
        if (!activity.hasViewedInsights) {
          suggestions.push('Generate business insights');
        }
        suggestions.push('Compare model performance');
        suggestions.push('View model details');
        break;

      case 'forecasting':
        // After forecasting, suggest insights/export (NOT forecasting again)
        if (!activity.hasCalculatedCapacity) {
          suggestions.push('Calculate required headcount');
          suggestions.push('Plan capacity with forecasted volumes');
        }
        if (!activity.hasViewedInsights) {
          suggestions.push('Generate business insights');
        }

        suggestions.push('Analyze forecast trends');
        suggestions.push('View confidence intervals');
        break;

      case 'validation':
        if (!activity.hasGeneratedForecast) {
          suggestions.push('Generate forecast');
        }
        suggestions.push('Review validation metrics');
        suggestions.push('Compare with baseline');
        suggestions.push('Check model robustness');
        break;

      case 'insights':
        // After insights, suggest new analysis or export
        suggestions.push('Export insights report');
        suggestions.push('Analyze different LOB');
        suggestions.push('Run scenario analysis');
        suggestions.push('Create action plan');
        break;

      default:
        return this.getAdvancedSuggestions(activity);
    }

    // Return only 4 unique suggestions
    return [...new Set(suggestions)].slice(0, 4);
  }

  /**
   * Advanced suggestions for experienced users
   */
  private getAdvancedSuggestions(activity: UserActivity): string[] {
    const suggestions: string[] = [];

    if (activity.hasGeneratedForecast) {
      suggestions.push('Run scenario analysis');
      suggestions.push('Compare with historical');
    }

    if (activity.hasTrainedModels) {
      suggestions.push('Optimize hyperparameters');
      suggestions.push('Try ensemble models');
    }

    suggestions.push('Analyze different LOB');
    suggestions.push('Export all results');

    return suggestions;
  }

  /**
   * Error recovery suggestions
   */
  private getErrorRecoverySuggestions(activity: UserActivity): string[] {
    if (!activity.hasUploadedData) {
      return [
        'Upload data again',
        'Check data format',
        'Download template',
        'Get help'
      ];
    }

    return [
      'Try again',
      'Check data quality',
      'View error details',
      'Get help'
    ];
  }

  /**
   * Generate suggestions based on user's question with more variety
   */
  generateFromQuestion(question: string, activity: UserActivity): string[] {
    const lowerQuestion = question.toLowerCase();

    // Data quality questions
    if (lowerQuestion.includes('quality') || lowerQuestion.includes('clean')) {
      const suggestions = ['Explore data quality'];
      if (!activity.hasPreprocessed) suggestions.push('Clean and preprocess data');
      suggestions.push('Identify data issues');
      if (!activity.hasGeneratedForecast) suggestions.push('Run forecast after cleaning');
      return suggestions.slice(0, 4);
    }

    // Pattern/trend questions
    if (lowerQuestion.includes('pattern') || lowerQuestion.includes('trend') || lowerQuestion.includes('seasonal')) {
      const suggestions = ['Analyze trend patterns'];
      if (!activity.hasPerformedEDA) suggestions.push('Perform full EDA');
      suggestions.push('Check for seasonality');
      if (!activity.hasGeneratedForecast) suggestions.push('Generate forecast');
      return suggestions.slice(0, 4);
    }

    // Forecasting questions
    if (lowerQuestion.includes('forecast') || lowerQuestion.includes('predict') || lowerQuestion.includes('future')) {
      const suggestions = [];
      if (!activity.hasTrainedModels) suggestions.push('Train models first');
      suggestions.push('Generate 30-day forecast');
      suggestions.push('View forecast confidence');
      if (!activity.hasViewedInsights) suggestions.push('Get business insights');
      return suggestions.slice(0, 4);
    }

    // Model questions
    if (lowerQuestion.includes('model') || lowerQuestion.includes('train') || lowerQuestion.includes('accuracy')) {
      const suggestions = ['Train ML models'];
      suggestions.push('Compare model accuracy');
      suggestions.push('Validate on test data');
      if (!activity.hasGeneratedForecast) suggestions.push('Generate forecast');
      return suggestions.slice(0, 4);
    }

    // Business questions
    if (lowerQuestion.includes('business') || lowerQuestion.includes('insight') || lowerQuestion.includes('recommend')) {
      const suggestions = ['Generate business insights'];
      if (activity.hasGeneratedForecast) suggestions.push('Analyze forecast impact');
      suggestions.push('View recommendations');
      suggestions.push('Create action plan');
      return suggestions.slice(0, 4);
    }

    // Default to context-based suggestions
    return this.generateSuggestions({ userActivity: activity });
  }

  /**
   * Get workflow-based suggestions (what should come next)
   */
  getNextStepSuggestions(activity: UserActivity): string[] {
    // Follow the natural workflow
    if (!activity.hasSelectedBU || !activity.hasSelectedLOB) {
      return ['Select Business Unit and LOB'];
    }

    if (!activity.hasUploadedData) {
      return ['Upload your data'];
    }

    if (!activity.hasPerformedEDA) {
      return ['Explore data quality and patterns'];
    }

    if (!activity.hasPreprocessed && activity.dataQuality && activity.dataQuality < 90) {
      return ['Clean and preprocess data'];
    }

    if (!activity.hasGeneratedForecast) {
      return ['Run forecast analysis'];
    }

    if (!activity.hasViewedInsights) {
      return ['Generate business insights'];
    }

    return ['Analyze different LOB', 'Export results', 'Run new analysis'];
  }
}

// Singleton instance
export const dynamicSuggestionGenerator = new DynamicSuggestionGenerator();
