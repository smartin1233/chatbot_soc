/**
 * Follow-up Questions Service - Generates contextual clarifying questions before analysis
 */

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text_input' | 'number_input';
  options?: string[];
  required: boolean;
  category: string;
}

export interface AnalysisRequirements {
  analysisType: string;
  questions: FollowUpQuestion[];
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

export interface UserResponse {
  questionId: string;
  answer: string | string[] | number;
}

export class FollowUpQuestionsService {

  /**
   * Analyze user message and determine if follow-up questions are needed
   * Only triggers for requests that have meaningful customization options
   * 
   * NOTE: Model training/forecasting requests should use the ModelTrainingForm instead
   */
  needsFollowUpQuestions(message: string, context?: any): boolean {
    const lowerMessage = message.toLowerCase();

    // NEVER trigger for model training or forecast generation - these use ModelTrainingForm
    const usesModelTrainingForm = [
      /(run|start|generate|create)\s+(a\s+)?forecast/i,
      /(train|build).*?(model|ml|machine learning).*?(forecast|predict)/i,
      /(forecast|predict).*?(train|build).*?(model)/i,
      /model.*?training/i
    ];

    if (usesModelTrainingForm.some(pattern => pattern.test(message))) {
      return false; // Use ModelTrainingForm instead
    }

    // Only trigger for specific scenarios with customization options
    const customizableScenarios = [
      // Business insights with specific objectives
      /(business|strategic).*?(insight|recommendation|analysis)/i,
      /(insight|recommendation).*?(business|strategic)/i,

      // Data exploration with specific focus
      /(explore|eda).*?(approach|method|focus|type)/i,
      /(analyze|analysis).*?(data|patterns|trends)/i
    ];

    // Check if any customizable scenario matches
    const hasCustomizableScenario = customizableScenarios.some(pattern => pattern.test(message));

    // Additional checks for complexity that warrants customization
    const hasComplexityIndicators = [
      'business', 'strategic', 'planning', 'insight', 'recommendation',
      'explore', 'analysis', 'patterns', 'trends'
    ].some(keyword => lowerMessage.includes(keyword));

    return hasCustomizableScenario && hasComplexityIndicators;
  }

  /**
   * Generate follow-up questions based on user intent
   */
  generateFollowUpQuestions(message: string, context?: any): AnalysisRequirements | null {
    const lowerMessage = message.toLowerCase();
    const analysisType = this.detectAnalysisType(message);

    if (!analysisType) {
      return null;
    }

    switch (analysisType) {
      case 'data_exploration':
        return this.generateExplorationQuestions();
      case 'business_insights':
        return this.generateBusinessInsightsQuestions();
      default:
        return null;
    }
  }

  private detectAnalysisType(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // NOTE: Forecasting and modeling use ModelTrainingForm, not follow-up questions

    // Business insights detection - only for strategic business requests
    if (/(business|strategic).*?(insight|recommendation|analysis)/i.test(message)) {
      return 'business_insights';
    }

    // Data exploration - only if asking for specific exploration approaches
    if (/(explore|eda|analyze).*?(approach|method|focus|type|data|patterns)/i.test(message)) {
      return 'data_exploration';
    }

    return null;
  }



  private generateExplorationQuestions(): AnalysisRequirements {
    return {
      analysisType: 'data_exploration',
      priority: 'medium',
      estimatedTime: '2-3 minutes',
      questions: [
        {
          id: 'exploration_focus',
          question: 'What aspects of your data are you most interested in?',
          type: 'multiple_choice',
          options: [
            'Data quality assessment',
            'Trend analysis',
            'Seasonal patterns',
            'Outlier detection',
            'Statistical summaries',
            'Correlation analysis',
            'Distribution analysis'
          ],
          required: true,
          category: 'focus'
        },
        {
          id: 'data_period',
          question: 'What time period should I focus the analysis on?',
          type: 'single_choice',
          options: [
            'All available data',
            'Last 30 days',
            'Last 90 days',
            'Last 6 months',
            'Last 12 months',
            'Custom period'
          ],
          required: true,
          category: 'timeline'
        },
        {
          id: 'visualization_preference',
          question: 'What type of visualizations would be most helpful?',
          type: 'multiple_choice',
          options: [
            'Time series charts',
            'Statistical histograms',
            'Correlation heatmaps',
            'Box plots',
            'Scatter plots',
            'Trend decomposition',
            'Summary tables only'
          ],
          required: false,
          category: 'presentation'
        },
        {
          id: 'specific_concerns',
          question: 'Do you have any specific data quality concerns?',
          type: 'multiple_choice',
          options: [
            'Missing data points',
            'Unusual values/outliers',
            'Data consistency',
            'Seasonal irregularities',
            'Recent trend changes',
            'No specific concerns'
          ],
          required: false,
          category: 'quality'
        }
      ]
    };
  }





