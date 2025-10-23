/**
 * Hallucination Prevention Engine
 * 
 * Ensures all responses are grounded in actual data and prevents speculative or incorrect information.
 * Implements source verification, confidence thresholding, uncertainty quantification, and response validation.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { WeeklyData, ForecastData, OutlierData, ForecastMetrics } from './types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DataSource {
  type: 'historical_data' | 'forecast_data' | 'statistical_analysis' | 'model_metrics' | 'outlier_detection';
  reference: string;
  dataPoints?: number;
  dateRange?: { start: Date; end: Date };
  confidence?: number;
}

export interface ValidationIssue {
  type: 'ungrounded_claim' | 'speculative_content' | 'missing_source' | 'contradictory_info' | 'low_confidence';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: string;
  suggestedFix?: string;
}

export interface ResponseValidation {
  isValid: boolean;
  issues: ValidationIssue[];
  corrections: string[];
  confidence: number;
  groundedClaims: number;
  totalClaims: number;
}

export interface HallucinationCheck {
  isGrounded: boolean;
  confidence: number;
  sources: DataSource[];
  uncertainties: string[];
  recommendations: string[];
}

export interface UncertaintyMetrics {
  overallConfidence: number;
  dataQualityScore: number;
  modelReliability: number;
  uncertaintyFactors: UncertaintyFactor[];
  recommendations: string[];
}

export interface UncertaintyFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  mitigation?: string;
}

export interface AnalysisResult {
  type: 'statistical' | 'forecast' | 'outlier' | 'trend';
  data: any;
  confidence: number;
  sources: DataSource[];
  metadata?: Record<string, any>;
}

export interface UserContext {
  sessionId: string;
  selectedBuId?: string;
  selectedLobId?: string;
  uploadedData?: WeeklyData[];
  forecastData?: ForecastData[];
  outlierData?: OutlierData[];
  forecastMetrics?: ForecastMetrics;
  conversationHistory?: any[];
}

// ============================================================================
// Hallucination Prevention Engine
// ============================================================================

export class HallucinationPreventionEngine {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MIN_DATA_POINTS = 10;
  private readonly CLAIM_PATTERNS = [
    /the (data|forecast|trend|pattern) (shows|indicates|suggests|reveals)/gi,
    /there (is|are) (a|an)? ?(significant|notable|clear|strong)/gi,
    /(increase|decrease|growth|decline) of (\d+\.?\d*%?)/gi,
    /the (average|mean|median|maximum|minimum) (is|was|will be)/gi,
    /(forecast|predict|expect|anticipate) (a|an)? ?(\d+\.?\d*)/gi,
  ];

  /**
   * Validates a response against actual data and context
   * Requirement 6.1: Only use information from verified data sources
   */
  validateResponse(
    response: string,
    context: UserContext,
    data: WeeklyData[]
  ): ResponseValidation {
    const issues: ValidationIssue[] = [];
    const corrections: string[] = [];
    let groundedClaims = 0;
    let totalClaims = 0;

    // Extract claims from response
    const claims = this.extractClaims(response);
    totalClaims = claims.length;

    // Validate each claim against available data
    for (const claim of claims) {
      const claimValidation = this.validateClaim(claim, context, data);
      
      if (claimValidation.isGrounded) {
        groundedClaims++;
      } else {
        issues.push({
          type: 'ungrounded_claim',
          severity: 'high',
          message: `Claim not supported by available data: "${claim}"`,
          suggestedFix: claimValidation.recommendations[0] || 'Remove or rephrase with uncertainty indicators',
        });
        
        if (claimValidation.recommendations.length > 0) {
          corrections.push(claimValidation.recommendations[0]);
        }
      }
    }

    // Check for speculative language
    const speculativeIssues = this.detectSpeculativeContent(response);
    issues.push(...speculativeIssues);

    // Check for missing sources
    if (totalClaims > 0 && groundedClaims === 0) {
      issues.push({
        type: 'missing_source',
        severity: 'critical',
        message: 'Response contains claims without any data sources',
        suggestedFix: 'Base response on actual data or explicitly state limitations',
      });
    }

    // Calculate confidence
    const confidence = totalClaims > 0 ? groundedClaims / totalClaims : 1.0;
    const isValid = confidence >= this.CONFIDENCE_THRESHOLD && issues.filter(i => i.severity === 'critical').length === 0;

    return {
      isValid,
      issues,
      corrections,
      confidence,
      groundedClaims,
      totalClaims,
    };
  }

  /**
   * Checks if a specific claim is grounded in available data
   * Requirement 6.1: Source verification against actual data
   */
  checkGrounding(claim: string, availableData: WeeklyData[]): HallucinationCheck {
    const sources: DataSource[] = [];
    const uncertainties: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0;

    // Check if we have sufficient data
    if (!availableData || availableData.length < this.MIN_DATA_POINTS) {
      uncertainties.push('Insufficient data points for reliable analysis');
      recommendations.push('Collect more data before making definitive claims');
      return {
        isGrounded: false,
        confidence: 0,
        sources,
        uncertainties,
        recommendations,
      };
    }

    // Extract numerical values from claim
    const numbers = this.extractNumbers(claim);
    
    // Verify numerical claims against data
    if (numbers.length > 0) {
      const verification = this.verifyNumericalClaims(numbers, availableData);
      confidence = verification.confidence;
      
      if (verification.isVerified) {
        sources.push({
          type: 'historical_data',
          reference: 'Uploaded time series data',
          dataPoints: availableData.length,
          dateRange: {
            start: availableData[0].Date,
            end: availableData[availableData.length - 1].Date,
          },
          confidence: verification.confidence,
        });
      } else {
        uncertainties.push(verification.reason || 'Numerical values do not match data');
        recommendations.push('Verify calculations against actual data values');
      }
    }

    // Check for trend claims
    if (this.isTrendClaim(claim)) {
      const trendVerification = this.verifyTrendClaim(claim, availableData);
      confidence = Math.max(confidence, trendVerification.confidence);
      
      if (trendVerification.isVerified) {
        sources.push({
          type: 'statistical_analysis',
          reference: 'Trend analysis of historical data',
          confidence: trendVerification.confidence,
        });
      } else {
        uncertainties.push('Trend claim not supported by data pattern');
        recommendations.push('Use statistical tests to verify trend direction and significance');
      }
    }

    const isGrounded = confidence >= this.CONFIDENCE_THRESHOLD && uncertainties.length === 0;

    return {
      isGrounded,
      confidence,
      sources,
      uncertainties,
      recommendations: recommendations.length > 0 ? recommendations : ['Claim appears grounded in available data'],
    };
  }

  /**
   * Quantifies uncertainty in analysis results
   * Requirement 6.3: Include confidence levels and uncertainty indicators
   */
  quantifyUncertainty(analysis: AnalysisResult): UncertaintyMetrics {
    const uncertaintyFactors: UncertaintyFactor[] = [];
    let dataQualityScore = 1.0;
    let modelReliability = analysis.confidence || 0.8;

    // Assess data quality factors
    if (analysis.sources.length === 0) {
      uncertaintyFactors.push({
        factor: 'No data sources',
        impact: 'high',
        description: 'Analysis lacks verifiable data sources',
        mitigation: 'Ensure analysis is based on actual uploaded data',
      });
      dataQualityScore *= 0.3;
    }

    // Check data sufficiency
    const dataPoints = analysis.sources.reduce((sum, s) => sum + (s.dataPoints || 0), 0);
    if (dataPoints < this.MIN_DATA_POINTS) {
      uncertaintyFactors.push({
        factor: 'Insufficient data',
        impact: 'high',
        description: `Only ${dataPoints} data points available (minimum ${this.MIN_DATA_POINTS} recommended)`,
        mitigation: 'Collect more historical data for reliable analysis',
      });
      dataQualityScore *= 0.5;
    } else if (dataPoints < 30) {
      uncertaintyFactors.push({
        factor: 'Limited data',
        impact: 'medium',
        description: `${dataPoints} data points may limit analysis accuracy`,
        mitigation: 'Consider collecting additional data for improved reliability',
      });
      dataQualityScore *= 0.8;
    }

    // Check for forecast-specific uncertainties
    if (analysis.type === 'forecast') {
      if (!analysis.metadata?.confidenceIntervals) {
        uncertaintyFactors.push({
          factor: 'Missing confidence intervals',
          impact: 'medium',
          description: 'Forecast lacks uncertainty bounds',
          mitigation: 'Include confidence intervals in forecast output',
        });
        modelReliability *= 0.9;
      }

      if (!analysis.metadata?.validationMetrics) {
        uncertaintyFactors.push({
          factor: 'No validation metrics',
          impact: 'medium',
          description: 'Model performance not validated',
          mitigation: 'Perform cross-validation or holdout testing',
        });
        modelReliability *= 0.85;
      }
    }

    // Calculate overall confidence
    const overallConfidence = (dataQualityScore * 0.4 + modelReliability * 0.6);

    // Generate recommendations
    const recommendations = this.generateUncertaintyRecommendations(
      uncertaintyFactors,
      overallConfidence
    );

    return {
      overallConfidence,
      dataQualityScore,
      modelReliability,
      uncertaintyFactors,
      recommendations,
    };
  }

  /**
   * Suggests alternatives when response is invalid
   * Requirement 6.5: Suggest alternative approaches or clarifying questions
   */
  suggestAlternatives(invalidResponse: string, context: UserContext): string[] {
    const alternatives: string[] = [];

    // Check what data is available
    const hasData = context.uploadedData && context.uploadedData.length > 0;
    const hasForecast = context.forecastData && context.forecastData.length > 0;
    const hasOutliers = context.outlierData && context.outlierData.length > 0;

    // Requirement 6.2: Explicitly state limitations
    if (!hasData) {
      alternatives.push(
        'I don\'t have sufficient data to provide a detailed analysis. Please upload your time series data first.'
      );
      alternatives.push(
        'To give you accurate insights, I need access to your historical data. Would you like to upload a dataset?'
      );
    } else if (context.uploadedData!.length < this.MIN_DATA_POINTS) {
      alternatives.push(
        `I can provide a preliminary analysis, but with only ${context.uploadedData!.length} data points, the results may have limited reliability. Consider collecting more data for better accuracy.`
      );
    }

    // Suggest data-driven alternatives
    if (hasData && !hasForecast) {
      alternatives.push(
        'Based on your uploaded data, I can provide statistical summaries, trend analysis, or outlier detection. Which would you like to explore?'
      );
    }

    if (hasForecast) {
      alternatives.push(
        'I can analyze your existing forecast results, including confidence intervals and model performance metrics. What specific aspect would you like to understand?'
      );
    }

    // Requirement 6.4: Present alternatives with clear reasoning
    if (this.containsSpeculativeLanguage(invalidResponse)) {
      alternatives.push(
        'Instead of speculating, I can provide data-driven insights based on your actual historical patterns and statistical analysis.'
      );
    }

    // Suggest clarifying questions
    alternatives.push(
      'Could you clarify what specific aspect of your data you\'d like to analyze? For example: trends, seasonality, outliers, or forecasting?'
    );

    return alternatives;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractClaims(response: string): string[] {
    const claims: string[] = [];
    
    for (const pattern of this.CLAIM_PATTERNS) {
      const matches = response.match(pattern);
      if (matches) {
        claims.push(...matches);
      }
    }

    // Extract sentences with numerical assertions
    const sentences = response.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (/\d+\.?\d*%?/.test(sentence) && sentence.length > 20) {
        claims.push(sentence.trim());
      }
    }

    return Array.from(new Set(claims)); // Remove duplicates
  }

  private validateClaim(claim: string, context: UserContext, data: WeeklyData[]): HallucinationCheck {
    return this.checkGrounding(claim, data);
  }

  private detectSpeculativeContent(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const speculativePatterns = [
      { pattern: /\b(might|may|could|possibly|perhaps|probably)\b/gi, severity: 'low' as const },
      { pattern: /\b(assume|assuming|speculation|speculate)\b/gi, severity: 'medium' as const },
      { pattern: /\b(guess|guessing|imagine|imagining)\b/gi, severity: 'high' as const },
    ];

    for (const { pattern, severity } of speculativePatterns) {
      const matches = response.match(pattern);
      if (matches && matches.length > 2) {
        issues.push({
          type: 'speculative_content',
          severity,
          message: `Response contains speculative language: ${matches.join(', ')}`,
          suggestedFix: 'Replace speculative language with data-driven statements or explicit uncertainty indicators',
        });
      }
    }

    return issues;
  }

  private extractNumbers(text: string): number[] {
    const numberPattern = /\d+\.?\d*/g;
    const matches = text.match(numberPattern);
    return matches ? matches.map(m => parseFloat(m)) : [];
  }

  private verifyNumericalClaims(
    numbers: number[],
    data: WeeklyData[]
  ): { isVerified: boolean; confidence: number; reason?: string } {
    if (data.length === 0) {
      return { isVerified: false, confidence: 0, reason: 'No data available' };
    }

    const values = data.map(d => d.Value);
    const stats = this.calculateStatistics(values);

    // Check if numbers are within reasonable range of data
    let matchCount = 0;
    for (const num of numbers) {
      if (this.isNumberInDataRange(num, stats)) {
        matchCount++;
      }
    }

    const confidence = numbers.length > 0 ? matchCount / numbers.length : 0;
    const isVerified = confidence >= 0.7;

    return {
      isVerified,
      confidence,
      reason: isVerified ? undefined : 'Numbers do not match data statistics',
    };
  }

  private isTrendClaim(claim: string): boolean {
    const trendPatterns = [
      /\b(increasing|decreasing|growing|declining|rising|falling)\b/i,
      /\b(upward|downward) trend\b/i,
      /\b(improve|worsen|deteriorate)\b/i,
    ];
    return trendPatterns.some(pattern => pattern.test(claim));
  }

  private verifyTrendClaim(
    claim: string,
    data: WeeklyData[]
  ): { isVerified: boolean; confidence: number } {
    if (data.length < 3) {
      return { isVerified: false, confidence: 0 };
    }

    const values = data.map(d => d.Value);
    const trend = this.calculateTrend(values);

    const isIncreasing = /\b(increasing|growing|rising|improve)\b/i.test(claim);
    const isDecreasing = /\b(decreasing|declining|falling|worsen|deteriorate)\b/i.test(claim);

    let isVerified = false;
    let confidence = 0;

    if (isIncreasing && trend.direction === 'increasing') {
      isVerified = true;
      confidence = trend.strength;
    } else if (isDecreasing && trend.direction === 'decreasing') {
      isVerified = true;
      confidence = trend.strength;
    }

    return { isVerified, confidence };
  }

  private calculateStatistics(values: number[]): {
    mean: number;
    min: number;
    max: number;
    stdDev: number;
  } {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, min, max, stdDev };
  }

  private isNumberInDataRange(num: number, stats: { mean: number; min: number; max: number; stdDev: number }): boolean {
    // Check if number is within 3 standard deviations or within min-max range
    const withinStdDev = Math.abs(num - stats.mean) <= 3 * stats.stdDev;
    const withinRange = num >= stats.min * 0.5 && num <= stats.max * 1.5;
    return withinStdDev || withinRange;
  }

  private calculateTrend(values: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; strength: number } {
    if (values.length < 2) {
      return { direction: 'stable', strength: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = numerator / denominator;
    const direction = slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';
    
    // Calculate R-squared for strength
    const yPred = values.map((_, i) => yMean + slope * (i - xMean));
    const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - yPred[i], 2), 0);
    const ssTot = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    const strength = Math.max(0, Math.min(1, rSquared));

    return { direction, strength };
  }

  private generateUncertaintyRecommendations(
    factors: UncertaintyFactor[],
    confidence: number
  ): string[] {
    const recommendations: string[] = [];

    if (confidence < 0.5) {
      recommendations.push('Results have low confidence. Consider collecting more data or using simpler analysis methods.');
    } else if (confidence < 0.7) {
      recommendations.push('Results have moderate confidence. Interpret with caution and consider validation.');
    }

    // Add specific recommendations from factors
    const highImpactFactors = factors.filter(f => f.impact === 'high');
    for (const factor of highImpactFactors) {
      if (factor.mitigation) {
        recommendations.push(factor.mitigation);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Results have high confidence and are well-supported by available data.');
    }

    return recommendations;
  }

  private containsSpeculativeLanguage(text: string): boolean {
    const speculativeWords = ['might', 'may', 'could', 'possibly', 'perhaps', 'probably', 'assume', 'guess'];
    return speculativeWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new instance of the Hallucination Prevention Engine
 */
export function createHallucinationPreventionEngine(): HallucinationPreventionEngine {
  return new HallucinationPreventionEngine();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Adds uncertainty indicators to a response based on confidence level
 */
export function addUncertaintyIndicators(response: string, confidence: number): string {
  if (confidence >= 0.9) {
    return response;
  } else if (confidence >= 0.7) {
    return `${response}\n\n*Note: This analysis is based on available data with moderate confidence (${(confidence * 100).toFixed(0)}%).*`;
  } else if (confidence >= 0.5) {
    return `${response}\n\n*Important: This analysis has limited confidence (${(confidence * 100).toFixed(0)}%) due to data constraints. Results should be interpreted with caution.*`;
  } else {
    return `*Warning: Insufficient data for reliable analysis (confidence: ${(confidence * 100).toFixed(0)}%). Please collect more data before making decisions based on these results.*\n\n${response}`;
  }
}

/**
 * Formats validation issues for display to users
 */
export function formatValidationIssues(validation: ResponseValidation): string {
  if (validation.isValid) {
    return '';
  }

  const criticalIssues = validation.issues.filter(i => i.severity === 'critical');
  const highIssues = validation.issues.filter(i => i.severity === 'high');

  let message = '';

  if (criticalIssues.length > 0) {
    message += '**Critical Issues:**\n';
    criticalIssues.forEach(issue => {
      message += `- ${issue.message}\n`;
      if (issue.suggestedFix) {
        message += `  *Suggestion: ${issue.suggestedFix}*\n`;
      }
    });
  }

  if (highIssues.length > 0) {
    message += '\n**Important Concerns:**\n';
    highIssues.forEach(issue => {
      message += `- ${issue.message}\n`;
    });
  }

  return message;
}
