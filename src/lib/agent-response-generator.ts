import type { ProfessionalResponse, KeyStatistic, SuggestedAction } from './types';

interface AgentContext {
  intent: string;
  data: any;
  userLevel?: 'business' | 'analyst' | 'technical';
  previousContext?: any;
}

export class ProfessionalAgentResponseGenerator {
  async generateResponse(context: AgentContext): Promise<ProfessionalResponse> {
    const { intent, data, userLevel = 'business' } = context;
    
    switch (intent) {
      case 'bu_created':
        return this.generateBUCreationResponse(data);
      case 'lob_created':
        return this.generateLOBCreationResponse(data);
      case 'data_uploaded':
        return this.generateDataUploadResponse(data);
      case 'validation_error':
        return this.generateValidationErrorResponse(data);
      case 'workflow_started':
        return this.generateWorkflowStartResponse(data);
      case 'insights_generated':
        return this.generateInsightsResponse(data);
      case 'bu_selected':
        return this.generateBUSelectionResponse(data);
      case 'lob_selected':
        return this.generateLOBSelectionResponse(data);
      default:
        return this.generateGenericHelpfulResponse(context);
    }
  }
  
  private generateBUCreationResponse(data: any): ProfessionalResponse {
    return {
      content: `✅ **Business Unit "${data.name}" created successfully!**\n\nI've automatically generated the missing details:\n• **Code**: ${data.code}\n• **Display Name**: ${data.displayName}\n• **Description**: ${data.description}\n\nYour Business Unit is ready for Lines of Business.`,
      tone: 'celebratory',
      highlights: [
        `Business Unit: ${data.name}`,
        `Auto-generated Code: ${data.code}`,
        `Display Name: ${data.displayName}`,
        `Start Date: ${data.startDate.toLocaleDateString()}`
      ],
      statistics: [
        { label: 'Total Business Units', value: data.totalBUs || 1, significance: 'medium' },
        { label: 'Setup Progress', value: '50%', significance: 'high' }
      ],
      nextActions: [
        { text: 'Create Line of Business', action: 'create_lob', priority: 'high', category: 'configuration' },
        { text: 'View Business Unit Details', action: 'view_bu', priority: 'medium', category: 'configuration' },
        { text: 'Edit Generated Details', action: 'edit_bu', priority: 'low', category: 'configuration' }
      ],
      helpfulTips: [
        'I automatically generated professional codes and descriptions based on your Business Unit name',
        'You can edit these details anytime if needed'
      ]
    };
  }
  
  private generateLOBCreationResponse(data: any): ProfessionalResponse {
    return {
      content: `✅ **Line of Business "${data.name}" created successfully!**\n\nI've automatically generated:\n• **Code**: ${data.code}\n• **Description**: ${data.description}\n\n🎯 **Next Step**: Upload your data to start forecasting! I'll help you map the columns correctly.`,
      tone: 'celebratory',
      highlights: [
        `Line of Business: ${data.name}`,
        `Auto-generated Code: ${data.code}`,
        `Parent BU: ${data.parentBUName}`,
        `Ready for Data Upload`
      ],
      statistics: [
        { label: 'Total LOBs', value: data.totalLOBs || 1, significance: 'medium' },
        { label: 'Setup Progress', value: '75%', significance: 'high' }
      ],
      nextActions: [
        { text: 'Upload Excel/CSV Data', action: 'upload_data', priority: 'high', category: 'data' },
        { text: 'Download Data Template', action: 'download_template', priority: 'medium', category: 'data' },
        { text: 'View Data Requirements', action: 'data_help', priority: 'low', category: 'data' }
      ],
      helpfulTips: [
        'Upload Excel or CSV files - I\'ll help you map Date, Target (Value), and Regressor (Orders) columns',
        'Your data should have at least: Date column, one Target column, and optionally Regressor columns'
      ]
    };
  }
  