  private generateBusinessInsightsQuestions(): AnalysisRequirements {
    return {
      analysisType: 'business_insights',
      priority: 'medium',
      estimatedTime: '2-4 minutes',
      questions: [
        {
          id: 'insight_focus',
          question: 'What type of business insights are you looking for?',
          type: 'multiple_choice',
          options: [
            'Growth opportunities',
            'Cost reduction opportunities',
            'Risk identification',
            'Market trends',
            'Operational efficiency',
            'Customer behavior patterns',
            'Performance benchmarks'
          ],
          required: true,
          category: 'focus'
        },
        {
          id: 'business_domain',
          question: 'What\'s your primary business domain?',
          type: 'single_choice',
          options: [
            'Sales & Revenue',
            'Operations & Supply Chain',
            'Marketing & Customer Acquisition',
            'Finance & Risk Management',
            'Product Development',
            'Human Resources',
            'Other'
          ],
          required: true,
          category: 'domain'
        },
        {
          id: 'action_orientation',
          question: 'What level of actionable recommendations do you need?',
          type: 'single_choice',
          options: [
            'High-level strategic guidance',
            'Specific actionable steps',
            'Detailed implementation plans',
            'Just insights and observations',
            'Mix of strategic and tactical'
          ],
          required: true,
          category: 'actionability'
        },
        {
          id: 'competitive_context',
          question: 'Should I consider competitive or market factors?',
          type: 'single_choice',
          options: [
            'Yes, include market benchmarks',
            'Focus on internal performance only',
            'Compare to industry standards',
            'No external context needed'
          ],
          required: false,
          category: 'context'
        }
      ]
    };
  }

  /**
   * Validate user responses to follow-up questions
   */
  validateResponses(questions: FollowUpQuestion[], responses: UserResponse[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const responseMap = new Map(responses.map(r => [r.questionId, r]));

    // Check required questions
    questions.forEach(question => {
      if (question.required && !responseMap.has(question.id)) {
        errors.push(`Please answer the required question: ${question.question}`);
      }

      const response = responseMap.get(question.id);
      if (response && question.type === 'single_choice' && question.options) {
        if (typeof response.answer === 'string' && !question.options.includes(response.answer)) {
          errors.push(`Invalid option selected for: ${question.question}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate analysis prompt based on user responses
   */
  generateAnalysisPrompt(
    analysisType: string,
    responses: UserResponse[],
    originalMessage: string
  ): string {
    const responseMap = new Map(responses.map(r => [r.questionId, r]));

    let prompt = `User requested: ${originalMessage}\n\nAnalysis Configuration:\n`;

    switch (analysisType) {
      case 'data_exploration':
        prompt += this.generateExplorationPrompt(responseMap);
        break;
      case 'business_insights':
        prompt += this.generateBusinessInsightsPrompt(responseMap);
        break;
    }

    return prompt;
  }



  private generateExplorationPrompt(responses: Map<string, UserResponse>): string {
    const focus = responses.get('exploration_focus')?.answer || [];
    const period = responses.get('data_period')?.answer || 'All available data';
    const visualizations = responses.get('visualization_preference')?.answer || [];
    const concerns = responses.get('specific_concerns')?.answer || [];

    return `
Data Exploration Specifications:
- Analysis Focus: ${Array.isArray(focus) ? focus.join(', ') : focus}
- Time Period: ${period}
- Visualizations Needed: ${Array.isArray(visualizations) ? visualizations.join(', ') : visualizations}
- Specific Concerns: ${Array.isArray(concerns) ? concerns.join(', ') : concerns}

Please conduct thorough exploratory data analysis with focus on these areas.`;
  }





  private generateBusinessInsightsPrompt(responses: Map<string, UserResponse>): string {
    const focus = responses.get('insight_focus')?.answer || [];
    const domain = responses.get('business_domain')?.answer || 'Sales & Revenue';
    const actionOrientation = responses.get('action_orientation')?.answer || 'Specific actionable steps';
    const competitive = responses.get('competitive_context')?.answer || 'Focus on internal performance';

    return `
Business Insights Specifications:
- Insight Focus: ${Array.isArray(focus) ? focus.join(', ') : focus}
- Business Domain: ${domain}
- Action Level: ${actionOrientation}
- Competitive Context: ${competitive}

Please generate strategic business insights with actionable recommendations.`;
  }
}

export const followUpQuestionsService = new FollowUpQuestionsService();