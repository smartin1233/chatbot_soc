/**
 * Tests for Hallucination Prevention Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  HallucinationPreventionEngine,
  createHallucinationPreventionEngine,
  addUncertaintyIndicators,
  formatValidationIssues,
  type UserContext,
  type AnalysisResult,
} from '../hallucination-prevention';
import type { WeeklyData } from '../types';

describe('HallucinationPreventionEngine', () => {
  let engine: HallucinationPreventionEngine;
  let mockData: WeeklyData[];
  let mockContext: UserContext;

  beforeEach(() => {
    engine = createHallucinationPreventionEngine();
    
    // Create mock data with 20 data points
    mockData = Array.from({ length: 20 }, (_, i) => ({
      Date: new Date(2024, 0, i + 1),
      Value: 100 + i * 5 + Math.random() * 10,
      Orders: 50 + i * 2,
      CreatedDate: new Date(2024, 0, 1),
    }));

    mockContext = {
      sessionId: 'test-session',
      uploadedData: mockData,
    };
  });

  describe('validateResponse', () => {
    it('should validate a grounded response with data-backed claims', () => {
      const response = 'The data shows an increasing trend with values ranging from 100 to 200.';
      const validation = engine.validateResponse(response, mockContext, mockData);

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0.5);
      expect(validation.issues.filter(i => i.severity === 'critical')).toHaveLength(0);
    });

    it('should detect ungrounded claims without data', () => {
      const response = 'The forecast predicts a 500% increase next month.';
      const validation = engine.validateResponse(response, mockContext, []);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should detect speculative language', () => {
      const response = 'I guess the data might possibly show some trends, perhaps increasing.';
      const validation = engine.validateResponse(response, mockContext, mockData);

      const speculativeIssues = validation.issues.filter(i => i.type === 'speculative_content');
      expect(speculativeIssues.length).toBeGreaterThan(0);
    });

    it('should handle responses with no claims', () => {
      const response = 'I can help you analyze your data.';
      const validation = engine.validateResponse(response, mockContext, mockData);

      expect(validation.totalClaims).toBe(0);
      expect(validation.confidence).toBe(1.0);
    });

    it('should identify missing sources for claims', () => {
      const response = 'The average is 150 and the trend shows growth.';
      const validation = engine.validateResponse(response, mockContext, []);

      const missingSourceIssues = validation.issues.filter(i => i.type === 'missing_source');
      expect(missingSourceIssues.length).toBeGreaterThan(0);
    });
  });

  describe('checkGrounding', () => {
    it('should verify grounded claims with sufficient data', () => {
      const claim = 'The average value is approximately 150';
      const check = engine.checkGrounding(claim, mockData);

      expect(check.isGrounded).toBe(true);
      expect(check.confidence).toBeGreaterThan(0.5);
      expect(check.sources.length).toBeGreaterThan(0);
    });

    it('should reject claims with insufficient data', () => {
      const claim = 'The trend is increasing';
      const insufficientData = mockData.slice(0, 5);
      const check = engine.checkGrounding(claim, insufficientData);

      expect(check.isGrounded).toBe(false);
      expect(check.uncertainties.length).toBeGreaterThan(0);
    });

    it('should verify trend claims', () => {
      const claim = 'The data shows an increasing trend';
      const check = engine.checkGrounding(claim, mockData);

      expect(check.sources.some(s => s.type === 'statistical_analysis')).toBe(true);
    });

    it('should provide recommendations for ungrounded claims', () => {
      const claim = 'The value will be 1000 next week';
      const check = engine.checkGrounding(claim, mockData);

      expect(check.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('quantifyUncertainty', () => {
    it('should calculate high confidence for well-sourced analysis', () => {
      const analysis: AnalysisResult = {
        type: 'statistical',
        data: mockData,
        confidence: 0.9,
        sources: [
          {
            type: 'historical_data',
            reference: 'Test data',
            dataPoints: 20,
          },
        ],
      };

      const metrics = engine.quantifyUncertainty(analysis);

      expect(metrics.overallConfidence).toBeGreaterThan(0.7);
      expect(metrics.dataQualityScore).toBeGreaterThan(0.7);
    });

    it('should identify insufficient data as uncertainty factor', () => {
      const analysis: AnalysisResult = {
        type: 'forecast',
        data: [],
        confidence: 0.5,
        sources: [
          {
            type: 'historical_data',
            reference: 'Limited data',
            dataPoints: 5,
          },
        ],
      };

      const metrics = engine.quantifyUncertainty(analysis);

      expect(metrics.uncertaintyFactors.length).toBeGreaterThan(0);
      expect(metrics.uncertaintyFactors.some(f => f.factor.includes('data'))).toBe(true);
    });

    it('should flag missing validation metrics for forecasts', () => {
      const analysis: AnalysisResult = {
        type: 'forecast',
        data: mockData,
        confidence: 0.8,
        sources: [
          {
            type: 'forecast_data',
            reference: 'Forecast',
            dataPoints: 20,
          },
        ],
        metadata: {},
      };

      const metrics = engine.quantifyUncertainty(analysis);

      expect(metrics.uncertaintyFactors.some(f => f.factor.includes('validation'))).toBe(true);
    });

    it('should provide appropriate recommendations based on confidence', () => {
      const lowConfidenceAnalysis: AnalysisResult = {
        type: 'statistical',
        data: [],
        confidence: 0.3,
        sources: [],
      };

      const metrics = engine.quantifyUncertainty(lowConfidenceAnalysis);

      expect(metrics.recommendations.length).toBeGreaterThan(0);
      expect(metrics.recommendations.some(r => r.includes('low confidence'))).toBe(true);
    });
  });

  describe('suggestAlternatives', () => {
    it('should suggest data upload when no data available', () => {
      const invalidResponse = 'Analysis shows trends';
      const emptyContext: UserContext = {
        sessionId: 'test',
      };

      const alternatives = engine.suggestAlternatives(invalidResponse, emptyContext);

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.some(a => a.includes('upload'))).toBe(true);
    });

    it('should suggest statistical analysis when data is available', () => {
      const invalidResponse = 'Speculative content';
      const alternatives = engine.suggestAlternatives(invalidResponse, mockContext);

      expect(alternatives.some(a => a.includes('statistical') || a.includes('trend'))).toBe(true);
    });

    it('should suggest clarifying questions', () => {
      const invalidResponse = 'Unclear request';
      const alternatives = engine.suggestAlternatives(invalidResponse, mockContext);

      expect(alternatives.some(a => a.includes('clarify') || a.includes('specific'))).toBe(true);
    });

    it('should warn about limited data reliability', () => {
      const limitedContext: UserContext = {
        sessionId: 'test',
        uploadedData: mockData.slice(0, 5),
      };

      const alternatives = engine.suggestAlternatives('Analysis', limitedContext);

      expect(alternatives.some(a => a.includes('limited') || a.includes('reliability'))).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    describe('addUncertaintyIndicators', () => {
      it('should not add indicators for high confidence', () => {
        const response = 'Test response';
        const result = addUncertaintyIndicators(response, 0.95);

        expect(result).toBe(response);
      });

      it('should add moderate confidence note', () => {
        const response = 'Test response';
        const result = addUncertaintyIndicators(response, 0.75);

        expect(result).toContain('moderate confidence');
        expect(result).toContain('75%');
      });

      it('should add warning for low confidence', () => {
        const response = 'Test response';
        const result = addUncertaintyIndicators(response, 0.4);

        expect(result).toContain('Warning');
        expect(result).toContain('Insufficient data');
      });
    });

    describe('formatValidationIssues', () => {
      it('should return empty string for valid responses', () => {
        const validation = {
          isValid: true,
          issues: [],
          corrections: [],
          confidence: 0.9,
          groundedClaims: 5,
          totalClaims: 5,
        };

        const formatted = formatValidationIssues(validation);
        expect(formatted).toBe('');
      });

      it('should format critical issues', () => {
        const validation = {
          isValid: false,
          issues: [
            {
              type: 'missing_source' as const,
              severity: 'critical' as const,
              message: 'No data sources',
              suggestedFix: 'Add data',
            },
          ],
          corrections: [],
          confidence: 0.3,
          groundedClaims: 0,
          totalClaims: 3,
        };

        const formatted = formatValidationIssues(validation);
        expect(formatted).toContain('Critical Issues');
        expect(formatted).toContain('No data sources');
        expect(formatted).toContain('Add data');
      });

      it('should format high severity issues', () => {
        const validation = {
          isValid: false,
          issues: [
            {
              type: 'ungrounded_claim' as const,
              severity: 'high' as const,
              message: 'Claim not supported',
            },
          ],
          corrections: [],
          confidence: 0.5,
          groundedClaims: 1,
          totalClaims: 2,
        };

        const formatted = formatValidationIssues(validation);
        expect(formatted).toContain('Important Concerns');
        expect(formatted).toContain('Claim not supported');
      });
    });
  });
});