  private generateDataUploadResponse(data: any): ProfessionalResponse {
    const { fileName, recordCount, columns, quality } = data;
    
    return {
      content: `📊 **Data upload completed successfully!**\n\n${fileName} has been processed and validated. Your dataset contains ${recordCount.toLocaleString()} records and is ready for forecasting analysis.`,
      tone: 'informative',
      highlights: [
        `${recordCount.toLocaleString()} records processed`,
        `${columns.length} columns detected`,
        `Data quality score: ${Math.round(quality.score * 100)}%`,
        `Date range: ${quality.dateRange.days} days`
      ],
      statistics: [
        { label: 'Records', value: recordCount.toLocaleString(), significance: 'high' },
        { label: 'Date Range', value: `${quality.dateRange.days} days`, significance: 'medium' },
        { label: 'Missing Values', value: quality.missingValues, significance: quality.missingValues > 0 ? 'high' : 'low' },
        { label: 'Outliers Detected', value: quality.outliers, significance: quality.outliers > 5 ? 'medium' : 'low' }
      ],
      nextActions: [
        { text: 'Explore Data Patterns', action: 'explore_data', priority: 'high', category: 'analysis' },
        { text: 'Generate Forecast', action: 'create_forecast', priority: 'high', category: 'analysis' },
        { text: 'View Data Quality Report', action: 'quality_report', priority: 'medium', category: 'data' }
      ],
      helpfulTips: quality.missingValues > 0 ? [
        'Consider cleaning missing values before forecasting for better accuracy',
        'The system can automatically handle small amounts of missing data'
      ] : [
        'Your data quality is excellent - perfect for accurate forecasting',
        'Consider setting up automated forecasting for regular updates'
      ]
    };
  }
  
  private generateValidationErrorResponse(error: any): ProfessionalResponse {
    return {
      content: `⚠️ **Data validation found some issues**\n\nDon't worry - these are common issues that can be easily fixed. Here's what needs attention:`,
      tone: 'cautionary',
      highlights: error.issues.map((issue: any) => `${issue.field}: ${issue.message}`),
      statistics: [
        { label: 'Issues Found', value: error.issues.length, significance: 'high' },
        { label: 'Critical Issues', value: error.criticalCount, significance: 'high' },
        { label: 'Warnings', value: error.warningCount, significance: 'medium' }
      ],
      nextActions: [
        { text: 'Download Corrected Template', action: 'download_template', priority: 'high', category: 'data' },
        { text: 'View Detailed Error Report', action: 'view_errors', priority: 'medium', category: 'data' },
        { text: 'Get Help with Data Format', action: 'format_help', priority: 'low', category: 'data' }
      ],
      helpfulTips: [
        'The template includes examples of correctly formatted data',
        'Most issues can be fixed in Excel before re-uploading',
        'Contact support if you need help with data formatting'
      ]
    };
  }
  
  private generateWorkflowStartResponse(data: any): ProfessionalResponse {
    return {
      content: `🚀 **Starting ${data.workflowType} workflow**\n\nI'm coordinating multiple specialized agents to ${data.description}. You can monitor progress in real-time.`,
      tone: 'informative',
      highlights: [
        `Workflow: ${data.workflowType}`,
        `Estimated time: ${data.estimatedTime}`,
        `Active agents: ${data.agentCount}`,
        `Steps: ${data.totalSteps}`
      ],
      statistics: [
        { label: 'Total Steps', value: data.totalSteps, significance: 'medium' },
        { label: 'Active Agents', value: data.agentCount, significance: 'high' },
        { label: 'Estimated Time', value: data.estimatedTime, significance: 'medium' }
      ],
      nextActions: [
        { text: 'Monitor Progress', action: 'view_workflow', priority: 'high', category: 'analysis' },
        { text: 'View Agent Details', action: 'view_agents', priority: 'medium', category: 'analysis' },
        { text: 'Pause Workflow', action: 'pause_workflow', priority: 'low', category: 'analysis' }
      ],
      helpfulTips: [
        'You can pause or modify the workflow at any time',
        'Each agent specializes in different aspects of the forecasting process'
      ]
    };
  }
  
