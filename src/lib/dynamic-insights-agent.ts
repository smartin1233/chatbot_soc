export interface DynamicInsight {
  id: string;
  title: string;
  description: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
  category: 'forecast' | 'trend' | 'seasonality' | 'anomaly' | 'quality' | 'setup' | 'data' | 'analysis' | 'session';
  actionable: boolean;
  recommendation?: string;
}

class DynamicInsightsAgent {
  async generateSessionInsights(sessionData: any): Promise<DynamicInsight[]> {
    const insights: DynamicInsight[] = [];

    // Generate insights based on actual session state
    if (!sessionData.selectedBuId) {
      insights.push({
        id: 'setup-bu',
        title: 'Setup Required',
        description: 'No Business Unit selected. Start by creating or selecting a Business Unit to organize your analysis.',
        value: 'Setup Needed',
        significance: 'high',
        category: 'setup',
        actionable: true,
        recommendation: 'Create your first Business Unit to get started with data analysis.'
      });
    }

    if (!sessionData.selectedLobId && sessionData.selectedBuId) {
      insights.push({
        id: 'setup-lob',
        title: 'Line of Business Needed',
        description: 'Business Unit selected but no Line of Business configured. Add a LOB to start uploading data.',
        value: 'Configuration Pending',
        significance: 'high',
        category: 'setup',
        actionable: true,
        recommendation: 'Add a Line of Business to your selected Business Unit.'
      });
    }

    if (!sessionData.hasAnalyzedData && sessionData.selectedLobId) {
      const hasDataUploaded = sessionData.businessUnits
        .flatMap((bu: any) => bu.lobs)
        .some((lob: any) => lob.hasData);

      if (!hasDataUploaded) {
        insights.push({
          id: 'upload-data',
          title: 'Data Upload Required',
          description: 'Line of Business configured but no data uploaded. Upload your dataset to begin analysis.',
          value: 'No Data',
          significance: 'high',
          category: 'data',
          actionable: true,
          recommendation: 'Upload a CSV or Excel file with your business data.'
        });
      } else {
        insights.push({
          id: 'start-analysis',
          title: 'Ready for Analysis',
          description: 'Data is uploaded and ready. Start with exploratory data analysis to understand your data patterns.',
          value: 'Ready',
          significance: 'medium',
          category: 'analysis',
          actionable: true,
          recommendation: 'Ask me to "explore the data" or "run EDA" to get started.'
        });
      }
    }

    if (sessionData.hasAnalyzedData && !sessionData.hasForecasting) {
      insights.push({
        id: 'forecasting-ready',
        title: 'Forecasting Available',
        description: 'Data analysis completed. You can now generate forecasts and predictions for your business metrics.',
        value: 'Next Step',
        trend: 'up',
        significance: 'medium',
        category: 'forecast',
        actionable: true,
        recommendation: 'Generate forecasts to predict future business performance.'
      });
    }

    // Add conversation-based insights
    const recentMessages = sessionData.messages.slice(-5);
    const hasQuestions = recentMessages.some((msg: any) => 
      msg.role === 'user' && msg.content.includes('?')
    );

    if (hasQuestions) {
      insights.push({
        id: 'active-exploration',
        title: 'Active Analysis Session',
        description: 'You\'re actively exploring your data. Keep asking questions to uncover more insights.',
        value: 'In Progress',
        trend: 'up',
        significance: 'low',
        category: 'session',
        actionable: false
      });
    }

    return insights;
  }
}

export const dynamicInsightsAgent = new DynamicInsightsAgent();