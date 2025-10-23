/**
 * Tests for Workflow Trigger Manager
 */

import { describe, it, expect } from 'vitest';
import { WorkflowTriggerManager } from '../workflow-trigger-manager';
import { IntentType, UserContext } from '../intent-analyzer';

describe('WorkflowTriggerManager', () => {
  const manager = new WorkflowTriggerManager();

  // Mock contexts
  const contextWithForecast: UserContext = {
    hasUploadedData: true,
    hasForecastResults: true,
    hasOutlierAnalysis: false,
    recentIntents: [],
  };

  const contextWithoutForecast: UserContext = {
    hasUploadedData: true,
    hasForecastResults: false,
    hasOutlierAnalysis: false,
    recentIntents: [],
  };

  const contextNoData: UserContext = {
    hasUploadedData: false,
    hasForecastResults: false,
    hasOutlierAnalysis: false,
    recentIntents: [],
  };

  describe('shouldTriggerForecast', () => {
    it('should not trigger for analytical questions about existing forecast', () => {
      const decision = manager.shouldTriggerForecast(
        'How reliable is this forecast?',
        contextWithForecast
      );

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.alternativeAction).toBe('route_to_analyst');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it('should not trigger for forecast interpretation questions', () => {
      const decision = manager.shouldTriggerForecast(
        'What does the forecast mean for my business?',
        contextWithForecast
      );

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.alternativeAction).toBe('route_to_analyst');
    });

    it('should trigger for explicit forecast execution requests', () => {
      const decision = manager.shouldTriggerForecast(
        'Forecast the next 6 months',
        contextWithoutForecast
      );

      expect(decision.shouldTrigger).toBe(true);
      expect(decision.confidence).toBeGreaterThan(0.9);
    });

    it('should trigger for prediction requests', () => {
      const decision = manager.shouldTriggerForecast(
        'Predict the next quarter',
        contextWithoutForecast
      );

      expect(decision.shouldTrigger).toBe(true);
    });

    it('should not trigger when no data is uploaded', () => {
      const decision = manager.shouldTriggerForecast(
        'Forecast the next month',
        contextNoData
      );

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.alternativeAction).toBe('clarify_intent');
    });

    it('should use existing results for decision-making questions', () => {
      const decision = manager.shouldTriggerForecast(
        'What decisions can I make based on this forecast?',
        contextWithForecast
      );

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.alternativeAction).toBe('use_existing_results');
    });

    it('should clarify intent for ambiguous queries', () => {
      const decision = manager.shouldTriggerForecast(
        'Tell me about the data',
        contextWithoutForecast
      );

      expect(decision.shouldTrigger).toBe(false);
      expect(decision.alternativeAction).toBe('clarify_intent');
    });
  });

  describe('routeToAppropriateAgent', () => {
    it('should route analytical questions to BI analyst', () => {
      const decision = manager.shouldTriggerForecast(
        'How accurate is this forecast?',
        contextWithForecast
      );
      const route = manager.routeToAppropriateAgent(decision, 'How accurate is this forecast?');

      expect(route.agentId).toBe('bi_analyst_agent');
      expect(route.skipWorkflow).toBe(true);
      expect(route.context.useExistingForecast).toBe(true);
    });

    it('should route execution requests to workflow orchestrator', () => {
      const decision = manager.shouldTriggerForecast(
        'Generate a forecast',
        contextWithoutForecast
      );
      const route = manager.routeToAppropriateAgent(decision, 'Generate a forecast');

      expect(route.agentId).toBe('workflow_orchestrator');
      expect(route.skipWorkflow).toBe(false);
      expect(route.context.triggerWorkflow).toBe(true);
    });

    it('should route clarification needs to general agent', () => {
      const decision = manager.shouldTriggerForecast(
        'What can you do?',
        contextNoData
      );
      const route = manager.routeToAppropriateAgent(decision, 'What can you do?');

      expect(route.agentId).toBe('general_agent');
      expect(route.skipWorkflow).toBe(true);
      expect(route.context.needsClarification).toBe(true);
    });
  });

  describe('shouldTriggerWorkflowForIntent', () => {
    it('should trigger for FORECASTING_EXECUTION with data', () => {
      const result = manager.shouldTriggerWorkflowForIntent(
        IntentType.FORECASTING_EXECUTION,
        contextWithoutForecast
      );
      expect(result).toBe(true);
    });

    it('should not trigger for FORECASTING_ANALYSIS', () => {
      const result = manager.shouldTriggerWorkflowForIntent(
        IntentType.FORECASTING_ANALYSIS,
        contextWithForecast
      );
      expect(result).toBe(false);
    });

    it('should not trigger for FORECASTING_EXECUTION without data', () => {
      const result = manager.shouldTriggerWorkflowForIntent(
        IntentType.FORECASTING_EXECUTION,
        contextNoData
      );
      expect(result).toBe(false);
    });
  });

  describe('hasRequiredContext', () => {
    it('should require data for forecasting execution', () => {
      const result = manager.hasRequiredContext(
        IntentType.FORECASTING_EXECUTION,
        contextNoData
      );
      expect(result).toBe(false);
    });

    it('should require forecast results for analysis', () => {
      const result = manager.hasRequiredContext(
        IntentType.FORECASTING_ANALYSIS,
        contextWithoutForecast
      );
      expect(result).toBe(false);
    });

    it('should have required context when conditions are met', () => {
      const result = manager.hasRequiredContext(
        IntentType.FORECASTING_ANALYSIS,
        contextWithForecast
      );
      expect(result).toBe(true);
    });
  });

  describe('getWorkflowTypeForIntent', () => {
    it('should return correct workflow type for each intent', () => {
      expect(manager.getWorkflowTypeForIntent(IntentType.FORECASTING_EXECUTION)).toBe('forecasting');
      expect(manager.getWorkflowTypeForIntent(IntentType.MODEL_TRAINING)).toBe('model_training');
      expect(manager.getWorkflowTypeForIntent(IntentType.OUTLIER_DETECTION)).toBe('outlier_detection');
      expect(manager.getWorkflowTypeForIntent(IntentType.FORECASTING_ANALYSIS)).toBe('none');
    });
  });

  describe('getMissingContextMessage', () => {
    it('should provide appropriate message for missing data', () => {
      const message = manager.getMissingContextMessage(
        IntentType.FORECASTING_EXECUTION,
        contextNoData
      );
      expect(message).toContain('upload your data');
    });

    it('should provide appropriate message for missing forecast', () => {
      const message = manager.getMissingContextMessage(
        IntentType.FORECASTING_ANALYSIS,
        contextWithoutForecast
      );
      expect(message).toContain('No forecast results available');
    });
  });
});
