/**
 * Business Question Router
 * Routes follow-up questions about forecasts to the appropriate agent
 */

export interface QuestionContext {
  hasForecastResults: boolean;
  hasActualData: boolean;
  forecastMetrics?: any;
  lastAnalysisType?: string;
}

export interface RoutingResult {
  agent: string;
  hints: string[];
  requiresContext: string[];
}

export class BusinessQuestionRouter {
  /**
   * Route a user question to the appropriate agent
   */
  route(question: string, context: QuestionContext): RoutingResult {
    const lowerQuestion = question.toLowerCase();

    // Decision-making questions
    if (this.isDecisionQuestion(lowerQuestion)) {
      return {
        agent: 'business_insights',
        hints: ['provide_actionable_decisions', 'use_forecast_data', 'include_costs_and_timelines'],
        requiresContext: ['forecast_results', 'actual_data', 'business_unit', 'lob']
      };
    }

    // Forecast vs Actual comparison
    if (this.isComparisonQuestion(lowerQuestion)) {
      return {
        agent: 'business_insights',
        hints: ['compare_forecast_actual', 'analyze_accuracy', 'identify_gaps'],
        requiresContext: ['forecast_results', 'actual_data']
      };
    }

    // Business outcomes and impact
    if (this.isOutcomeQuestion(lowerQuestion)) {
      return {
        agent: 'business_insights',
        hints: ['analyze_business_impact', 'quantify_outcomes', 'assess_risks_opportunities'],
        requiresContext: ['forecast_results', 'business_unit', 'lob']
      };
    }

    // What-if scenarios
    if (this.isScenarioQuestion(lowerQuestion)) {
      return {
        agent: 'business_insights',
        hints: ['scenario_analysis', 'calculate_alternatives', 'provide_recommendations'],
        requiresContext: ['forecast_results', 'actual_data']
      };
    }

    // Forecast interpretation
    if (this.isForecastInterpretation(lowerQuestion)) {
      return {
        agent: 'business_insights',
        hints: ['interpret_forecast', 'explain_implications', 'suggest_actions'],
        requiresContext: ['forecast_results']
      };
    }

    // General insights
    if (this.isInsightRequest(lowerQuestion)) {
      return {
        agent: 'insights',
        hints: ['generate_insights', 'identify_opportunities'],
        requiresContext: ['forecast_results', 'actual_data']
      };
    }

    // Default to general agent
    return {
      agent: 'general',
      hints: [],
      requiresContext: []
    };
  }

  /**
   * Check if question is about decisions
   */
  private isDecisionQuestion(question: string): boolean {
    const patterns = [
      /what\s+(decisions?|actions?|steps?)\s+(can|should|do)\s+i\s+take/i,
      /what\s+should\s+i\s+do\s+(with|about|based\s+on)/i,
      /how\s+(can|should)\s+i\s+(use|leverage|act\s+on)/i,
      /recommend(ations?|ed)?\s+(actions?|decisions?|steps?)/i,
      /what\s+(are\s+)?my\s+options/i,
      /what\s+actions?\s+to\s+take/i,
    ];
    return patterns.some(p => p.test(question));
  }

  /**
   * Check if question is comparing forecast vs actual
   */
  private isComparisonQuestion(question: string): boolean {
    const patterns = [
      /forecast\s+(vs|versus|compared\s+to|against)\s+actual/i,
      /actual\s+(vs|versus|compared\s+to|against)\s+forecast/i,
      /how\s+(accurate|reliable)\s+is\s+(the\s+)?forecast/i,
      /compare\s+(forecast|prediction)\s+(with|to|and)\s+actual/i,
      /difference\s+between\s+forecast\s+and\s+actual/i,
      /forecast\s+(accuracy|performance|reliability)/i,
    ];
    return patterns.some(p => p.test(question));
  }

  /**
   * Check if question is about business outcomes
   */
  private isOutcomeQuestion(question: string): boolean {
    const patterns = [
      /business\s+(outcome|impact|result|implication)/i,
      /what\s+(does|will)\s+this\s+mean\s+for\s+(my\s+)?business/i,
      /how\s+(will|does)\s+this\s+(affect|impact)\s+(my\s+)?(business|revenue|profit)/i,
      /expected\s+(outcome|result|impact)/i,
      /business\s+implications?/i,
      /what\s+(is|are)\s+the\s+(business\s+)?(impact|effect|consequence)/i,
    ];
    return patterns.some(p => p.test(question));
  }

  /**
   * Check if question is a what-if scenario
   */
  private isScenarioQuestion(question: string): boolean {
    const patterns = [
      /what\s+if/i,
      /scenario\s+(analysis|planning)/i,
      /if\s+.+\s+(happens?|occurs?|increases?|decreases?)/i,
      /suppose\s+(that\s+)?/i,
      /assuming\s+(that\s+)?/i,
      /in\s+case\s+(of\s+)?/i,
    ];
    return patterns.some(p => p.test(question));
  }

  /**
   * Check if question is asking for forecast interpretation
   */
  private isForecastInterpretation(question: string): boolean {
    const patterns = [
      /what\s+does\s+(the\s+)?forecast\s+(mean|show|tell|indicate)/i,
      /explain\s+(the\s+)?forecast/i,
      /interpret\s+(the\s+)?forecast/i,
      /understand\s+(the\s+)?forecast/i,
      /forecast\s+(means?|shows?|tells?|indicates?)/i,
    ];
    return patterns.some(p => p.test(question));
  }

  /**
   * Check if question is a general insight request
   */
  private isInsightRequest(question: string): boolean {
    const patterns = [
      /insights?/i,
      /key\s+(findings?|takeaways?|points?)/i,
      /what\s+(should|can)\s+i\s+know/i,
      /tell\s+me\s+(about|more)/i,
      /summary/i,
    ];
    return patterns.some(p => p.test(question));
  }

  /**
   * Check if context is sufficient for the question
   */
  hasRequiredContext(routing: RoutingResult, context: QuestionContext): {
    sufficient: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    for (const requirement of routing.requiresContext) {
      switch (requirement) {
        case 'forecast_results':
          if (!context.hasForecastResults) {
            missing.push('forecast results');
          }
          break;
        case 'actual_data':
          if (!context.hasActualData) {
            missing.push('actual data');
          }
          break;
      }
    }

    return {
      sufficient: missing.length === 0,
      missing
    };
  }

  /**
   * Generate a helpful message when context is missing
   */
  generateMissingContextMessage(missing: string[]): string {
    return `To answer this question, I need ${missing.join(' and ')}. Please:

${missing.includes('forecast results') ? '• Generate a forecast first by clicking "Generate Forecast"\n' : ''}${missing.includes('actual data') ? '• Upload your data if you haven\'t already\n' : ''}
Then ask your question again!`;
  }
}

// Singleton instance
export const businessQuestionRouter = new BusinessQuestionRouter();
