import { DataPoint } from './statistical-analysis';

/**
 * Outlier detection methods
 */
export type OutlierMethod = 'iqr' | 'zscore' | 'isolation_forest';

/**
 * Outlier severity levels
 */
export type OutlierSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Individual outlier point with detailed information
 */
export interface OutlierPoint {
  index: number;
  value: number;
  date: Date;
  zScore: number;
  severity: OutlierSeverity;
  reason: string;
  suggestedAction: string;
  distanceFromThreshold: number;
}

/**
 * Configuration for outlier detection
 */
export interface OutlierConfig {
  method: OutlierMethod;
  threshold?: number;
  sensitivity?: 'low' | 'medium' | 'high';
}

/**
 * Visualization data for highlighting outliers
 */
export interface OutlierVisualizationData {
  dataPoints: DataPoint[];
  outlierIndices: number[];
  thresholds: {
    lower: number;
    upper: number;
  };
  highlightColors: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
  normalColor: string;
}

/**
 * Complete outlier detection result
 */
export interface OutlierDetectionResult {
  outliers: OutlierPoint[];
  method: OutlierMethod;
  threshold: number;
  visualizationData: OutlierVisualizationData;
  statistics: {
    totalPoints: number;
    outlierCount: number;
    outlierPercentage: number;
    severityBreakdown: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  summary: string;
}

/**
 * Preprocessing suggestion based on outlier detection
 */
export interface PreprocessingSuggestion {
  id: string;
  type: 'removal' | 'imputation' | 'transformation' | 'capping';
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  applicability: number;
  implementation: {
    method: string;
    parameters: Record<string, any>;
    expectedOutcome: string;
  };
}

/**
 * Dedicated Outlier Detection Module
 * Activates only on explicit user request with keywords like:
 * - "quality check"
 * - "anomalies"
 * - "outliers"
 * - "unusual values"
 * - "data issues"
 */
export class OutlierDetector {
  private readonly ACTIVATION_KEYWORDS = [
    'quality check',
    'anomalies',
    'anomaly',
    'outliers',
    'outlier',
    'unusual values',
    'unusual value',
    'data issues',
    'data issue',
    'data quality',
    'bad data',
    'incorrect data',
    'suspicious values',
    'suspicious value',
    'extreme values',
    'extreme value'
  ];