  private generateInsightsResponse(data: any): ProfessionalResponse {
    return {
      content: `📈 **Insights generated successfully!**\n\nI've analyzed your data and identified ${data.insightCount} key patterns and trends. Here are the most important findings:`,
      tone: 'informative',
      highlights: data.keyInsights || [
        'Strong seasonal patterns detected',
        'Upward trend in recent months',
        'Low data quality issues found'
      ],
      statistics: [
        { label: 'Insights Generated', value: data.insightCount, significance: 'high' },
        { label: 'Confidence Level', value: `${Math.round(data.confidence * 100)}%`, significance: 'high' },
        { label: 'Data Points Analyzed', value: data.dataPoints.toLocaleString(), significance: 'medium' }
      ],
      nextActions: [
        { text: 'Generate Forecast', action: 'create_forecast', priority: 'high', category: 'analysis' },
        { text: 'Export Insights Report', action: 'export_insights', priority: 'medium', category: 'export' },
        { text: 'Explore Detailed Patterns', action: 'explore_patterns', priority: 'medium', category: 'analysis' }
      ],
      helpfulTips: [
        'Use these insights to inform your forecasting strategy',
        'Consider external factors that might influence these patterns'
      ]
    };
  }
  
  private generateBUSelectionResponse(data: any): ProfessionalResponse {
    const hasLOBs = data.lobCount > 0;
    
    if (!hasLOBs) {
      return {
        content: `📁 **Switched to Business Unit: ${data.name}**\n\nThis Business Unit has no Lines of Business yet. You'll need to create at least one LOB to start working with data.`,
        tone: 'informative',
        highlights: [
          `Business Unit: ${data.name}`,
          `Code: ${data.code}`,
          `Lines of Business: 0`
        ],
        statistics: [
          { label: 'Lines of Business', value: 0, significance: 'high' },
          { label: 'Total Records', value: 0, significance: 'medium' }
        ],
        nextActions: [
          { text: 'Create Line of Business', action: 'create_lob', priority: 'high', category: 'configuration' },
          { text: 'Switch Business Unit', action: 'select_bu', priority: 'medium', category: 'configuration' },
          { text: 'Learn About LOBs', action: 'help_lob', priority: 'low', category: 'configuration' }
        ],
        helpfulTips: [
          'Lines of Business help organize different product lines or market segments',
          'Each LOB can have its own data and forecasting models'
        ]
      };
    }
    
    return {
      content: `📁 **Switched to Business Unit: ${data.name}**\n\nThis Business Unit contains ${data.lobCount} Line${data.lobCount > 1 ? 's' : ''} of Business. Select a LOB to start analyzing data.`,
      tone: 'informative',
      highlights: [
        `Business Unit: ${data.name}`,
        `Code: ${data.code}`,
        `Lines of Business: ${data.lobCount}`,
        `Total Records: ${data.totalRecords.toLocaleString()}`
      ],
      statistics: [
        { label: 'Lines of Business', value: data.lobCount, significance: 'high' },
        { label: 'Total Records', value: data.totalRecords.toLocaleString(), significance: 'medium' },
        { label: 'LOBs with Data', value: data.lobsWithData, significance: 'medium' }
      ],
      nextActions: [
        { text: 'Select Line of Business', action: 'select_lob', priority: 'high', category: 'configuration' },
        { text: 'View BU Overview', action: 'view_bu_overview', priority: 'medium', category: 'analysis' },
        { text: 'Create New LOB', action: 'create_lob', priority: 'low', category: 'configuration' }
      ],
      helpfulTips: [
        'Choose the LOB you want to analyze or forecast',
        'You can compare performance across different LOBs'
      ]
    };
  }
  
