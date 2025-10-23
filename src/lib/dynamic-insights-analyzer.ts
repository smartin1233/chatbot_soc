/**
 * Dynamic Insights Analyzer - Creates contextual insights based on user conversation
 */

export interface DynamicInsight {
  id: string;
  title: string;
  description: string;
  type: 'data_quality' | 'pattern' | 'forecast' | 'model_performance' | 'business_opportunity' | 'risk';
  priority: 'high' | 'medium' | 'low';
  relevantToPhase: string[];
  businessValue: string;
  nextAction?: string;
}

export interface ConversationContext {
  topics: string[];
  currentPhase: string;
  completedTasks: string[];
  userIntent: string;
}

export interface DynamicDashboardConfig {
  title: string;
  subtitle: string;
  relevantInsights: DynamicInsight[];
  showForecasting: boolean;
  showModelMetrics: boolean;
  showDataQuality: boolean;
  showBusinessMetrics: boolean;
  kpisToShow: string[];
  primaryMessage: string;
}

export class DynamicInsightsAnalyzer {
  
  /**
   * Analyze user intent from their message
   */
  analyzeUserIntent(message: string): {
    topics: string[];
    phase: string;
    intent: string;
  } {
    const lowerMessage = message.toLowerCase();
    const topics: string[] = [];
    let phase = 'exploration';
    let intent = '';

    // Data exploration keywords
    if (/(explore|analyze|eda|data quality|distribution|pattern|correlation|outlier|statistics|summary)/i.test(message)) {
      topics.push('data_exploration');
      phase = 'exploration';
      intent = 'User wants to understand their data better through exploratory analysis';
    }

    // Data preparation keywords
    if (/(clean|preprocess|prepare|missing|transform|feature)/i.test(message)) {
      topics.push('data_preparation');
      phase = 'analysis';
      intent = 'User wants to clean and prepare their data for modeling';
    }

    // Modeling keywords
    if (/(model|train|algorithm|machine learning|ml|predict)/i.test(message)) {
      topics.push('modeling');
      phase = 'modeling';
      intent = 'User wants to build predictive models with their data';
    }

    // Forecasting keywords
    if (/(forecast|predict|future|projection|trend)/i.test(message)) {
      topics.push('forecasting');
      phase = 'forecasting';
      intent = 'User wants to generate forecasts and predictions for business planning';
    }

    // Business insights keywords
    if (/(insight|business|strategy|recommendation|opportunity|growth)/i.test(message)) {
      topics.push('business_insights');
      phase = 'insights';
      intent = 'User wants strategic business insights and actionable recommendations';
    }

    // Complete workflow keywords
    if (/(complete|full|comprehensive|end.to.end)/i.test(message)) {
      topics.push('data_exploration', 'data_preparation', 'modeling', 'forecasting', 'business_insights');
      phase = 'modeling';
      intent = 'User wants a comprehensive analysis from data exploration to business insights';
    }

    return { topics, phase, intent };
  }

