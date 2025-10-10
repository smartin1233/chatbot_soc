import { describe, it, expect } from 'vitest';
import { PreprocessingGuidanceSystem } from '../preprocessing-guidance';
import { OutlierDetectionResult } from '../outlier-detector';
import { DataPoint } from '../statistical-analysis';

describe('PreprocessingGuidanceSystem', () => {
  const mockData: DataPoint[] = [
    { date: new Date('2024-01-01'), value: 100 },
    { date: new Date('2024-01-02'), value: 105 },
    { date: new Date('2024-01-03'), value: 500 }, // outlier
    { date: new Date('2024-01-04'), value: 102 },
    { date: new Date('2024-01-05'), value: 98 },
    { date: new Date('2024-01-06'), value: 103 },
    { date: new Date('2024-01-07'), value: 101 },
  ];

  const mockOutlierResult: OutlierDetectionResult = {
    outliers: [
      {
        index: 2,
        value: 500,
        date: new Date('2024-01-03'),
        zScore: 5.2,
        severity: 'critical',
        reason: 'Value exceeds threshold',
        suggestedAction: 'Remove or cap',
        distanceFromThreshold: 400
      }
    ],
    method: 'iqr',
    threshold: 1.5,
    visualizationData: {
      dataPoints: mockData,
      outlierIndices: [2],
      thresholds: { lower: 90, upper: 110 },
      highlightColors: {
        low: '#FFA500',
        medium: '#FF8C00',
        high: '#FF4500',
        critical: '#DC143C'
      },
      normalColor: '#3B82F6'
    },
    statistics: {
      totalPoints: 7,
      outlierCount: 1,
      outlierPercentage: 14.3,
      severityBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 1
      }
    },
    summary: 'Detected 1 outlier'
  };

  it('should generate preprocessing suggestions', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);

    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toHaveProperty('id');
    expect(suggestions[0]).toHaveProperty('type');
    expect(suggestions[0]).toHaveProperty('title');
    expect(suggestions[0]).toHaveProperty('applicability');
  });

  it('should create a preprocessing workflow', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);
    const workflow = system.createWorkflow([suggestions[0]], mockData, mockOutlierResult);

    expect(workflow).toBeDefined();
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.estimatedImpact).toHaveProperty('dataQualityImprovement');
    expect(workflow.estimatedImpact).toHaveProperty('recordsAffected');
    expect(workflow.estimatedImpact).toHaveProperty('forecastAccuracyGain');
  });

  it('should execute removal preprocessing step', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);
    const removalSuggestion = suggestions.find(s => s.type === 'removal');
    
    if (removalSuggestion) {
      const workflow = system.createWorkflow([removalSuggestion], mockData, mockOutlierResult);
      const result = system.executeStep(workflow.steps[0], mockData);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(6); // 7 - 1 outlier
      expect(result.recordsRemoved).toBe(1);
    }
  });

  it('should execute imputation preprocessing step', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);
    const imputationSuggestion = suggestions.find(s => s.type === 'imputation');
    
    if (imputationSuggestion) {
      const workflow = system.createWorkflow([imputationSuggestion], mockData, mockOutlierResult);
      const result = system.executeStep(workflow.steps[0], mockData);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(7); // Same length
      expect(result.recordsModified).toBe(1);
      expect(result.processedData[2].value).not.toBe(500); // Outlier should be replaced
    }
  });

  it('should execute capping preprocessing step', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);
    const cappingSuggestion = suggestions.find(s => s.type === 'capping');
    
    if (cappingSuggestion) {
      const workflow = system.createWorkflow([cappingSuggestion], mockData, mockOutlierResult);
      const result = system.executeStep(workflow.steps[0], mockData);

      expect(result.success).toBe(true);
      expect(result.processedData.length).toBe(7); // Same length
      expect(result.recordsModified).toBeGreaterThan(0);
    }
  });

  it('should validate preprocessing results', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);
    const workflow = system.createWorkflow([suggestions[0]], mockData, mockOutlierResult);
    const result = system.executeStep(workflow.steps[0], mockData);

    const validation = system.validateResults(mockData, result.processedData);

    expect(validation).toBeDefined();
    expect(validation).toHaveProperty('isValid');
    expect(validation).toHaveProperty('improvements');
    expect(validation).toHaveProperty('concerns');
    expect(validation).toHaveProperty('recommendations');
    expect(validation.improvements).toHaveProperty('outlierReduction');
    expect(validation.improvements).toHaveProperty('dataQualityScore');
  });

  it('should sort suggestions by applicability', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);

    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i].applicability).toBeGreaterThanOrEqual(suggestions[i + 1].applicability);
    }
  });

  it('should include pros and cons for each suggestion', () => {
    const system = new PreprocessingGuidanceSystem();
    const suggestions = system.generateSuggestions(mockOutlierResult, mockData);

    suggestions.forEach(suggestion => {
      expect(suggestion.pros).toBeDefined();
      expect(suggestion.pros.length).toBeGreaterThan(0);
      expect(suggestion.cons).toBeDefined();
      expect(suggestion.cons.length).toBeGreaterThan(0);
    });
  });
});
