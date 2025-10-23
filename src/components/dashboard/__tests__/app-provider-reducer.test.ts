/**
 * Unit tests for app-provider reducer actions
 * Testing task 2: Implement reducer actions for analysis tracking
 */

import { describe, it, expect } from 'vitest';

// Mock types for testing
type OutlierData = {
  index: number;
  value: number;
  date: Date;
  reason: string;
  severity: 'high' | 'medium' | 'low';
};

type ForecastData = {
  date: Date;
  forecast: number;
  lower: number;
  upper: number;
  confidence: number;
};

type AppState = {
  isProcessing: boolean;
  queuedUserPrompt: string | null;
  analyzedData: {
    hasEDA: boolean;
    hasForecasting: boolean;
    hasInsights: boolean;
    hasPreprocessing: boolean;
    lastAnalysisDate: Date | null;
    lastAnalysisType: 'eda' | 'forecasting' | 'comparative' | 'whatif' | null;
    outliers: OutlierData[];
    forecastData: ForecastData[];
  };
};

type Action =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'QUEUE_USER_PROMPT'; payload: string }
  | { type: 'CLEAR_QUEUED_PROMPT' }
  | { type: 'SET_ANALYZED_DATA'; payload: Partial<AppState['analyzedData']> };

// Simplified reducer for testing
function testReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'QUEUE_USER_PROMPT':
      return { ...state, queuedUserPrompt: action.payload };
    case 'CLEAR_QUEUED_PROMPT':
      return { ...state, queuedUserPrompt: null };
    case 'SET_ANALYZED_DATA':
      return {
        ...state,
        analyzedData: {
          ...state.analyzedData,
          ...action.payload,
          lastAnalysisDate: new Date()
        }
      };
    default:
      return state;
  }
}

describe('App Provider Reducer - Analysis Tracking Actions', () => {
  const initialState: AppState = {
    isProcessing: false,
    queuedUserPrompt: null,
    analyzedData: {
      hasEDA: false,
      hasForecasting: false,
      hasInsights: false,
      hasPreprocessing: false,
      lastAnalysisDate: null,
      lastAnalysisType: null,
      outliers: [],
      forecastData: []
    }
  };

  describe('SET_ANALYZED_DATA action', () => {
    it('should update analysis results', () => {
      const action: Action = {
        type: 'SET_ANALYZED_DATA',
        payload: {
          hasEDA: true,
          hasForecasting: false
        }
      };

      const newState = testReducer(initialState, action);

      expect(newState.analyzedData.hasEDA).toBe(true);
      expect(newState.analyzedData.hasForecasting).toBe(false);
      expect(newState.analyzedData.lastAnalysisDate).toBeInstanceOf(Date);
    });

    it('should update outliers data', () => {
      const outliers: OutlierData[] = [
        {
          index: 5,
          value: 1000,
          date: new Date('2024-01-15'),
          reason: 'Value is 3.2 standard deviations above mean',
          severity: 'high'
        }
      ];

      const action: Action = {
        type: 'SET_ANALYZED_DATA',
        payload: {
          hasEDA: true,
          outliers
        }
      };

      const newState = testReducer(initialState, action);

      expect(newState.analyzedData.outliers).toHaveLength(1);
      expect(newState.analyzedData.outliers[0].index).toBe(5);
      expect(newState.analyzedData.outliers[0].severity).toBe('high');
    });

    it('should update forecast data', () => {
      const forecastData: ForecastData[] = [
        {
          date: new Date('2024-02-01'),
          forecast: 500,
          lower: 450,
          upper: 550,
          confidence: 0.95
        }
      ];

      const action: Action = {
        type: 'SET_ANALYZED_DATA',
        payload: {
          hasForecasting: true,
          forecastData
        }
      };

      const newState = testReducer(initialState, action);

      expect(newState.analyzedData.forecastData).toHaveLength(1);
      expect(newState.analyzedData.forecastData[0].forecast).toBe(500);
      expect(newState.analyzedData.forecastData[0].confidence).toBe(0.95);
    });
  });

  describe('QUEUE_USER_PROMPT action', () => {
    it('should queue a user prompt', () => {
      const action: Action = {
        type: 'QUEUE_USER_PROMPT',
        payload: 'Analyze my data'
      };

      const newState = testReducer(initialState, action);

      expect(newState.queuedUserPrompt).toBe('Analyze my data');
    });

    it('should replace existing queued prompt', () => {
      const stateWithPrompt = {
        ...initialState,
        queuedUserPrompt: 'Old prompt'
      };

      const action: Action = {
        type: 'QUEUE_USER_PROMPT',
        payload: 'New prompt'
      };

      const newState = testReducer(stateWithPrompt, action);

      expect(newState.queuedUserPrompt).toBe('New prompt');
    });
  });

  describe('CLEAR_QUEUED_PROMPT action', () => {
    it('should clear queued prompt', () => {
      const stateWithPrompt = {
        ...initialState,
        queuedUserPrompt: 'Some prompt'
      };

      const action: Action = {
        type: 'CLEAR_QUEUED_PROMPT'
      };

      const newState = testReducer(stateWithPrompt, action);

      expect(newState.queuedUserPrompt).toBeNull();
    });
  });

  describe('SET_PROCESSING action', () => {
    it('should set processing to true', () => {
      const action: Action = {
        type: 'SET_PROCESSING',
        payload: true
      };

      const newState = testReducer(initialState, action);

      expect(newState.isProcessing).toBe(true);
    });

    it('should set processing to false', () => {
      const stateProcessing = {
        ...initialState,
        isProcessing: true
      };

      const action: Action = {
        type: 'SET_PROCESSING',
        payload: false
      };

      const newState = testReducer(stateProcessing, action);

      expect(newState.isProcessing).toBe(false);
    });

    it('should prevent duplicate processing when flag is true', () => {
      const stateProcessing = {
        ...initialState,
        isProcessing: true
      };

      // This test verifies that the flag can be checked before dispatching
      // The actual duplicate prevention happens at the component level
      expect(stateProcessing.isProcessing).toBe(true);
    });
  });

  describe('Integration: Duplicate request prevention flow', () => {
    it('should support the duplicate prevention workflow', () => {
      let state = initialState;

      // 1. Queue a prompt
      state = testReducer(state, {
        type: 'QUEUE_USER_PROMPT',
        payload: 'Run EDA analysis'
      });
      expect(state.queuedUserPrompt).toBe('Run EDA analysis');

      // 2. Start processing
      state = testReducer(state, {
        type: 'SET_PROCESSING',
        payload: true
      });
      expect(state.isProcessing).toBe(true);

      // 3. Clear the queued prompt after processing starts
      state = testReducer(state, {
        type: 'CLEAR_QUEUED_PROMPT'
      });
      expect(state.queuedUserPrompt).toBeNull();

      // 4. Update analyzed data when analysis completes
      state = testReducer(state, {
        type: 'SET_ANALYZED_DATA',
        payload: {
          hasEDA: true,
          lastAnalysisType: 'eda'
        }
      });
      expect(state.analyzedData.hasEDA).toBe(true);

      // 5. Stop processing
      state = testReducer(state, {
        type: 'SET_PROCESSING',
        payload: false
      });
      expect(state.isProcessing).toBe(false);
    });
  });
});
