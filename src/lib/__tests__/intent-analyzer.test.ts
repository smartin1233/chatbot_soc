/**
 * Tests for Intent Analyzer
 */

import { IntentAnalyzer, IntentType, UserContext } from '../intent-analyzer';

describe('IntentAnalyzer', () => {
  let analyzer: IntentAnalyzer;
  let baseContext: UserContext;

  beforeEach(() => {
    analyzer = new IntentAnalyzer();
    baseContext = {
      hasUploadedData: true,
      hasForecastResults: false,
      hasOutlierAnalysis: false,
      recentIntents: [],
    };
  });

  describe('Data Description Intent', () => {
    it('should classify "describe the data" as DATA_DESCRIPTION', () => {
      const result = analyzer.analyze('describe the data', baseContext);
      expect(result.type).toBe(IntentType.DATA_DESCRIPTION);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify "explain the dataset" as DATA_DESCRIPTION', () => {
      const result = analyzer.analyze('explain the dataset', baseContext);
      expect(result.type).toBe(IntentType.DATA_DESCRIPTION);
    });

    it('should classify "give me a statistical summary" as DATA_DESCRIPTION', () => {
      const result = analyzer.analyze('give me a statistical summary', baseContext);
      expect(result.type).toBe(IntentType.DATA_DESCRIPTION);
    });

    it('should not require workflow for data description', () => {
      const result = analyzer.analyze('describe the data', baseContext);
      expect(result.requiresWorkflow).toBe(false);
    });

    it('should target eda_agent for data description', () => {
      const result = analyzer.analyze('describe the data', baseContext);
      expect(result.targetAgents).toContain('eda_agent');
    });
  });

  describe('Outlier Detection Intent', () => {
    it('should classify "check for outliers" as OUTLIER_DETECTION', () => {
      const result = analyzer.analyze('check for outliers', baseContext);
      expect(result.type).toBe(IntentType.OUTLIER_DETECTION);
    });

    it('should classify "quality check" as OUTLIER_DETECTION', () => {
      const result = analyzer.analyze('quality check', baseContext);
      expect(result.type).toBe(IntentType.OUTLIER_DETECTION);
    });

    it('should classify "find anomalies" as OUTLIER_DETECTION', () => {
      const result = analyzer.analyze('find anomalies in the data', baseContext);
      expect(result.type).toBe(IntentType.OUTLIER_DETECTION);
    });
  });

  describe('Forecasting Execution Intent', () => {
    it('should classify "forecast the next 6 months" as FORECASTING_EXECUTION', () => {
      const result = analyzer.analyze('forecast the next 6 months', baseContext);
      expect(result.type).toBe(IntentType.FORECASTING_EXECUTION);
      expect(result.requiresWorkflow).toBe(true);
    });

    it('should classify "predict future values" as FORECASTING_EXECUTION', () => {
      const result = analyzer.analyze('predict future values', baseContext);
      expect(result.type).toBe(IntentType.FORECASTING_EXECUTION);
    });

    it('should extract time period entities', () => {
      const result = analyzer.analyze('forecast the next 6 months', baseContext);
      const timePeriodEntity = result.entities.find(e => e.type === 'time_period');
      expect(timePeriodEntity).toBeDefined();
      expect(timePeriodEntity?.value).toContain('6 months');
    });
  });

  describe('Forecasting Analysis Intent', () => {
    it('should classify "how reliable is this forecast" as FORECASTING_ANALYSIS', () => {
      const contextWithForecast = { ...baseContext, hasForecastResults: true };
      const result = analyzer.analyze('how reliable is this forecast', contextWithForecast);
      expect(result.type).toBe(IntentType.FORECASTING_ANALYSIS);
    });

    it('should classify "explain the forecast" as FORECASTING_ANALYSIS', () => {
      const contextWithForecast = { ...baseContext, hasForecastResults: true };
      const result = analyzer.analyze('explain the forecast', contextWithForecast);
      expect(result.type).toBe(IntentType.FORECASTING_ANALYSIS);
    });

    it('should not require workflow for forecast analysis', () => {
      const contextWithForecast = { ...baseContext, hasForecastResults: true };
      const result = analyzer.analyze('how reliable is this forecast', contextWithForecast);
      expect(result.requiresWorkflow).toBe(false);
    });

    it('should boost FORECASTING_ANALYSIS when forecast results exist', () => {
      const contextWithForecast = { ...baseContext, hasForecastResults: true };
      const result = analyzer.analyze('what does the forecast show', contextWithForecast);
      expect(result.type).toBe(IntentType.FORECASTING_ANALYSIS);
    });
  });

  describe('Preprocessing Intent', () => {
    it('should classify "clean the data" as PREPROCESSING', () => {
      const result = analyzer.analyze('clean the data', baseContext);
      expect(result.type).toBe(IntentType.PREPROCESSING);
    });

    it('should classify "how should I handle outliers" as PREPROCESSING', () => {
      const result = analyzer.analyze('how should I handle outliers', baseContext);
      expect(result.type).toBe(IntentType.PREPROCESSING);
    });

    it('should require workflow for preprocessing', () => {
      const result = analyzer.analyze('clean the data', baseContext);
      expect(result.requiresWorkflow).toBe(true);
    });
  });

  describe('Model Training Intent', () => {
    it('should classify "train a model" as MODEL_TRAINING', () => {
      const result = analyzer.analyze('train a model', baseContext);
      expect(result.type).toBe(IntentType.MODEL_TRAINING);
    });

    it('should classify "configure forecasting parameters" as MODEL_TRAINING', () => {
      const result = analyzer.analyze('configure forecasting parameters', baseContext);
      expect(result.type).toBe(IntentType.MODEL_TRAINING);
    });
  });

  describe('Insights Request Intent', () => {
    it('should classify "give me insights" as INSIGHTS_REQUEST', () => {
      const result = analyzer.analyze('give me insights', baseContext);
      expect(result.type).toBe(IntentType.INSIGHTS_REQUEST);
    });

    it('should classify "what are the key findings" as INSIGHTS_REQUEST', () => {
      const result = analyzer.analyze('what are the key findings', baseContext);
      expect(result.type).toBe(IntentType.INSIGHTS_REQUEST);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract time period entities', () => {
      const result = analyzer.analyze('forecast for next 30 days', baseContext);
      const timePeriodEntities = result.entities.filter(e => e.type === 'time_period');
      expect(timePeriodEntities.length).toBeGreaterThan(0);
    });

    it('should extract metric entities', () => {
      const result = analyzer.analyze('what is the MAPE and RMSE', baseContext);
      const metricEntities = result.entities.filter(e => e.type === 'metric');
      expect(metricEntities.length).toBeGreaterThan(0);
    });

    it('should extract model type entities', () => {
      const result = analyzer.analyze('use Prophet model for forecasting', baseContext);
      const modelEntities = result.entities.filter(e => e.type === 'model_type');
      expect(modelEntities.length).toBeGreaterThan(0);
      expect(modelEntities[0].value.toLowerCase()).toContain('prophet');
    });
  });

  describe('Contextual Hints', () => {
    it('should provide "use_existing_forecast_results" hint for analysis with existing forecast', () => {
      const contextWithForecast = { ...baseContext, hasForecastResults: true };
      const result = analyzer.analyze('how reliable is the forecast', contextWithForecast);
      expect(result.contextualHints).toContain('use_existing_forecast_results');
    });

    it('should provide "exclude_outlier_analysis" hint for data description', () => {
      const result = analyzer.analyze('describe the data', baseContext);
      expect(result.contextualHints).toContain('exclude_outlier_analysis');
    });

    it('should provide "trigger_forecasting_workflow" hint for forecast execution', () => {
      const result = analyzer.analyze('forecast the next month', baseContext);
      expect(result.contextualHints).toContain('trigger_forecasting_workflow');
    });
  });

  describe('Confidence Scoring', () => {
    it('should have higher confidence for clear intent patterns', () => {
      const result = analyzer.analyze('forecast the next 6 months', baseContext);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence for ambiguous queries', () => {
      const result = analyzer.analyze('what about the numbers', baseContext);
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should boost confidence when entities are extracted', () => {
      const resultWithEntities = analyzer.analyze('forecast next 30 days using Prophet', baseContext);
      const resultWithoutEntities = analyzer.analyze('forecast', baseContext);
      expect(resultWithEntities.confidence).toBeGreaterThan(resultWithoutEntities.confidence);
    });
  });

  describe('Context Awareness', () => {
    it('should reduce confidence for data-dependent intents when no data uploaded', () => {
      const noDataContext = { ...baseContext, hasUploadedData: false };
      const result = analyzer.analyze('describe the data', noDataContext);
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should boost preprocessing when outlier analysis exists', () => {
      const contextWithOutliers = { ...baseContext, hasOutlierAnalysis: true };
      const result = analyzer.analyze('how should I clean the data', contextWithOutliers);
      expect(result.type).toBe(IntentType.PREPROCESSING);
    });
  });
});