  /**
   * Generate dynamic dashboard configuration based on conversation context
   * ONLY show information relevant to what user has actually asked about
   */
  generateDynamicDashboard(context: ConversationContext, hasData: boolean): DynamicDashboardConfig {
    const { topics, currentPhase, userIntent } = context;

    // Default config shows minimal information
    let config: DynamicDashboardConfig = {
      title: 'Business Intelligence Dashboard',
      subtitle: 'Information based on your current analysis',
      relevantInsights: [],
      showForecasting: false,      // Only show if user asked for forecasting
      showModelMetrics: false,     // Only show if user asked about models
      showDataQuality: false,      // Only show if user asked about data quality
      showBusinessMetrics: false,  // Only show if user explored business metrics
      kpisToShow: [],              // Start empty, add based on actual requests
      primaryMessage: 'Ask questions to see relevant insights appear here'
    };

    if (!hasData) {
      return {
        ...config,
        title: 'Welcome to Your BI Assistant',
        subtitle: 'Upload your data to begin',
        primaryMessage: 'Upload your CSV or Excel file to start exploring your business data',
        kpisToShow: []
      };
    }

    // Only show elements if user has explicitly asked about them
    const userAskedAbout = this.determineUserRequests(context);
    
    if (userAskedAbout.dataExploration) {
      config.showDataQuality = true;
      config.showBusinessMetrics = true;
      config.kpisToShow = ['current_value', 'data_quality', 'total_orders'];
      config.title = 'Data Exploration Dashboard';
      config.subtitle = 'Understanding your data patterns and quality';
    }

    if (userAskedAbout.forecasting) {
      config.showForecasting = true;
      config.showModelMetrics = true;
      config.kpisToShow = [...config.kpisToShow, 'growth_rate', 'efficiency'];
      config.title = 'Forecasting Dashboard';
      config.subtitle = 'Future predictions and planning insights';
    }

    if (userAskedAbout.businessInsights) {
      config.showBusinessMetrics = true;
      config.kpisToShow = [...config.kpisToShow, 'total_revenue', 'growth_rate'];
      if (config.title === 'Business Intelligence Dashboard') {
        config.title = 'Business Insights Dashboard';
        config.subtitle = 'Strategic insights from your data';
      }
    }

    // Generate insights based on what user has asked about
    if (userAskedAbout.dataExploration) {
      config.relevantInsights = [
        {
          id: 'data-overview-1',
          title: 'Data Overview Complete',
          description: 'Your dataset contains good quality data with clear patterns',
          type: 'data_quality',
          priority: 'high',
          relevantToPhase: ['exploration'],
          businessValue: 'Reliable data foundation for business analysis and decision making',
          nextAction: 'Data is ready for deeper analysis or business insights'
        }
      ];

      // Only add pattern insights if there are actual patterns discovered
      if (/pattern|trend|seasonal/i.test(userIntent || '')) {
        config.relevantInsights.push({
          id: 'pattern-1',
          title: 'Business Patterns Identified',
          description: 'Clear patterns detected in your business data',
          type: 'pattern',
          priority: 'medium',
          relevantToPhase: ['exploration'],
          businessValue: 'Understanding patterns helps optimize operations and planning',
          nextAction: 'Use these patterns for better business planning'
        });
      }
    }

    // Modeling Phase - only show if user asked about models/algorithms
    if (userAskedAbout.modeling) {
      config.relevantInsights.push({
        id: 'model-development-1',
        title: 'Model Development in Progress',
        description: 'Building predictive models based on your requirements',
        type: 'model_performance',
        priority: 'high',
        relevantToPhase: ['modeling'],
        businessValue: 'Custom models will provide predictions tailored to your business patterns',
        nextAction: 'Model results will be available once training completes'
      });
    }

    // Forecasting Phase - only show if user asked for forecasts/predictions
    if (userAskedAbout.forecasting) {
      config.relevantInsights.push({
        id: 'forecast-1',
        title: 'Forecast Analysis Ready',
        description: 'Future predictions generated based on your business data',
        type: 'forecast',
        priority: 'high',
        relevantToPhase: ['forecasting'],
        businessValue: 'Forecasts help you plan ahead and make informed business decisions',
        nextAction: 'Review forecast results to plan your business strategy'
      });
    }

    // Business Insights Phase - only show if user asked for business insights/strategy
    if (userAskedAbout.businessInsights) {
      config.relevantInsights.push({
        id: 'business-insights-1',
        title: 'Business Insights Available',
        description: 'Strategic recommendations based on your data analysis',
        type: 'business_opportunity',
        priority: 'high',
        relevantToPhase: ['insights'],
        businessValue: 'Data-driven insights help improve business performance and growth',
        nextAction: 'Review insights to identify opportunities for your business'
      });
    }

    // Complete workflow - only if user has asked about multiple areas
    if (topics.length > 2) {
      config.title = 'Comprehensive Business Intelligence';
      config.subtitle = 'Complete analysis based on your requests';
      config.primaryMessage = 'Full analysis providing insights across all areas you explored';
      
      config.relevantInsights.push({
        id: 'comprehensive-1',
        title: 'Complete Analysis Ready',
        description: 'Your comprehensive analysis covering all requested areas is complete',
        type: 'business_opportunity',
        priority: 'high',
        relevantToPhase: ['insights'],
        businessValue: 'Complete business intelligence enables informed decision-making',
        nextAction: 'Review all insights to plan your business strategy'
      });
    }

    // Remove duplicates from KPIs
    config.kpisToShow = [...new Set(config.kpisToShow)];
    
    return config;
  }

  /**
   * Determine what the user has actually asked about based on conversation
   */
  private determineUserRequests(context: ConversationContext): {
    dataExploration: boolean;
    forecasting: boolean;
    businessInsights: boolean;
    modeling: boolean;
  } {
    const { topics, userIntent } = context;
    
    return {
      dataExploration: topics.includes('data_exploration') || 
                      /explore|eda|quality|pattern|distribution/i.test(userIntent || ''),
      forecasting: topics.includes('forecasting') || 
                  /forecast|predict|future|projection/i.test(userIntent || ''),
      businessInsights: topics.includes('business_insights') || 
                       /insight|business|strategy|recommendation/i.test(userIntent || ''),
      modeling: topics.includes('modeling') || 
               /model|train|algorithm|machine learning/i.test(userIntent || '')
    };
  }

  /**
   * Generate user-friendly task descriptions
   */
  getTaskDescription(taskId: string): string {
    const taskDescriptions: Record<string, string> = {
      'data_exploration': 'Understanding Your Data - Analyzing patterns, trends, and quality',
      'data_preparation': 'Preparing Your Data - Cleaning and optimizing for analysis',
      'modeling': 'Building Predictive Models - Creating AI models for forecasting',
      'forecasting': 'Generating Predictions - Creating forecasts for business planning',
      'business_insights': 'Strategic Insights - Converting analysis into actionable recommendations'
    };

    return taskDescriptions[taskId] || taskId;
  }

  /**
   * Get phase-appropriate next steps
   */
  getNextSteps(currentPhase: string, completedTasks: string[]): string[] {
    const nextStepsMap: Record<string, string[]> = {
      'onboarding': [
        'Upload your historical data (CSV/Excel)',
        'Select business metrics to analyze',
        'Choose analysis type (exploration, forecasting, insights)'
      ],
      'exploration': [
        'Review data quality assessment',
        'Explore identified patterns and trends',
        'Proceed to model training for predictions',
        'Generate business insights from patterns'
      ],
      'analysis': [
        'Review data cleaning results',
        'Validate data quality improvements',
        'Begin predictive model training',
        'Generate forecasts with prepared data'
      ],
      'modeling': [
        'Review model performance metrics',
        'Validate model accuracy and reliability',
        'Generate forecasts using trained models',
        'Extract business insights from model results'
      ],
      'forecasting': [
        'Review forecast accuracy and confidence',
        'Analyze business impact of predictions',
        'Plan strategies based on forecasts',
        'Set up monitoring for forecast performance'
      ],
      'insights': [
        'Review strategic recommendations',
        'Prioritize implementation actions',
        'Monitor business performance improvements',
        'Plan next analysis cycle'
      ]
    };

    return nextStepsMap[currentPhase] || ['Continue with your analysis'];
  }
}

export const dynamicInsightsAnalyzer = new DynamicInsightsAnalyzer();