  private generateLOBSelectionResponse(data: any): ProfessionalResponse {
    const hasData = data.hasData;
    
    if (!hasData) {
      return {
        content: `📊 **Selected Line of Business: ${data.name}**\n\nNo data is available yet for this LOB. Upload your data to start generating forecasts and insights.`,
        tone: 'informative',
        highlights: [
          `Line of Business: ${data.name}`,
          `Code: ${data.code}`,
          `Data Status: No data uploaded`
        ],
        statistics: [
          { label: 'Records', value: 0, significance: 'high' },
          { label: 'Data Quality', value: 'N/A', significance: 'medium' }
        ],
        nextActions: [
          { text: 'Upload Data', action: 'upload_data', priority: 'high', category: 'data' },
          { text: 'View Sample Analysis', action: 'sample_analysis', priority: 'medium', category: 'analysis' },
          { text: 'Learn About Data Format', action: 'data_format_help', priority: 'low', category: 'data' }
        ],
        helpfulTips: [
          'Upload CSV or Excel files with Date, Value, and Orders columns',
          'The system will automatically validate and analyze your data'
        ]
      };
    }
    
    const trend = data.dataQuality?.trend ? `a ${data.dataQuality.trend} trend` : "patterns to explore";
    const seasonality = data.dataQuality?.seasonality ? ` with ${data.dataQuality.seasonality.replace(/_/g, ' ')} seasonality` : '';
    
    return {
      content: `📊 **Selected Line of Business: ${data.name}**\n\nData is available with ${data.recordCount.toLocaleString()} records. The data shows ${trend}${seasonality}. Ready for analysis and forecasting.`,
      tone: 'informative',
      highlights: [
        `Line of Business: ${data.name}`,
        `Records: ${data.recordCount.toLocaleString()}`,
        `Data Quality: ${data.dataQuality?.score ? Math.round(data.dataQuality.score * 100) + '%' : 'Good'}`,
        `Last Updated: ${data.dataUploaded ? new Date(data.dataUploaded).toLocaleDateString() : 'Unknown'}`
      ],
      statistics: [
        { label: 'Records', value: data.recordCount.toLocaleString(), significance: 'high' },
        { label: 'Data Quality', value: data.dataQuality?.score ? Math.round(data.dataQuality.score * 100) + '%' : 'Good', significance: 'medium' },
        { label: 'Trend', value: data.dataQuality?.trend || 'Unknown', significance: 'medium' }
      ],
      nextActions: [
        { text: 'Explore Data Patterns', action: 'explore_data', priority: 'high', category: 'analysis' },
        { text: 'Generate Forecast', action: 'create_forecast', priority: 'high', category: 'analysis' },
        { text: 'Download Report', action: 'download_report', priority: 'medium', category: 'export' }
      ],
      helpfulTips: [
        'Start with data exploration to understand patterns and trends',
        'Generate forecasts to predict future performance'
      ]
    };
  }
  
  private generateGenericHelpfulResponse(context: AgentContext): ProfessionalResponse {
    return {
      content: `👋 **I'm here to help!**\n\nI can assist you with Business Unit and Line of Business management, data analysis, and forecasting. What would you like to work on?`,
      tone: 'encouraging',
      highlights: [
        'Business Unit & LOB Management',
        'Data Upload & Validation',
        'Forecasting & Analysis',
        'Insights & Reporting'
      ],
      statistics: [],
      nextActions: [
        { text: 'Create Business Unit', action: 'create_bu', priority: 'high', category: 'configuration' },
        { text: 'Upload Data', action: 'upload_data', priority: 'high', category: 'data' },
        { text: 'View Help Guide', action: 'help_guide', priority: 'medium', category: 'configuration' }
      ],
      helpfulTips: [
        'Start by creating a Business Unit and Line of Business',
        'Upload your data to begin generating insights and forecasts'
      ]
    };
  }
  
  formatBusinessInsights(data: any): string {
    // Format insights in a business-friendly way
    const insights = data.insights || [];
    return insights.map((insight: any, index: number) => 
      `${index + 1}. **${insight.title}**: ${insight.description}`
    ).join('\n');
  }
  
  createErrorGuidance(error: any): string {
    const guidance = [
      `**Issue**: ${error.message}`,
      `**Impact**: ${error.severity === 'critical' ? 'Blocks progress' : 'May affect accuracy'}`,
      `**Solution**: ${error.suggestedFix || 'Please review and correct the data'}`
    ];
    
    return guidance.join('\n');
  }
  
  generateWorkflowExplanation(workflow: any[]): string {
    const steps = workflow.map((step, index) => 
      `${index + 1}. **${step.name}** (${step.estimatedTime}) - ${step.details}`
    ).join('\n');
    
    return `**Workflow Steps**:\n${steps}`;
  }
}