  /**
   * Check if the user query should trigger outlier detection
   */
  shouldActivate(userQuery: string): boolean {
    const lowerQuery = userQuery.toLowerCase();
    return this.ACTIVATION_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Detect outliers using the specified method
   */
  detect(data: DataPoint[], config: OutlierConfig): OutlierDetectionResult {
    const method = config.method || 'iqr';
    
    let outliers: OutlierPoint[];
    let threshold: number;
    
    switch (method) {
      case 'iqr':
        ({ outliers, threshold } = this.detectIQR(data, config));
        break;
      case 'zscore':
        ({ outliers, threshold } = this.detectZScore(data, config));
        break;
      case 'isolation_forest':
        ({ outliers, threshold } = this.detectIsolationForest(data, config));
        break;
      default:
        ({ outliers, threshold } = this.detectIQR(data, config));
    }

    // Calculate statistics
    const totalPoints = data.length;
    const outlierCount = outliers.length;
    const outlierPercentage = (outlierCount / totalPoints) * 100;
    
    const severityBreakdown = {
      low: outliers.filter(o => o.severity === 'low').length,
      medium: outliers.filter(o => o.severity === 'medium').length,
      high: outliers.filter(o => o.severity === 'high').length,
      critical: outliers.filter(o => o.severity === 'critical').length
    };

    // Generate visualization data
    const visualizationData = this.generateVisualizationData(data, outliers);

    // Generate summary
    const summary = this.generateSummary(outlierCount, totalPoints, outlierPercentage, severityBreakdown);

    return {
      outliers,
      method,
      threshold,
      visualizationData,
      statistics: {
        totalPoints,
        outlierCount,
        outlierPercentage,
        severityBreakdown
      },
      summary
    };
  }

  /**
   * IQR (Interquartile Range) method for outlier detection
   */
  private detectIQR(data: DataPoint[], config: OutlierConfig): {
    outliers: OutlierPoint[];
    threshold: number;
  } {
    const values = data.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Calculate quartiles
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;

    // Determine multiplier based on sensitivity
    const multiplier = this.getSensitivityMultiplier(config.sensitivity || 'medium');
    const threshold = iqr * multiplier;

    // Calculate bounds
    const lowerBound = q1 - threshold;
    const upperBound = q3 + threshold;

    // Identify outliers
    const outliers: OutlierPoint[] = [];
    
    data.forEach((point, index) => {
      if (point.value < lowerBound || point.value > upperBound) {
        const distanceFromThreshold = Math.min(
          Math.abs(point.value - lowerBound),
          Math.abs(point.value - upperBound)
        );
        
        const zScore = this.calculateZScore(point.value, values);
        const severity = this.classifySeverity(zScore, distanceFromThreshold, iqr);
        
        outliers.push({
          index,
          value: point.value,
          date: point.date,
          zScore,
          severity,
          reason: point.value < lowerBound 
            ? `Value ${point.value.toFixed(2)} is below lower bound ${lowerBound.toFixed(2)}`
            : `Value ${point.value.toFixed(2)} is above upper bound ${upperBound.toFixed(2)}`,
          suggestedAction: this.getSuggestedAction(severity),
          distanceFromThreshold
        });
      }
    });

    return { outliers, threshold };
  }

  /**
   * Z-Score method for outlier detection
   */
  private detectZScore(data: DataPoint[], config: OutlierConfig): {
    outliers: OutlierPoint[];
    threshold: number;
  } {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Determine threshold based on sensitivity
    const threshold = config.threshold || this.getZScoreThreshold(config.sensitivity || 'medium');

    // Identify outliers
    const outliers: OutlierPoint[] = [];
    
    data.forEach((point, index) => {
      const zScore = stdDev > 0 ? Math.abs((point.value - mean) / stdDev) : 0;
      
      if (zScore > threshold) {
        const distanceFromThreshold = (zScore - threshold) * stdDev;
        const severity = this.classifySeverity(zScore, distanceFromThreshold, stdDev);
        
        outliers.push({
          index,
          value: point.value,
          date: point.date,
          zScore,
          severity,
          reason: `Z-score of ${zScore.toFixed(2)} exceeds threshold of ${threshold.toFixed(2)}`,
          suggestedAction: this.getSuggestedAction(severity),
          distanceFromThreshold
        });
      }
    });

    return { outliers, threshold };
  }

  /**
   * Isolation Forest approximation for outlier detection
   * Simplified implementation using anomaly scoring
   */
  private detectIsolationForest(data: DataPoint[], config: OutlierConfig): {
    outliers: OutlierPoint[];
    threshold: number;
  } {
    const values = data.map(d => d.value);
    const n = values.length;
    
    // Calculate anomaly scores based on isolation depth
    const anomalyScores = values.map((value, index) => {
      // Calculate how isolated this point is
      const distances = values.map(v => Math.abs(v - value));
      distances.sort((a, b) => a - b);
      
      // Average distance to k nearest neighbors (k = sqrt(n))
      const k = Math.max(3, Math.floor(Math.sqrt(n)));
      const avgDistance = distances.slice(1, k + 1).reduce((sum, d) => sum + d, 0) / k;
      
      // Normalize score
      const maxDistance = Math.max(...distances);
      return maxDistance > 0 ? avgDistance / maxDistance : 0;
    });

    // Determine threshold based on sensitivity
    const threshold = config.threshold || this.getIsolationThreshold(config.sensitivity || 'medium');

    // Identify outliers
    const outliers: OutlierPoint[] = [];
    
    data.forEach((point, index) => {
      const anomalyScore = anomalyScores[index];
      
      if (anomalyScore > threshold) {
        const zScore = this.calculateZScore(point.value, values);
        const distanceFromThreshold = anomalyScore - threshold;
        const severity = this.classifySeverity(zScore, distanceFromThreshold * 100, 1);
        
        outliers.push({
          index,
          value: point.value,
          date: point.date,
          zScore,
          severity,
          reason: `Isolation score of ${anomalyScore.toFixed(3)} indicates anomalous behavior`,
          suggestedAction: this.getSuggestedAction(severity),
          distanceFromThreshold
        });
      }
    });

    return { outliers, threshold };
  }

  /**
   * Classify outlier severity based on z-score and distance
   */
  private classifySeverity(
    zScore: number,
    distanceFromThreshold: number,
    scale: number
  ): OutlierSeverity {
    const absZScore = Math.abs(zScore);
    const normalizedDistance = distanceFromThreshold / scale;

    if (absZScore > 4 || normalizedDistance > 3) {
      return 'critical';
    } else if (absZScore > 3 || normalizedDistance > 2) {
      return 'high';
    } else if (absZScore > 2 || normalizedDistance > 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get suggested action based on severity
   */
  private getSuggestedAction(severity: OutlierSeverity): string {
    switch (severity) {
      case 'critical':
        return 'Immediate investigation required. Consider removal or correction.';
      case 'high':
        return 'Review data point. May require correction or special handling.';
      case 'medium':
        return 'Monitor this value. Consider transformation or capping.';
      case 'low':
        return 'Minor outlier. May be acceptable depending on context.';
    }
  }

  /**
   * Generate visualization data for outlier highlighting
   */
  private generateVisualizationData(
    data: DataPoint[],
    outliers: OutlierPoint[]
  ): OutlierVisualizationData {
    const values = data.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;
    
    return {
      dataPoints: data,
      outlierIndices: outliers.map(o => o.index),
      thresholds: {
        lower: q1 - 1.5 * iqr,
        upper: q3 + 1.5 * iqr
      },
      highlightColors: {
        low: '#FFA500',      // Orange
        medium: '#FF8C00',   // Dark Orange
        high: '#FF4500',     // Orange Red
        critical: '#DC143C'  // Crimson
      },
      normalColor: '#3B82F6' // Blue
    };
  }

  /**
   * Generate preprocessing suggestions based on outlier detection
   */
  suggestPreprocessing(result: OutlierDetectionResult): PreprocessingSuggestion[] {
    const suggestions: PreprocessingSuggestion[] = [];
    const { outliers, statistics } = result;

    // Suggestion 1: Removal
    if (statistics.outlierPercentage < 5) {
      suggestions.push({
        id: 'removal',
        type: 'removal',
        title: 'Remove Outliers',
        description: 'Remove detected outlier points from the dataset',
        pros: [
          'Simple and straightforward',
          'Eliminates problematic data points',
          'Improves model stability'
        ],
        cons: [
          'Loss of potentially valid data',
          'Reduces dataset size',
          'May remove important extreme events'
        ],
        applicability: statistics.outlierPercentage < 5 ? 0.8 : 0.3,
        implementation: {
          method: 'filter',
          parameters: {
            removeIndices: outliers.map(o => o.index)
          },
          expectedOutcome: `Remove ${outliers.length} outlier points (${statistics.outlierPercentage.toFixed(1)}% of data)`
        }
      });
    }

    // Suggestion 2: Imputation
    suggestions.push({
      id: 'imputation',
      type: 'imputation',
      title: 'Impute Outliers',
      description: 'Replace outliers with interpolated or statistical values',
      pros: [
        'Preserves dataset size',
        'Maintains temporal continuity',
        'Less aggressive than removal'
      ],
      cons: [
        'May introduce artificial patterns',
        'Reduces data variance',
        'Requires careful method selection'
      ],
      applicability: 0.7,
      implementation: {
        method: 'interpolation',
        parameters: {
          method: 'linear',
          outlierIndices: outliers.map(o => o.index)
        },
        expectedOutcome: `Replace ${outliers.length} outliers with interpolated values`
      }
    });

    // Suggestion 3: Capping/Winsorization
    if (statistics.severityBreakdown.critical > 0 || statistics.severityBreakdown.high > 0) {
      suggestions.push({
        id: 'capping',
        type: 'capping',
        title: 'Cap Extreme Values',
        description: 'Limit outliers to threshold boundaries (Winsorization)',
        pros: [
          'Preserves all data points',
          'Reduces extreme value impact',
          'Maintains dataset structure'
        ],
        cons: [
          'Distorts original distribution',
          'May hide important signals',
          'Arbitrary threshold selection'
        ],
        applicability: 0.75,
        implementation: {
          method: 'winsorize',
          parameters: {
            lowerPercentile: 5,
            upperPercentile: 95
          },
          expectedOutcome: 'Cap values at 5th and 95th percentiles'
        }
      });
    }

    // Suggestion 4: Transformation
    if (statistics.outlierPercentage > 10) {
      suggestions.push({
        id: 'transformation',
        type: 'transformation',
        title: 'Transform Data',
        description: 'Apply mathematical transformation to reduce outlier impact',
        pros: [
          'Preserves all data',
          'Can normalize distribution',
          'Reduces skewness'
        ],
        cons: [
          'Changes data scale',
          'May complicate interpretation',
          'Requires inverse transformation for forecasts'
        ],
        applicability: 0.65,
        implementation: {
          method: 'log_transform',
          parameters: {
            transformation: 'log1p'
          },
          expectedOutcome: 'Apply log transformation to reduce outlier impact'
        }
      });
    }

    // Sort by applicability
    return suggestions.sort((a, b) => b.applicability - a.applicability);
  }

  /**
   * Calculate percentile value
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Calculate z-score for a value
   */
  private calculateZScore(value: number, values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (value - mean) / stdDev : 0;
  }

  /**
   * Get sensitivity multiplier for IQR method
   */
  private getSensitivityMultiplier(sensitivity: 'low' | 'medium' | 'high'): number {
    switch (sensitivity) {
      case 'low':
        return 3.0;  // Less sensitive, fewer outliers
      case 'medium':
        return 1.5;  // Standard IQR multiplier
      case 'high':
        return 1.0;  // More sensitive, more outliers
    }
  }

  /**
   * Get z-score threshold based on sensitivity
   */
  private getZScoreThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
    switch (sensitivity) {
      case 'low':
        return 3.5;  // Less sensitive
      case 'medium':
        return 3.0;  // Standard threshold
      case 'high':
        return 2.5;  // More sensitive
    }
  }

  /**
   * Get isolation forest threshold based on sensitivity
   */
  private getIsolationThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
    switch (sensitivity) {
      case 'low':
        return 0.7;  // Less sensitive
      case 'medium':
        return 0.6;  // Standard threshold
      case 'high':
        return 0.5;  // More sensitive
    }
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    outlierCount: number,
    totalPoints: number,
    outlierPercentage: number,
    severityBreakdown: { low: number; medium: number; high: number; critical: number }
  ): string {
    if (outlierCount === 0) {
      return `No outliers detected in ${totalPoints} data points. Data quality appears good.`;
    }

    const parts: string[] = [];
    parts.push(`Detected ${outlierCount} outlier${outlierCount > 1 ? 's' : ''} (${outlierPercentage.toFixed(1)}% of ${totalPoints} points)`);

    const severityParts: string[] = [];
    if (severityBreakdown.critical > 0) {
      severityParts.push(`${severityBreakdown.critical} critical`);
    }
    if (severityBreakdown.high > 0) {
      severityParts.push(`${severityBreakdown.high} high`);
    }
    if (severityBreakdown.medium > 0) {
      severityParts.push(`${severityBreakdown.medium} medium`);
    }
    if (severityBreakdown.low > 0) {
      severityParts.push(`${severityBreakdown.low} low`);
    }

    if (severityParts.length > 0) {
      parts.push(`Severity: ${severityParts.join(', ')}`);
    }

    return parts.join('. ') + '.';
  }
}

// Export singleton instance
export const outlierDetector = new OutlierDetector();
