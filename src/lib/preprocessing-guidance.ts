import { DataPoint } from './statistical-analysis';
import { OutlierDetectionResult, OutlierPoint, PreprocessingSuggestion } from './outlier-detector';

/**
 * Preprocessing step in a workflow
 */
export interface PreprocessingStep {
  id: string;
  suggestionId: string;
  type: 'removal' | 'imputation' | 'transformation' | 'capping';
  order: number;
  parameters: Record<string, any>;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: PreprocessingResult;
}

/**
 * Result of a preprocessing step
 */
export interface PreprocessingResult {
  success: boolean;
  processedData: DataPoint[];
  recordsAffected: number;
  recordsRemoved: number;
  recordsModified: number;
  qualityImprovement: number;
  message: string;
  errors?: string[];
}

/**
 * Complete preprocessing workflow
 */
export interface PreprocessingWorkflow {
  id: string;
  steps: PreprocessingStep[];
  estimatedImpact: {
    dataQualityImprovement: number;
    recordsAffected: number;
    forecastAccuracyGain: number;
  };
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Validation report comparing original and processed data
 */
export interface ValidationReport {
  isValid: boolean;
  improvements: {
    outlierReduction: number;
    varianceReduction: number;
    normalityImprovement: number;
    dataQualityScore: number;
  };
  concerns: string[];
  recommendations: string[];
  statistics: {
    original: DataStatistics;
    processed: DataStatistics;
  };
}

/**
 * Statistical summary of data
 */
export interface DataStatistics {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  outlierCount: number;
  outlierPercentage: number;
  skewness: number;
  kurtosis: number;
}

/**
 * Configuration for preprocessing guidance
 */
export interface PreprocessingConfig {
  maxOutlierPercentageForRemoval: number;
  minDataPointsRequired: number;
  preferredMethods: ('removal' | 'imputation' | 'transformation' | 'capping')[];
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
}

/**
 * Data Preprocessing Guidance System
 * Provides step-by-step guidance for data cleaning and preparation
 */
export class PreprocessingGuidanceSystem {
  private config: PreprocessingConfig;

  constructor(config?: Partial<PreprocessingConfig>) {
    this.config = {
      maxOutlierPercentageForRemoval: 5,
      minDataPointsRequired: 30,
      preferredMethods: ['capping', 'imputation', 'removal', 'transformation'],
      aggressiveness: 'moderate',
      ...config
    };
  }

