/**
 * Dynamic Chart Generator
 * Analyzes user queries and generates appropriate Recharts visualizations
 * Supports: outliers, forecasts, comparisons, trends, distributions
 */

import type { WeeklyData } from './types';

export type ChartType = 
  | 'line' 
  | 'area' 
  | 'bar' 
  | 'scatter' 
  | 'composed' 
  | 'forecast-comparison'
  | 'outlier-detection'
  | 'trend-analysis'
  | 'distribution';

export interface ChartConfig {
  type: ChartType;
  title: string;
  description: string;
  dataKeys: string[];
  showOutliers?: boolean;
  showForecast?: boolean;
  showTrend?: boolean;
  showConfidenceInterval?: boolean;
  showMovingAverage?: boolean;
  highlightAnomalies?: boolean;
  comparisonMode?: 'actual-vs-forecast' | 'period-over-period' | 'multiple-series';
}

export interface ProcessedChartData extends WeeklyData {
  formattedDate: string;
  trend?: number;
  movingAverage?: number;
  upperBound?: number;
  lowerBound?: number;
  isOutlier?: boolean;
  anomalyScore?: number;
  forecastValue?: number;
  forecastUpper?: number;
  forecastLower?: number;
}

export class DynamicChartGenerator {
  /**
   * Analyze user query and determine appropriate chart configuration
   */
  analyzeQuery(query: string): ChartConfig {
    const lowerQuery = query.toLowerCase();
    
    // Forecast detection
    if (/(forecast|predict|future|projection|next|upcoming)/i.test(lowerQuery)) {
      return {
        type: 'forecast-comparison',
        title: 'Actual vs Forecast',
        description: 'Historical data with future predictions',
        dataKeys: ['Value', 'Forecast', 'ForecastUpper', 'ForecastLower'],
        showForecast: true,
        showConfidenceInterval: true,
        showTrend: true
      };
    }
    
    // Outlier detection
    if (/(outlier|anomal|unusual|spike|drop|abnormal)/i.test(lowerQuery)) {
      return {
        type: 'outlier-detection',
        title: 'Outlier Detection',
        description: 'Data points with anomalies highlighted',
        dataKeys: ['Value'],
        showOutliers: true,
        highlightAnomalies: true,
        showMovingAverage: true
      };
    }
    
    // Trend analysis
    if (/(trend|pattern|direction|growth|decline)/i.test(lowerQuery)) {
      return {
        type: 'trend-analysis',
        title: 'Trend Analysis',
        description: 'Historical trends with regression line',
        dataKeys: ['Value'],
        showTrend: true,
        showMovingAverage: true
      };
    }
    
    // Comparison mode
    if (/(compar|versus|vs|actual.*forecast|forecast.*actual)/i.test(lowerQuery)) {
      return {
        type: 'composed',
        title: 'Data Comparison',
        description: 'Side-by-side comparison',
        dataKeys: ['Value', 'Forecast'],
        comparisonMode: 'actual-vs-forecast',
        showForecast: true
      };
    }
    
    // Distribution analysis
    if (/(distribut|histogram|frequenc|range)/i.test(lowerQuery)) {
      return {
        type: 'distribution',
        title: 'Distribution Analysis',
        description: 'Value distribution over time',
        dataKeys: ['Value'],
        showMovingAverage: true
      };
    }
    
    // Default: comprehensive view
    return {
      type: 'composed',
      title: 'Data Overview',
      description: 'Comprehensive data visualization',
      dataKeys: ['Value', 'Orders'],
      showTrend: true,
      showMovingAverage: true
    };
  }