// Session-based insights agent for AI-driven dynamic insights
export class SessionInsightsAgent {
  private insights: any[] = [];
  private sessionData: any;
  
  async analyzeSession(sessionData: any): Promise<any> {
    this.sessionData = sessionData;
    
    const keyActivities = this.extractKeyActivities(sessionData);
    const dataStatus = this.analyzeDataStatus(sessionData);
    const nextSteps = this.generateNextSteps(sessionData, dataStatus);
    const progressMetrics = this.calculateProgress(sessionData, dataStatus);
    
    const summary = this.generateSessionSummary(keyActivities, dataStatus);
    
    return {
      summary,
      keyActivities,
      dataStatus,
      nextSteps,
      progressMetrics
    };
  }
  
  async generateInsights(context: any): Promise<any[]> {
    const insights: any[] = [];
    
    // Always show session progress insight
    insights.push(await this.generateSessionProgressInsight());
    
    // BU/LOB creation insights
    if (context.businessUnits.length > 0) {
      insights.push(await this.generateOrganizationInsight(context.businessUnits));
    }
    
    // Data upload insights
    if (context.hasDataUploads) {
      insights.push(...await this.generateDataInsights(context.dataUploads));
    }
    
    // Readiness insights
    insights.push(await this.generateReadinessInsight(context));
    
    // Recommendations based on current state
    insights.push(...await this.generateRecommendationInsights(context));
    
    return insights.filter(insight => insight !== null);
  }
  
  private async generateSessionProgressInsight(): Promise<any> {
    const sessionDuration = Date.now() - (this.sessionData?.sessionStartTime?.getTime() || Date.now());
    const activitiesCount = this.sessionData?.userActions?.length || 0;
    
    return {
      id: 'session-progress',
      title: 'Session Progress',
      description: `You've been active for ${Math.round(sessionDuration / 60000)} minutes with ${activitiesCount} actions completed.`,
      value: `${activitiesCount} actions`,
      category: 'trend',
      significance: 'medium',
      actionable: true,
      recommendation: 'Keep up the great progress! Consider saving your work periodically.'
    };
  }
  
  private async generateOrganizationInsight(businessUnits: any[]): Promise<any> {
    const totalLOBs = businessUnits.reduce((sum, bu) => sum + (bu.lobs?.length || 0), 0);
    const lobsWithData = businessUnits.reduce((sum, bu) => 
      sum + (bu.lobs?.filter((lob: any) => lob.hasData).length || 0), 0
    );
    
    return {
      id: 'organization-structure',
      title: 'Organization Structure',
      description: `You have ${businessUnits.length} Business Units with ${totalLOBs} Lines of Business. ${lobsWithData} LOBs have data uploaded.`,
      value: `${businessUnits.length} BUs, ${totalLOBs} LOBs`,
      trend: totalLOBs > businessUnits.length ? 'up' : 'stable',
      category: 'trend',
      significance: 'high',
      actionable: totalLOBs === 0,
      recommendation: totalLOBs === 0 ? 'Create Lines of Business to organize your data' : 'Well organized! Ready for data analysis.'
    };
  }
  
  private async generateDataInsights(dataUploads: any[]): Promise<any[]> {
    const insights: any[] = [];
    
    const totalRecords = dataUploads.reduce((sum, upload) => sum + (upload.recordCount || 0), 0);
    const avgQuality = dataUploads.reduce((sum, upload) => sum + (upload.quality || 0), 0) / dataUploads.length;
    
    // Data volume insight
    insights.push({
      id: 'data-volume',
      title: 'Data Volume',
      description: `${totalRecords.toLocaleString()} total records across ${dataUploads.length} uploads.`,
      value: totalRecords.toLocaleString(),
      category: 'trend',
      significance: 'high',
      actionable: false
    });
    
    // Data quality insight
    insights.push({
      id: 'data-quality',
      title: 'Data Quality Score',
      description: `Average data quality across all uploads is ${Math.round(avgQuality * 100)}%.`,
      value: `${Math.round(avgQuality * 100)}%`,
      trend: avgQuality > 0.8 ? 'up' : avgQuality > 0.6 ? 'stable' : 'down',
      category: 'quality',
      significance: avgQuality < 0.7 ? 'high' : 'medium',
      actionable: avgQuality < 0.8,
      recommendation: avgQuality < 0.8 ? 'Consider cleaning data for better forecasting accuracy' : 'Excellent data quality!'
    });
    
    return insights;
  }
  
