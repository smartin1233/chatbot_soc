export interface DataPoint {
  date: Date;
  value: number;
  orders: number;
}

// Separated data description interface (without outliers)
export interface StatisticalSummary {
  descriptive: {
    mean: number;
    median: number;
    mode: number[];
    standardDeviation: number;
    variance: number;
    quartiles: {
      q1: number;
      q2: number;
      q3: number;
    };
    range: {
      min: number;
      max: number;
    };
  };
  distribution: {
    skewness: number;
    kurtosis: number;
    normality: {
      statistic: number;
      pValue: number;
      isNormal: boolean;
    };
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    confidence: number;
  };
  seasonality: {
    detected: boolean;
    periods: SeasonalPeriod[];
    strength: number;
  };
}

export interface SeasonalPeriod {
  period: number;
  strength: number;
  confidence: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  confidence: number;
  linearRegression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  mannKendall?: {
    tau: number;
    pValue: number;
    trend: 'increasing' | 'decreasing' | 'no trend';
  };
}

export interface SeasonalityAnalysis {
  detected: boolean;
  periods: SeasonalPeriod[];
  strength: number;
  dominantPeriod?: number;
}

export interface DataQualityReport {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface OutlierDetectionResult {
  method: 'iqr' | 'zscore' | 'mad';
  indices: number[];
  values: number[];
  thresholds?: { lower: number; upper: number };
  zscoreThreshold?: number;
}

export class StatisticalAnalyzer {
  /**
   * Generate comprehensive statistical summary WITHOUT outlier detection
   * This method focuses on data description only
   */
  generateSummary(dataPoints: DataPoint[], includeOutliers: boolean = false): StatisticalSummary {
    const values = dataPoints.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    // Descriptive statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    // Quartiles
    const q1 = this.calculatePercentile(sorted, 25);
    const q2 = this.calculatePercentile(sorted, 50); // median
    const q3 = this.calculatePercentile(sorted, 75);
    
    // Mode calculation
    const mode = this.calculateMode(values);
    
    // Distribution analysis
    const skewness = this.calculateSkewness(values, mean, standardDeviation);
    const kurtosis = this.calculateKurtosis(values, mean, standardDeviation);
    const normality = this.testNormality(values, mean, standardDeviation);
    
    // Trend analysis
    const trendAnalysis = this.analyzeTrend(dataPoints);
    
    // Seasonality analysis
    const seasonalityAnalysis = this.analyzeSeasonality(dataPoints);
    
    return {
      descriptive: {
        mean,
        median: q2,
        mode,
        standardDeviation,
        variance,
        quartiles: { q1, q2, q3 },
        range: {
          min: sorted[0],
          max: sorted[n - 1]
        }
      },
      distribution: {
        skewness,
        kurtosis,
        normality
      },
      trend: {
        direction: trendAnalysis.direction,
        strength: trendAnalysis.strength,
        confidence: trendAnalysis.confidence
      },
      seasonality: {
        detected: seasonalityAnalysis.detected,
        periods: seasonalityAnalysis.periods,
        strength: seasonalityAnalysis.strength
      }
    };
  }

  /**
   * Dedicated outlier detection (IQR by default, optional MAD/Z-score)
   * Only call this when the user asks about outliers/anomalies/quality checks.
   */
  detectOutliers(values: number[], method: 'iqr' | 'zscore' | 'mad' = 'iqr', zThreshold: number = 3): OutlierDetectionResult {
    const result: OutlierDetectionResult = { method, indices: [], values: [] };
    if (!values || values.length === 0) return result;

    if (method === 'iqr') {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = this.calculatePercentile(sorted, 25);
      const q3 = this.calculatePercentile(sorted, 75);
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      values.forEach((v, i) => {
        if (v < lower || v > upper) {
          result.indices.push(i);
          result.values.push(v);
        }
      });
      result.thresholds = { lower, upper };
      return result;
    }

    if (method === 'mad') {
      const median = this.calculatePercentile([...values].sort((a,b)=>a-b), 50);
      const absDev = values.map(v => Math.abs(v - median));
      const mad = this.calculatePercentile([...absDev].sort((a,b)=>a-b), 50) || 1e-9;
      values.forEach((v, i) => {
        const modifiedZ = 0.6745 * (v - median) / mad;
        if (Math.abs(modifiedZ) > 3.5) {
          result.indices.push(i);
          result.values.push(v);
        }
      });
      return result;
    }

    // z-score
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length) || 1e-9;
    values.forEach((v, i) => {
      const z = (v - mean) / std;
      if (Math.abs(z) > zThreshold) {
        result.indices.push(i);
        result.values.push(v);
      }
    });
    result.zscoreThreshold = zThreshold;
    return result;
  }