  /**
   * Process data for visualization with statistical enhancements
   */
  processData(
    data: WeeklyData[],
    config: ChartConfig,
    statisticalAnalysis?: any
  ): ProcessedChartData[] {
    if (!data || data.length === 0) return [];

    const processed: ProcessedChartData[] = data.map((item, index) => {
      const date = new Date(item.Date);
      const baseData: ProcessedChartData = {
        ...item,
        formattedDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit'
        })
      };

      // Add moving average
      if (config.showMovingAverage) {
        baseData.movingAverage = this.calculateMovingAverage(data, index, 7);
      }

      // Add trend line
      if (config.showTrend && statisticalAnalysis?.trend?.linearRegression) {
        const { slope, intercept } = statisticalAnalysis.trend.linearRegression;
        baseData.trend = intercept + slope * index;
      }

      // Mark outliers
      if (config.showOutliers || config.highlightAnomalies) {
        const outlierIndices = statisticalAnalysis?.statistical?.outliers?.indices || [];
        baseData.isOutlier = outlierIndices.includes(index);
        
        if (baseData.isOutlier) {
          const mean = statisticalAnalysis?.statistical?.mean || 0;
          const stdDev = statisticalAnalysis?.statistical?.standardDeviation || 1;
          baseData.anomalyScore = Math.abs((item.Value - mean) / stdDev);
        }
      }

      // Add confidence intervals
      if (config.showConfidenceInterval && baseData.trend) {
        const stdDev = statisticalAnalysis?.statistical?.standardDeviation || 0;
        baseData.upperBound = baseData.trend + 1.96 * stdDev;
        baseData.lowerBound = baseData.trend - 1.96 * stdDev;
      }

      // Add forecast data
      if (config.showForecast && item.Forecast !== undefined) {
        baseData.forecastValue = item.Forecast;
        baseData.forecastUpper = item.ForecastUpper || item.Forecast * 1.1;
        baseData.forecastLower = item.ForecastLower || item.Forecast * 0.9;
      }

      return baseData;
    });

    return processed;
  }

  /**
   * Calculate moving average for smoothing
   */
  private calculateMovingAverage(
    data: WeeklyData[],
    index: number,
    window: number
  ): number {
    const start = Math.max(0, index - Math.floor(window / 2));
    const end = Math.min(data.length, index + Math.ceil(window / 2));
    const slice = data.slice(start, end);
    const sum = slice.reduce((acc, d) => acc + d.Value, 0);
    return sum / slice.length;
  }

  /**
   * Generate chart recommendations based on data characteristics
   */
  recommendCharts(data: WeeklyData[], statisticalAnalysis?: any): ChartConfig[] {
    const recommendations: ChartConfig[] = [];

    // Always recommend basic trend
    recommendations.push({
      type: 'line',
      title: 'Time Series Trend',
      description: 'Basic trend visualization',
      dataKeys: ['Value']
    });

    // Recommend outlier detection if outliers exist
    if (statisticalAnalysis?.statistical?.outliers?.values?.length > 0) {
      recommendations.push({
        type: 'outlier-detection',
        title: 'Outlier Analysis',
        description: `${statisticalAnalysis.statistical.outliers.values.length} outliers detected`,
        dataKeys: ['Value'],
        showOutliers: true,
        highlightAnomalies: true
      });
    }

    // Recommend forecast if trend is strong
    if (statisticalAnalysis?.trend?.linearRegression?.rSquared > 0.5) {
      recommendations.push({
        type: 'forecast-comparison',
        title: 'Forecast Projection',
        description: 'Strong trend detected - suitable for forecasting',
        dataKeys: ['Value', 'Forecast'],
        showForecast: true,
        showTrend: true
      });
    }

    // Recommend comparison if forecast data exists
    const hasForecast = data.some(d => d.Forecast !== undefined);
    if (hasForecast) {
      recommendations.push({
        type: 'composed',
        title: 'Actual vs Forecast',
        description: 'Compare predictions with actual values',
        dataKeys: ['Value', 'Forecast'],
        comparisonMode: 'actual-vs-forecast',
        showForecast: true
      });
    }

    return recommendations;
  }

  /**
   * Detect if query requests specific visualization features
   */
  detectVisualizationIntent(query: string): {
    needsChart: boolean;
    chartType?: ChartType;
    features: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const features: string[] = [];

    // Check for explicit visualization requests
    const needsChart = /(show|display|visuali[sz]e|plot|chart|graph|see)/i.test(lowerQuery);

    // Detect specific features
    if (/(outlier|anomal)/i.test(lowerQuery)) features.push('outliers');
    if (/(forecast|predict)/i.test(lowerQuery)) features.push('forecast');
    if (/(trend|pattern)/i.test(lowerQuery)) features.push('trend');
    if (/(compar|versus|vs)/i.test(lowerQuery)) features.push('comparison');
    if (/(confidence|interval|range)/i.test(lowerQuery)) features.push('confidence');
    if (/(moving average|smooth)/i.test(lowerQuery)) features.push('moving-average');

    // Determine chart type
    let chartType: ChartType | undefined;
    if (features.includes('forecast') && features.includes('comparison')) {
      chartType = 'forecast-comparison';
    } else if (features.includes('outliers')) {
      chartType = 'outlier-detection';
    } else if (features.includes('trend')) {
      chartType = 'trend-analysis';
    } else if (needsChart) {
      chartType = 'composed';
    }

    return { needsChart, chartType, features };
  }
}

export const dynamicChartGenerator = new DynamicChartGenerator();