  private async generateReadinessInsight(context: any): Promise<any> {
    const hasData = context.hasDataUploads;
    const hasBUs = context.businessUnits.length > 0;
    const hasLOBs = context.businessUnits.some((bu: any) => bu.lobs?.length > 0);
    
    let readinessScore = 0;
    let description = '';
    let recommendation = '';
    
    if (hasBUs) readinessScore += 33;
    if (hasLOBs) readinessScore += 33;
    if (hasData) readinessScore += 34;
    
    if (readinessScore === 100) {
      description = 'Your setup is complete and ready for forecasting!';
      recommendation = 'Start generating forecasts or explore data patterns';
    } else if (readinessScore >= 66) {
      description = 'Almost ready! Just need to upload some data.';
      recommendation = 'Upload historical data to begin forecasting';
    } else if (readinessScore >= 33) {
      description = 'Good start! Create Lines of Business to organize your data.';
      recommendation = 'Add LOBs to categorize different business areas';
    } else {
      description = 'Let\'s get started by creating your first Business Unit.';
      recommendation = 'Create a Business Unit to begin organizing your forecasting data';
    }
    
    return {
      id: 'forecasting-readiness',
      title: 'Forecasting Readiness',
      description,
      value: `${readinessScore}%`,
      trend: readinessScore > 66 ? 'up' : 'stable',
      category: 'forecast',
      significance: 'high',
      actionable: readinessScore < 100,
      recommendation
    };
  }
  
  private async generateRecommendationInsights(context: any): Promise<any[]> {
    const insights: any[] = [];
    
    // Time-based recommendations
    const sessionDuration = Date.now() - (this.sessionData?.sessionStartTime?.getTime() || Date.now());
    if (sessionDuration > 30 * 60 * 1000) { // 30 minutes
      insights.push({
        id: 'session-duration',
        title: 'Extended Session',
        description: 'You\'ve been working for a while. Consider taking a break or saving your progress.',
        value: `${Math.round(sessionDuration / 60000)} min`,
        category: 'trend',
        significance: 'low',
        actionable: true,
        recommendation: 'Save your work and take a short break for better productivity'
      });
    }
    
    // Data-based recommendations
    if (context.hasDataUploads && !context.hasAnalysis) {
      insights.push({
        id: 'analysis-suggestion',
        title: 'Ready for Analysis',
        description: 'Your data is uploaded and validated. Time to explore patterns and generate forecasts!',
        value: 'Start Analysis',
        category: 'forecast',
        significance: 'high',
        actionable: true,
        recommendation: 'Begin with exploratory data analysis to understand your data patterns'
      });
    }
    
    return insights;
  }
  
  updateInsightsRealtime(event: any): void {
    // Update insights based on real-time events
    switch (event.type) {
      case 'bu_created':
        this.addInsight({
          id: `bu-created-${event.timestamp}`,
          title: 'Business Unit Created',
          description: `Successfully created "${event.data.name}" Business Unit.`,
          value: event.data.name,
          category: 'trend',
          significance: 'medium',
          actionable: true,
          recommendation: 'Add Lines of Business to organize your data further'
        });
        break;
        
      case 'data_uploaded':
        this.addInsight({
          id: `data-uploaded-${event.timestamp}`,
          title: 'Data Successfully Uploaded',
          description: `${event.data.recordCount} records uploaded with ${Math.round(event.data.quality * 100)}% quality score.`,
          value: `${event.data.recordCount} records`,
          category: 'quality',
          significance: 'high',
          actionable: true,
          recommendation: 'Explore your data patterns or start forecasting'
        });
        break;
    }
  }
  
  private addInsight(insight: any): void {
    this.insights.unshift(insight);
    // Keep only last 10 insights
    if (this.insights.length > 10) {
      this.insights = this.insights.slice(0, 10);
    }
  }
  