  /**
   * Generate preprocessing suggestions based on outlier detection results
   */
  generateSuggestions(
    outliers: OutlierDetectionResult,
    data: DataPoint[]
  ): PreprocessingSuggestion[] {
    const suggestions: PreprocessingSuggestion[] = [];
    const { statistics } = outliers;

    // Suggestion 1: Removal (only if outlier percentage is low)
    if (statistics.outlierPercentage <= this.config.maxOutlierPercentageForRemoval) {
      const applicability = this.calculateRemovalApplicability(statistics, data.length);
      suggestions.push({
        id: 'removal',
        type: 'removal',
        title: 'Remove Outlier Data Points',
        description: `Remove ${statistics.outlierCount} detected outlier points from the dataset. This is recommended when outliers represent data errors or anomalies.`,
        pros: [
          'Simple and straightforward approach',
          'Completely eliminates problematic data points',
          'Improves model stability and reduces noise',
          'Prevents outliers from skewing analysis results'
        ],
        cons: [
          'Permanent loss of potentially valid data',
          `Reduces dataset size by ${statistics.outlierPercentage.toFixed(1)}%`,
          'May remove important extreme events or rare occurrences',
          'Could introduce bias if outliers are legitimate values'
        ],
        applicability,
        implementation: {
          method: 'filter',
          parameters: {
            removeIndices: outliers.outliers.map(o => o.index),
            outlierCount: statistics.outlierCount
          },
          expectedOutcome: `Dataset will be reduced from ${data.length} to ${data.length - statistics.outlierCount} points (${statistics.outlierPercentage.toFixed(1)}% reduction)`
        }
      });
    }

    // Suggestion 2: Imputation (always available)
    const imputationApplicability = this.calculateImputationApplicability(statistics, data.length);
    suggestions.push({
      id: 'imputation',
      type: 'imputation',
      title: 'Replace Outliers with Interpolated Values',
      description: `Replace ${statistics.outlierCount} outliers with statistically derived values using interpolation or mean/median substitution.`,
      pros: [
        'Preserves dataset size and structure',
        'Maintains temporal continuity in time series',
        'Less aggressive than complete removal',
        'Reduces impact of extreme values while keeping data points'
      ],
      cons: [
        'May introduce artificial patterns or smoothing',
        'Reduces natural data variance and volatility',
        'Requires careful selection of imputation method',
        'Could mask legitimate extreme events'
      ],
      applicability: imputationApplicability,
      implementation: {
        method: 'interpolation',
        parameters: {
          method: 'linear',
          outlierIndices: outliers.outliers.map(o => o.index),
          fallbackMethod: 'median'
        },
        expectedOutcome: `${statistics.outlierCount} outlier values will be replaced with interpolated values based on surrounding data points`
      }
    });

    // Suggestion 3: Capping/Winsorization (recommended for extreme outliers)
    if (statistics.severityBreakdown.critical > 0 || statistics.severityBreakdown.high > 0) {
      const cappingApplicability = this.calculateCappingApplicability(statistics);
      suggestions.push({
        id: 'capping',
        type: 'capping',
        title: 'Cap Extreme Values (Winsorization)',
        description: `Limit outlier values to threshold boundaries. ${statistics.severityBreakdown.critical + statistics.severityBreakdown.high} extreme outliers will be capped to acceptable ranges.`,
        pros: [
          'Preserves all data points in the dataset',
          'Reduces impact of extreme values on analysis',
          'Maintains overall dataset structure and size',
          'Balances between removal and keeping original data'
        ],
        cons: [
          'Distorts the original data distribution',
          'May hide important signals or trends',
          'Threshold selection can be somewhat arbitrary',
          'Changes the actual values in the dataset'
        ],
        applicability: cappingApplicability,
        implementation: {
          method: 'winsorize',
          parameters: {
            lowerPercentile: 5,
            upperPercentile: 95,
            affectedOutliers: statistics.severityBreakdown.critical + statistics.severityBreakdown.high
          },
          expectedOutcome: 'Values below 5th percentile and above 95th percentile will be capped to those thresholds'
        }
      });
    }

    // Suggestion 4: Transformation (recommended for high outlier percentage)
    if (statistics.outlierPercentage > 10) {
      const transformationApplicability = this.calculateTransformationApplicability(statistics);
      suggestions.push({
        id: 'transformation',
        type: 'transformation',
        title: 'Apply Mathematical Transformation',
        description: `Transform data using logarithmic or other mathematical functions to reduce outlier impact. Recommended when outliers represent natural data skewness.`,
        pros: [
          'Preserves all original data points',
          'Can normalize skewed distributions',
          'Reduces impact of outliers naturally',
          'Often improves model performance'
        ],
        cons: [
          'Changes the scale and interpretation of data',
          'May complicate result interpretation',
          'Requires inverse transformation for forecasts',
          'Not suitable for all data types'
        ],
        applicability: transformationApplicability,
        implementation: {
          method: 'log_transform',
          parameters: {
            transformation: 'log1p',
            handleNegatives: true
          },
          expectedOutcome: 'Data will be log-transformed to reduce skewness and outlier impact'
        }
      });
    }

    // Sort suggestions by applicability score
    return suggestions.sort((a, b) => b.applicability - a.applicability);
  }

  /**
   * Create a preprocessing workflow from selected suggestions
   */
  createWorkflow(
    selectedSuggestions: PreprocessingSuggestion[],
    data: DataPoint[],
    outliers: OutlierDetectionResult
  ): PreprocessingWorkflow {
    // Create steps from suggestions
    const steps: PreprocessingStep[] = selectedSuggestions.map((suggestion, index) => ({
      id: `step-${index + 1}`,
      suggestionId: suggestion.id,
      type: suggestion.type,
      order: index + 1,
      parameters: suggestion.implementation.parameters,
      description: suggestion.title,
      status: 'pending'
    }));

    // Estimate impact
    const estimatedImpact = this.estimateWorkflowImpact(selectedSuggestions, data, outliers);

    return {
      id: `workflow-${Date.now()}`,
      steps,
      estimatedImpact,
      status: 'draft',
      createdAt: new Date()
    };
  }