  /**
   * Analyze trend with confidence scoring
   */
  analyzeTrend(dataPoints: DataPoint[]): TrendAnalysis {
    const values = dataPoints.map(d => d.value);
    const x = dataPoints.map((_, i) => i);
    const n = values.length;
    
    // Linear regression
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssRes = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = ssTotal > 0 ? 1 - (ssRes / ssTotal) : 0;
    
    // Mann-Kendall test for trend significance
    const mannKendall = this.mannKendallTest(values);
    
    // Determine trend direction with threshold
    const slopeThreshold = Math.abs(yMean) * 0.01; // 1% of mean
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < slopeThreshold) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }
    
    // Trend strength (normalized slope)
    const strength = Math.abs(slope) / (yMean || 1);
    
    // Confidence combines R-squared and Mann-Kendall p-value
    const confidence = rSquared * (1 - mannKendall.pValue);
    
    return {
      direction,
      strength,
      confidence,
      linearRegression: {
        slope,
        intercept,
        rSquared
      },
      mannKendall
    };
  }

  /**
   * Detect seasonality with multiple period testing
   */
  analyzeSeasonality(dataPoints: DataPoint[]): SeasonalityAnalysis {
    const values = dataPoints.map(d => d.value);
    const n = values.length;
    
    // Test common periods: daily (7), monthly (30), quarterly (90)
    const periodsToTest = [7, 14, 30, 60, 90];
    const periods: SeasonalPeriod[] = [];
    
    for (const period of periodsToTest) {
      if (period < n / 2) {
        const acf = this.calculateAutocorrelation(values, period);
        const confidence = this.calculateSeasonalityConfidence(values, period);
        
        if (acf > 0.2) { // Threshold for considering seasonality
          periods.push({
            period,
            strength: acf,
            confidence
          });
        }
      }
    }
    
    // Sort by strength
    periods.sort((a, b) => b.strength - a.strength);
    
    const detected = periods.length > 0 && periods[0].strength > 0.3;
    const strength = detected ? periods[0].strength : 0;
    const dominantPeriod = detected ? periods[0].period : undefined;
    
    return {
      detected,
      periods,
      strength,
      dominantPeriod
    };
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
   * Calculate mode (most frequent values)
   */
  private calculateMode(values: number[]): number[] {
    const frequency = new Map<number, number>();
    
    for (const value of values) {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    }
    
    const maxFreq = Math.max(...frequency.values());
    const modes = Array.from(frequency.entries())
      .filter(([_, freq]) => freq === maxFreq)
      .map(([value, _]) => value);
    
    // Return mode only if it appears more than once
    return maxFreq > 1 ? modes : [];
  }

  /**
   * Calculate skewness (distribution asymmetry)
   */
  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    if (n < 3 || stdDev === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * Calculate kurtosis (distribution tailedness)
   */
  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    if (n < 4 || stdDev === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum;
    const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    
    return kurtosis - correction; // Excess kurtosis
  }

  /**
   * Test for normality using Shapiro-Wilk approximation
   */
  private testNormality(values: number[], mean: number, stdDev: number): {
    statistic: number;
    pValue: number;
    isNormal: boolean;
  } {
    const n = values.length;
    
    // For small samples, use simplified Anderson-Darling test
    if (n < 3) {
      return { statistic: 0, pValue: 1, isNormal: true };
    }
    
    // Standardize values
    const standardized = values.map(v => (v - mean) / (stdDev || 1));
    const sorted = [...standardized].sort((a, b) => a - b);
    
    // Calculate test statistic (simplified)
    let statistic = 0;
    for (let i = 0; i < n; i++) {
      const z = sorted[i];
      const phi = this.normalCDF(z);
      if (phi > 0 && phi < 1) {
        statistic += Math.pow(phi - (i + 0.5) / n, 2);
      }
    }
    statistic = statistic / n;
    
    // Approximate p-value based on statistic
    const pValue = Math.exp(-statistic * n * 10);
    const isNormal = pValue > 0.05;
    
    return { statistic, pValue, isNormal };
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Mann-Kendall test for trend significance
   */
  private mannKendallTest(values: number[]): {
    tau: number;
    pValue: number;
    trend: 'increasing' | 'decreasing' | 'no trend';
  } {
    const n = values.length;
    let s = 0;
    
    // Calculate S statistic
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        s += Math.sign(values[j] - values[i]);
      }
    }
    
    // Calculate variance
    const varS = (n * (n - 1) * (2 * n + 5)) / 18;
    
    // Calculate Z statistic
    let z: number;
    if (s > 0) {
      z = (s - 1) / Math.sqrt(varS);
    } else if (s < 0) {
      z = (s + 1) / Math.sqrt(varS);
    } else {
      z = 0;
    }
    
    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    
    // Kendall's tau
    const tau = (2 * s) / (n * (n - 1));
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'no trend';
    if (pValue < 0.05) {
      trend = tau > 0 ? 'increasing' : 'decreasing';
    } else {
      trend = 'no trend';
    }
    
    return { tau, pValue, trend };
  }

  /**
   * Calculate autocorrelation for lag
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length || lag < 1) return 0;
    
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate confidence for seasonality detection
   */
  private calculateSeasonalityConfidence(values: number[], period: number): number {
    const n = values.length;
    const numCycles = Math.floor(n / period);
    
    if (numCycles < 2) return 0;
    
    // Calculate consistency across cycles
    const cycles: number[][] = [];
    for (let i = 0; i < numCycles; i++) {
      const cycle = values.slice(i * period, (i + 1) * period);
      cycles.push(cycle);
    }
    
    // Calculate average correlation between cycles
    let totalCorr = 0;
    let count = 0;
    
    for (let i = 0; i < cycles.length - 1; i++) {
      for (let j = i + 1; j < cycles.length; j++) {
        const corr = this.calculateCorrelation(cycles[i], cycles[j]);
        totalCorr += corr;
        count++;
      }
    }
    
    return count > 0 ? totalCorr / count : 0;
  }

  /**
   * Calculate Pearson correlation between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sumXSq = 0;
    let sumYSq = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumXSq += dx * dx;
      sumYSq += dy * dy;
    }
    
    const denominator = Math.sqrt(sumXSq * sumYSq);
    return denominator > 0 ? numerator / denominator : 0;
  }
}

export class InsightsGenerator {
  generateDataQualityReport(dataPoints: DataPoint[]): DataQualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for missing values
    const hasNullValues = dataPoints.some(d => d.value === null || d.value === undefined);
    if (hasNullValues) {
      issues.push('Missing values detected');
      recommendations.push('Handle missing values through imputation or removal');
      score -= 20;
    }

    // Check data sufficiency
    if (dataPoints.length < 30) {
      issues.push('Limited data points available');
      recommendations.push('Collect more data for robust analysis');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  generateForecastInsights(summary: StatisticalSummary): {
    opportunities: string[];
    riskFactors: string[];
    actionableRecommendations: string[];
  } {
    const opportunities: string[] = [];
    const riskFactors: string[] = [];
    const actionableRecommendations: string[] = [];

    // Trend-based insights
    if (summary.trend.direction === 'increasing' && summary.trend.confidence > 0.7) {
      opportunities.push('Strong upward trend detected - growth opportunity');
      actionableRecommendations.push('Consider scaling operations to meet increasing demand');
    } else if (summary.trend.direction === 'decreasing' && summary.trend.confidence > 0.7) {
      riskFactors.push('Declining trend detected');
      actionableRecommendations.push('Investigate root causes and implement corrective measures');
    }

    // Seasonality insights
    if (summary.seasonality.detected) {
      opportunities.push(`Seasonal pattern identified (${summary.seasonality.periods[0]?.period}-period cycle)`);
      actionableRecommendations.push('Plan inventory and resources based on seasonal patterns');
    }

    // Volatility insights
    const cv = summary.descriptive.standardDeviation / summary.descriptive.mean;
    if (cv > 0.3) {
      riskFactors.push('High volatility in data');
      actionableRecommendations.push('Monitor closely and consider risk mitigation strategies');
    }

    // Distribution insights
    if (!summary.distribution.normality.isNormal) {
      actionableRecommendations.push('Data shows non-normal distribution - consider appropriate forecasting methods');
    }

    return {
      opportunities,
      riskFactors,
      actionableRecommendations
    };
  }
}

export const statisticalAnalyzer = new StatisticalAnalyzer();
export const insightsGenerator = new InsightsGenerator();