  private extractKeyActivities(sessionData: any): any[] {
    return sessionData.userActions?.map((action: any) => ({
      type: action.type,
      timestamp: action.timestamp,
      details: this.getActivityDetails(action),
      impact: this.getActivityImpact(action.type)
    })) || [];
  }
  
  private analyzeDataStatus(sessionData: any): any {
    const businessUnits = sessionData.businessUnits || [];
    const totalLOBs = businessUnits.reduce((sum: number, bu: any) => sum + (bu.lobs?.length || 0), 0);
    const dataUploads = sessionData.dataUploads || [];
    
    return {
      totalBUs: businessUnits.length,
      totalLOBs,
      dataUploaded: dataUploads.length > 0,
      recordCount: dataUploads.reduce((sum: number, upload: any) => sum + (upload.recordCount || 0), 0),
      dataQuality: dataUploads.length > 0 ? dataUploads.reduce((sum: number, upload: any) => sum + (upload.quality || 0), 0) / dataUploads.length : undefined,
      readyForForecasting: businessUnits.length > 0 && totalLOBs > 0 && dataUploads.length > 0
    };
  }
  
  private generateNextSteps(sessionData: any, dataStatus: any): any[] {
    const steps = [];
    
    if (dataStatus.totalBUs === 0) {
      steps.push({
        text: 'Create your first Business Unit',
        action: 'create_bu',
        priority: 'high',
        category: 'configuration'
      });
    } else if (dataStatus.totalLOBs === 0) {
      steps.push({
        text: 'Add Lines of Business',
        action: 'create_lob',
        priority: 'high',
        category: 'configuration'
      });
    } else if (!dataStatus.dataUploaded) {
      steps.push({
        text: 'Upload your data',
        action: 'upload_data',
        priority: 'high',
        category: 'data'
      });
    } else {
      steps.push({
        text: 'Start forecasting analysis',
        action: 'start_analysis',
        priority: 'high',
        category: 'analysis'
      });
    }
    
    return steps;
  }
  
  private calculateProgress(sessionData: any, dataStatus: any): any[] {
    const totalSteps = 4; // BU creation, LOB creation, data upload, analysis
    let completedSteps = 0;
    
    if (dataStatus.totalBUs > 0) completedSteps++;
    if (dataStatus.totalLOBs > 0) completedSteps++;
    if (dataStatus.dataUploaded) completedSteps++;
    if (sessionData.hasAnalyzedData) completedSteps++;
    
    return [
      {
        label: 'Setup Progress',
        value: completedSteps,
        maxValue: totalSteps,
        unit: 'steps'
      },
      {
        label: 'Data Readiness',
        value: dataStatus.readyForForecasting ? 100 : (completedSteps / totalSteps) * 100,
        maxValue: 100,
        unit: '%'
      }
    ];
  }
  
  private generateSessionSummary(keyActivities: any[], dataStatus: any): string {
    const activityCount = keyActivities.length;
    const setupProgress = dataStatus.readyForForecasting ? 'complete' : 'in progress';
    
    return `Session active with ${activityCount} actions completed. Setup is ${setupProgress}.`;
  }
  
  private getActivityDetails(action: any): string {
    switch (action.type) {
      case 'bu_created':
        return `Created Business Unit: ${action.data?.name || 'Unknown'}`;
      case 'lob_created':
        return `Created Line of Business: ${action.data?.name || 'Unknown'}`;
      case 'data_uploaded':
        return `Uploaded ${action.data?.recordCount || 0} records`;
      default:
        return 'Activity completed';
    }
  }
  
  private getActivityImpact(type: string): 'high' | 'medium' | 'low' {
    switch (type) {
      case 'bu_created':
      case 'lob_created':
      case 'data_uploaded':
        return 'high';
      case 'analysis_started':
        return 'medium';
      default:
        return 'low';
    }
  }
}

// Export singleton instances
export const agentResponseGenerator = new ProfessionalAgentResponseGenerator();
export const sessionInsightsAgent = new SessionInsightsAgent();