  /**
   * Execute a single preprocessing step
   */
  executeStep(step: PreprocessingStep, data: DataPoint[]): PreprocessingResult {
    try {
      step.status = 'in_progress';

      let processedData: DataPoint[];
      let recordsAffected = 0;
      let recordsRemoved = 0;
      let recordsModified = 0;

      switch (step.type) {
        case 'removal':
          ({ processedData, recordsRemoved } = this.executeRemoval(data, step.parameters));
          recordsAffected = recordsRemoved;
          break;

        case 'imputation':
          ({ processedData, recordsModified } = this.executeImputation(data, step.parameters));
          recordsAffected = recordsModified;
          break;

        case 'capping':
          ({ processedData, recordsModified } = this.executeCapping(data, step.parameters));
          recordsAffected = recordsModified;
          break;

        case 'transformation':
          ({ processedData, recordsModified } = this.executeTransformation(data, step.parameters));
          recordsAffected = recordsModified;
          break;

        default:
          throw new Error(`Unknown preprocessing type: ${step.type}`);
      }

      // Calculate quality improvement
      const qualityImprovement = this.calculateQualityImprovement(data, processedData);

      step.status = 'completed';

      const result: PreprocessingResult = {
        success: true,
        processedData,
        recordsAffected,
        recordsRemoved,
        recordsModified,
        qualityImprovement,
        message: `Successfully executed ${step.type} preprocessing step`
      };

      step.result = result;
      return result;

    } catch (error) {
      step.status = 'failed';
      return {
        success: false,
        processedData: data,
        recordsAffected: 0,
        recordsRemoved: 0,
        recordsModified: 0,
        qualityImprovement: 0,
        message: `Failed to execute ${step.type} step`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate preprocessing results
   */
  validateResults(original: DataPoint[], processed: DataPoint[]): ValidationReport {
    const originalStats = this.calculateStatistics(original);
    const processedStats = this.calculateStatistics(processed);

    // Calculate improvements
    const outlierReduction = originalStats.outlierPercentage - processedStats.outlierPercentage;
    const varianceReduction = ((originalStats.stdDev - processedStats.stdDev) / originalStats.stdDev) * 100;
    const normalityImprovement = this.calculateNormalityImprovement(originalStats, processedStats);
    const dataQualityScore = this.calculateDataQualityScore(processedStats);

    // Identify concerns
    const concerns: string[] = [];
    if (processed.length < original.length * 0.7) {
      concerns.push('More than 30% of data was removed. Consider using less aggressive preprocessing.');
    }
    if (processedStats.stdDev < originalStats.stdDev * 0.5) {
      concerns.push('Variance reduced by more than 50%. Data may be over-smoothed.');
    }
    if (processed.length < this.config.minDataPointsRequired) {
      concerns.push(`Dataset now has fewer than ${this.config.minDataPointsRequired} points. May not be sufficient for reliable forecasting.`);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (outlierReduction > 50) {
      recommendations.push('Excellent outlier reduction. Data quality significantly improved.');
    }
    if (dataQualityScore > 80) {
      recommendations.push('Data is now ready for forecasting. Proceed with model training.');
    } else if (dataQualityScore > 60) {
      recommendations.push('Data quality is acceptable. Consider additional preprocessing if needed.');
    } else {
      recommendations.push('Data quality could be improved further. Consider additional preprocessing steps.');
    }

    return {
      isValid: concerns.length === 0 && dataQualityScore > 50,
      improvements: {
        outlierReduction,
        varianceReduction,
        normalityImprovement,
        dataQualityScore
      },
      concerns,
      recommendations,
      statistics: {
        original: originalStats,
        processed: processedStats
      }
    };
  }

  // Private helper methods

  /**
   * Execute removal preprocessing
   */
  private executeRemoval(
    data: DataPoint[],
    parameters: Record<string, any>
  ): { processedData: DataPoint[]; recordsRemoved: number } {
    const removeIndices = new Set(parameters.removeIndices as number[]);
    const processedData = data.filter((_, index) => !removeIndices.has(index));
    return {
      processedData,
      recordsRemoved: data.length - processedData.length
    };
  }

  /**
   * Execute imputation preprocessing
   */
  private executeImputation(
    data: DataPoint[],
    parameters: Record<string, any>
  ): { processedData: DataPoint[]; recordsModified: number } {
    const outlierIndices = new Set(parameters.outlierIndices as number[]);
    const method = parameters.method as string;
    const processedData = [...data];
    let recordsModified = 0;

    outlierIndices.forEach(index => {
      if (index >= 0 && index < data.length) {
        const imputedValue = this.imputeValue(data, index, method);
        processedData[index] = {
          ...data[index],
          value: imputedValue
        };
        recordsModified++;
      }
    });

    return { processedData, recordsModified };
  }

  /**
   * Execute capping preprocessing
   */
  private executeCapping(
    data: DataPoint[],
    parameters: Record<string, any>
  ): { processedData: DataPoint[]; recordsModified: number } {
    const lowerPercentile = parameters.lowerPercentile as number;
    const upperPercentile = parameters.upperPercentile as number;

    const values = data.map(d => d.value);
    const sortedValues = [...values].sort((a, b) => a - b);
    
    const lowerBound = this.calculatePercentile(sortedValues, lowerPercentile);
    const upperBound = this.calculatePercentile(sortedValues, upperPercentile);

    let recordsModified = 0;
    const processedData = data.map(point => {
      if (point.value < lowerBound) {
        recordsModified++;
        return { ...point, value: lowerBound };
      } else if (point.value > upperBound) {
        recordsModified++;
        return { ...point, value: upperBound };
      }
      return point;
    });

    return { processedData, recordsModified };
  }

  /**
   * Execute transformation preprocessing
   */
  private executeTransformation(
    data: DataPoint[],
    parameters: Record<string, any>
  ): { processedData: DataPoint[]; recordsModified: number } {
    const transformation = parameters.transformation as string;
    
    const processedData = data.map(point => {
      let transformedValue = point.value;
      
      switch (transformation) {
        case 'log1p':
          transformedValue = Math.log1p(Math.max(0, point.value));
          break;
        case 'sqrt':
          transformedValue = Math.sqrt(Math.max(0, point.value));
          break;
        case 'square':
          transformedValue = point.value * point.value;
          break;
        case 'boxcox':
          // Simplified Box-Cox with lambda = 0.5
          transformedValue = point.value > 0 ? Math.sqrt(point.value) : 0;
          break;
        default:
          transformedValue = point.value;
      }
      
      return { ...point, value: transformedValue };
    });

    return { processedData, recordsModified: data.length };
  }

  /**
   * Impute a single value using the specified method
   */
  private imputeValue(data: DataPoint[], index: number, method: string): number {
    switch (method) {
      case 'linear':
        return this.linearInterpolation(data, index);
      case 'mean':
        return this.calculateMean(data.map(d => d.value));
      case 'median':
        return this.calculateMedian(data.map(d => d.value));
      default:
        return this.linearInterpolation(data, index);
    }
  }

  /**
   * Linear interpolation for a data point
   */
  private linearInterpolation(data: DataPoint[], index: number): number {
    // Find nearest non-outlier neighbors
    let prevIndex = index - 1;
    let nextIndex = index + 1;

    while (prevIndex >= 0 && this.isOutlier(data[prevIndex].value, data)) {
      prevIndex--;
    }
    while (nextIndex < data.length && this.isOutlier(data[nextIndex].value, data)) {
      nextIndex++;
    }

    if (prevIndex < 0 && nextIndex >= data.length) {
      // No valid neighbors, use median
      return this.calculateMedian(data.map(d => d.value));
    } else if (prevIndex < 0) {
      return data[nextIndex].value;
    } else if (nextIndex >= data.length) {
      return data[prevIndex].value;
    } else {
      // Linear interpolation
      const weight = (index - prevIndex) / (nextIndex - prevIndex);
      return data[prevIndex].value * (1 - weight) + data[nextIndex].value * weight;
    }
  }

  /**
   * Check if a value is an outlier (simple z-score check)
   */
  private isOutlier(value: number, data: DataPoint[]): boolean {
    const values = data.map(d => d.value);
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);
    const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;
    return zScore > 3;
  }

  /**
   * Calculate statistics for a dataset
   */
  private calculateStatistics(data: DataPoint[]): DataStatistics {
    const values = data.map(d => d.value);
    const mean = this.calculateMean(values);
    const median = this.calculateMedian(values);
    const stdDev = this.calculateStdDev(values, mean);
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Count outliers using IQR method
    const q1 = this.calculatePercentile(sortedValues, 25);
    const q3 = this.calculatePercentile(sortedValues, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outlierCount = values.filter(v => v < lowerBound || v > upperBound).length;

    return {
      count: data.length,
      mean,
      median,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
      outlierCount,
      outlierPercentage: (outlierCount / data.length) * 100,
      skewness: this.calculateSkewness(values, mean, stdDev),
      kurtosis: this.calculateKurtosis(values, mean, stdDev)
    };
  }

  /**
   * Calculate quality improvement between original and processed data
   */
  private calculateQualityImprovement(original: DataPoint[], processed: DataPoint[]): number {
    const originalStats = this.calculateStatistics(original);
    const processedStats = this.calculateStatistics(processed);

    // Quality improvement based on outlier reduction and variance stabilization
    const outlierImprovement = Math.max(0, originalStats.outlierPercentage - processedStats.outlierPercentage);
    const varianceImprovement = Math.max(0, (originalStats.stdDev - processedStats.stdDev) / originalStats.stdDev * 50);
    
    return Math.min(100, outlierImprovement * 2 + varianceImprovement);
  }

  /**
   * Estimate workflow impact
   */
  private estimateWorkflowImpact(
    suggestions: PreprocessingSuggestion[],
    data: DataPoint[],
    outliers: OutlierDetectionResult
  ): { dataQualityImprovement: number; recordsAffected: number; forecastAccuracyGain: number } {
    let dataQualityImprovement = 0;
    let recordsAffected = 0;

    suggestions.forEach(suggestion => {
      // Estimate based on suggestion type and applicability
      dataQualityImprovement += suggestion.applicability * 20;
      
      if (suggestion.type === 'removal') {
        recordsAffected += outliers.statistics.outlierCount;
      } else {
        recordsAffected += outliers.statistics.outlierCount;
      }
    });

    // Cap quality improvement at 100%
    dataQualityImprovement = Math.min(100, dataQualityImprovement);

    // Estimate forecast accuracy gain (conservative estimate)
    const forecastAccuracyGain = dataQualityImprovement * 0.3; // 30% of quality improvement

    return {
      dataQualityImprovement,
      recordsAffected: Math.min(recordsAffected, data.length),
      forecastAccuracyGain
    };
  }

  /**
   * Calculate applicability scores for different preprocessing methods
   */
  private calculateRemovalApplicability(
    statistics: OutlierDetectionResult['statistics'],
    dataLength: number
  ): number {
    // High applicability if outlier percentage is very low
    if (statistics.outlierPercentage < 2) return 0.9;
    if (statistics.outlierPercentage < 5) return 0.7;
    if (statistics.outlierPercentage < 10) return 0.4;
    return 0.2;
  }

  private calculateImputationApplicability(
    statistics: OutlierDetectionResult['statistics'],
    dataLength: number
  ): number {
    // Generally good applicability for moderate outlier counts
    if (statistics.outlierPercentage < 10) return 0.8;
    if (statistics.outlierPercentage < 20) return 0.6;
    return 0.4;
  }

  private calculateCappingApplicability(
    statistics: OutlierDetectionResult['statistics']
  ): number {
    // High applicability when there are extreme outliers
    const extremeCount = statistics.severityBreakdown.critical + statistics.severityBreakdown.high;
    const extremePercentage = (extremeCount / statistics.totalPoints) * 100;
    
    if (extremePercentage > 5) return 0.9;
    if (extremePercentage > 2) return 0.75;
    return 0.6;
  }

  private calculateTransformationApplicability(
    statistics: OutlierDetectionResult['statistics']
  ): number {
    // High applicability when outlier percentage is high (suggests skewed distribution)
    if (statistics.outlierPercentage > 20) return 0.8;
    if (statistics.outlierPercentage > 15) return 0.65;
    if (statistics.outlierPercentage > 10) return 0.5;
    return 0.3;
  }

  /**
   * Calculate normality improvement
   */
  private calculateNormalityImprovement(
    originalStats: DataStatistics,
    processedStats: DataStatistics
  ): number {
    // Improvement based on reduction in skewness and kurtosis
    const skewnessImprovement = Math.max(0, Math.abs(originalStats.skewness) - Math.abs(processedStats.skewness));
    const kurtosisImprovement = Math.max(0, Math.abs(originalStats.kurtosis - 3) - Math.abs(processedStats.kurtosis - 3));
    
    return (skewnessImprovement * 30 + kurtosisImprovement * 20);
  }

  /**
   * Calculate overall data quality score
   */
  private calculateDataQualityScore(stats: DataStatistics): number {
    let score = 100;

    // Penalize for outliers
    score -= stats.outlierPercentage * 2;

    // Penalize for high skewness
    score -= Math.abs(stats.skewness) * 5;

    // Penalize for high kurtosis deviation from normal (3)
    score -= Math.abs(stats.kurtosis - 3) * 3;

    // Penalize for very low data count
    if (stats.count < 30) {
      score -= (30 - stats.count) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Statistical calculation helpers
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStdDev(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

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

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum;
    const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    return kurtosis - correction;
  }
}

// Export singleton instance
export const preprocessingGuidanceSystem = new PreprocessingGuidanceSystem();
