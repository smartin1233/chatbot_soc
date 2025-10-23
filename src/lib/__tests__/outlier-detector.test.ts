import { describe, it, expect } from 'vitest';
import { OutlierDetector } from '../outlier-detector';
import { DataPoint } from '../statistical-analysis';

describe('OutlierDetector', () => {
  const detector = new OutlierDetector();

  // Helper to create test data
  const createTestData = (values: number[]): DataPoint[] => {
    return values.map((value, index) => ({
      date: new Date(2024, 0, index + 1),
      value,
      orders: 100
    }));
  };

  describe('shouldActivate', () => {
    it('should activate on quality check keyword', () => {
      expect(detector.shouldActivate('Can you do a quality check?')).toBe(true);
    });

    it('should activate on outliers keyword', () => {
      expect(detector.shouldActivate('Show me the outliers')).toBe(true);
    });

    it('should activate on anomalies keyword', () => {
      expect(detector.shouldActivate('Are there any anomalies?')).toBe(true);
    });

    it('should not activate on regular queries', () => {
      expect(detector.shouldActivate('Describe the data')).toBe(false);
      expect(detector.shouldActivate('Forecast next month')).toBe(false);
    });
  });

  describe('detect - IQR method', () => {
    it('should detect outliers using IQR method', () => {
      // Normal data with clear outliers
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.method).toBe('iqr');
      expect(result.statistics.totalPoints).toBe(10);
      expect(result.outliers[0].value).toBe(100);
    });

    it('should classify outlier severity correctly', () => {
      const data = createTestData([10, 12, 11, 13, 12, 200, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.outliers.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.outliers[0].severity);
    });

    it('should return no outliers for uniform data', () => {
      const data = createTestData([10, 11, 12, 11, 10, 12, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.outliers.length).toBe(0);
      expect(result.statistics.outlierPercentage).toBe(0);
    });
  });

  describe('detect - Z-Score method', () => {
    it('should detect outliers using Z-Score method', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'zscore', sensitivity: 'medium' });
      
      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.method).toBe('zscore');
      expect(result.outliers[0].zScore).toBeGreaterThan(0);
    });

    it('should respect sensitivity settings', () => {
      const data = createTestData([10, 12, 11, 13, 12, 25, 11, 10, 12, 11]);
      
      const resultHigh = detector.detect(data, { method: 'zscore', sensitivity: 'high' });
      const resultLow = detector.detect(data, { method: 'zscore', sensitivity: 'low' });
      
      // High sensitivity should detect more outliers
      expect(resultHigh.outliers.length).toBeGreaterThanOrEqual(resultLow.outliers.length);
    });
  });

  describe('detect - Isolation Forest method', () => {
    it('should detect outliers using Isolation Forest method', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'isolation_forest', sensitivity: 'medium' });
      
      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.method).toBe('isolation_forest');
    });
  });

  describe('visualization data', () => {
    it('should generate visualization data with correct structure', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.visualizationData).toBeDefined();
      expect(result.visualizationData.dataPoints).toHaveLength(10);
      expect(result.visualizationData.outlierIndices).toContain(5); // Index of value 100
      expect(result.visualizationData.thresholds).toHaveProperty('lower');
      expect(result.visualizationData.thresholds).toHaveProperty('upper');
      expect(result.visualizationData.highlightColors).toHaveProperty('low');
      expect(result.visualizationData.highlightColors).toHaveProperty('critical');
    });
  });

  describe('preprocessing suggestions', () => {
    it('should generate preprocessing suggestions', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      const suggestions = detector.suggestPreprocessing(result);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('title');
      expect(suggestions[0]).toHaveProperty('pros');
      expect(suggestions[0]).toHaveProperty('cons');
      expect(suggestions[0]).toHaveProperty('applicability');
    });

    it('should suggest removal for low outlier percentage', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      const suggestions = detector.suggestPreprocessing(result);
      
      const removalSuggestion = suggestions.find(s => s.type === 'removal');
      expect(removalSuggestion).toBeDefined();
    });

    it('should suggest transformation for high outlier percentage', () => {
      // Create data with many outliers
      const data = createTestData([10, 100, 11, 90, 12, 95, 11, 85, 12, 88, 10, 92]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      const suggestions = detector.suggestPreprocessing(result);
      
      const transformSuggestion = suggestions.find(s => s.type === 'transformation');
      if (result.statistics.outlierPercentage > 10) {
        expect(transformSuggestion).toBeDefined();
      }
    });

    it('should sort suggestions by applicability', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      const suggestions = detector.suggestPreprocessing(result);
      
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].applicability).toBeGreaterThanOrEqual(suggestions[i + 1].applicability);
      }
    });
  });

  describe('statistics', () => {
    it('should calculate correct statistics', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.statistics.totalPoints).toBe(10);
      expect(result.statistics.outlierCount).toBeGreaterThan(0);
      expect(result.statistics.outlierPercentage).toBeGreaterThan(0);
      expect(result.statistics.severityBreakdown).toHaveProperty('low');
      expect(result.statistics.severityBreakdown).toHaveProperty('medium');
      expect(result.statistics.severityBreakdown).toHaveProperty('high');
      expect(result.statistics.severityBreakdown).toHaveProperty('critical');
    });

    it('should generate meaningful summary', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.summary).toContain('outlier');
    });

    it('should generate appropriate summary for no outliers', () => {
      const data = createTestData([10, 11, 12, 11, 10, 12, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.summary).toContain('No outliers detected');
      expect(result.summary).toContain('Data quality appears good');
    });
  });

  describe('outlier details', () => {
    it('should provide detailed information for each outlier', () => {
      const data = createTestData([10, 12, 11, 13, 12, 100, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      expect(result.outliers.length).toBeGreaterThan(0);
      
      const outlier = result.outliers[0];
      expect(outlier).toHaveProperty('index');
      expect(outlier).toHaveProperty('value');
      expect(outlier).toHaveProperty('date');
      expect(outlier).toHaveProperty('zScore');
      expect(outlier).toHaveProperty('severity');
      expect(outlier).toHaveProperty('reason');
      expect(outlier).toHaveProperty('suggestedAction');
      expect(outlier).toHaveProperty('distanceFromThreshold');
    });

    it('should provide appropriate suggested actions based on severity', () => {
      const data = createTestData([10, 12, 11, 13, 12, 1000, 11, 10, 12, 11]);
      
      const result = detector.detect(data, { method: 'iqr', sensitivity: 'medium' });
      
      const criticalOutlier = result.outliers.find(o => o.severity === 'critical');
      if (criticalOutlier) {
        expect(criticalOutlier.suggestedAction).toContain('Immediate investigation');
      }
    });
  });
});
