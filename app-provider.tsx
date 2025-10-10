"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { BusinessUnit, LineOfBusiness, ChatMessage, WorkflowStep } from '@/lib/types';
import { getAPIClient } from '@/lib/api-client';
import type { AgentMonitorProps } from '@/lib/types';

type OnboardingStep =
  | 'welcome'
  | 'create_bu'
  | 'create_lob'
  | 'upload_data'
  | 'use_mock_data'
  | 'analyze'
  | 'complete';

type OnboardingProgressStep = {
  id: OnboardingStep;
  name: string;
  status: 'pending' | 'active' | 'completed';
  description: string;
};

type AppState = {
  apiKey: string | null;
  businessUnits: BusinessUnit[];
  selectedBu: BusinessUnit | null;
  selectedLob: LineOfBusiness | null;
  messages: ChatMessage[];
  workflow: WorkflowStep[];
  isProcessing: boolean;
  thinkingSteps: string[];
  agentMonitor: AgentMonitorProps;
  dataPanelOpen: boolean;
  dataPanelMode: 'dashboard' | 'charts' | 'insights' | 'data';
  dataPanelTarget: 'Value' | 'Orders';
  dataPanelWidthPct: number; // 20 - 70
  isOnboarding: boolean;
  onboardingStep: OnboardingStep;
  onboardingProgress: OnboardingProgressStep[];
  queuedUserPrompt?: string | null;
  analyzedData: {
    hasEDA: boolean;
    hasForecasting: boolean;
    hasInsights: boolean;
    lastAnalysisType?: string;
  };
  forecastMetrics?: {
    mape?: number;
    model?: string;
    accuracy?: number;
    [key: string]: any;
  };
  dateRange?: {
    start: Date;
    end: Date;
    preset?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  };
  isAuthenticated: boolean;
};

type Action =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_AUTH'; payload: boolean }
  | { type: 'SET_SELECTED_BU'; payload: BusinessUnit | null }
  | { type: 'SET_SELECTED_LOB'; payload: LineOfBusiness | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: Partial<ChatMessage> }
  | { type: 'STREAM_UPDATE_LAST_MESSAGE'; payload: { contentChunk: string } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_THINKING_STEPS'; payload: string[] }
  | { type: 'ADD_THINKING_STEP'; payload: string }
  | { type: 'CLEAR_THINKING_STEPS' }
  | { type: 'UPDATE_WORKFLOW_STEP'; payload: Partial<WorkflowStep> & { id: string } }
  | { type: 'SET_WORKFLOW'; payload: WorkflowStep[] }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'SET_AGENT_MONITOR_OPEN'; payload: boolean }
  | { type: 'ADD_BU'; payload: { name: string; description: string; id?: string } }
  | { type: 'ADD_LOB'; payload: { buId: string; name: string; description: string; id?: string } }
  | { type: 'UPLOAD_DATA', payload: { lobId: string, file: File } }
  | { type: 'TOGGLE_VISUALIZATION', payload: { messageId: string } }
  | { type: 'SET_DATA_PANEL_OPEN'; payload: boolean }
  | { type: 'SET_DATA_PANEL_MODE'; payload: 'dashboard' | 'charts' | 'insights' | 'data' }
  | { type: 'SET_DATA_PANEL_TARGET'; payload: 'Value' | 'Orders' }
  | { type: 'SET_DATA_PANEL_WIDTH'; payload: number }
  | { type: 'END_ONBOARDING' }
  | { type: 'QUEUE_USER_PROMPT'; payload: string }
  | { type: 'CLEAR_QUEUED_PROMPT' }
  | { type: 'GENERATE_REPORT'; payload: { messageId: string; reportData: any; agentType: string; timestamp: string } }
  | { type: 'SET_ANALYZED_DATA'; payload: { hasEDA?: boolean; hasForecasting?: boolean; hasInsights?: boolean; lastAnalysisType?: string } }
  | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date; preset?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' } }
  | { type: 'ADD_FORECAST_DATA' }
  | { type: 'SET_FORECAST_METRICS'; payload: { mape?: number; model?: string; accuracy?: number; [key: string]: any } }
  | { type: 'SET_ONBOARDING_STEP'; payload: OnboardingStep }
  | { type: 'ADVANCE_ONBOARDING_STEP' }
  | { type: 'RESET_ONBOARDING_PROGRESS' }
  | { type: 'SET_ONBOARDING_PROGRESS'; payload: OnboardingProgressStep[] }
  | { type: 'SET_BUSINESS_UNITS'; payload: BusinessUnit[] }
  | { type: 'SET_LOADING'; payload: boolean };

const defaultOnboardingProgress: OnboardingProgressStep[] = [
  { id: 'welcome', name: 'Welcome', status: 'completed', description: 'Welcome to the BI onboarding assistant.' },
  { id: 'create_bu', name: 'Create Business Unit', status: 'pending', description: 'Set up your first Business Unit.' },
  { id: 'create_lob', name: 'Create Line of Business', status: 'pending', description: 'Add a Line of Business to your BU.' },
  { id: 'upload_data', name: 'Upload Data', status: 'pending', description: 'Upload your data or use demo data.' },
  { id: 'use_mock_data', name: 'Use Demo Data', status: 'pending', description: 'Generate and use 5-year mock data for demo/analysis.' },
  { id: 'analyze', name: 'Analyze & Explore', status: 'pending', description: 'Analyze, visualize, and explore your data.' },
  { id: 'complete', name: 'Complete', status: 'pending', description: 'Onboarding complete! Ready for advanced analysis.' },
];

const initialState: AppState = {
  apiKey: null,
  businessUnits: [],
  isAuthenticated: typeof window !== "undefined" ? localStorage.getItem("isAuthenticated") === "true" : false,
  selectedBu: null,
  selectedLob: null,
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your BI forecasting assistant. Select a Business Unit and Line of Business to get started.",
      suggestions: ['Compare LOB performance', 'Summarize the key business drivers', 'Upload new data']
    },
  ],
  workflow: [],
  isProcessing: false,
  thinkingSteps: [],
  agentMonitor: {
    isOpen: false,
  },
  dataPanelOpen: false,
  dataPanelMode: 'dashboard',
  dataPanelTarget: 'Value',
  dataPanelWidthPct: 40,
  isOnboarding: true,
  onboardingStep: 'welcome',
  onboardingProgress: defaultOnboardingProgress,
  queuedUserPrompt: null,
  analyzedData: {
    hasEDA: false,
    hasForecasting: false,
    hasInsights: false,
  },
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    preset: 'last_30_days'
  },
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AUTH':
      if (typeof window !== "undefined") {
        localStorage.setItem("isAuthenticated", action.payload.toString());
      }
      return { ...state, isAuthenticated: action.payload };

    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'SET_SELECTED_BU':
      return { ...state, selectedBu: action.payload, selectedLob: null };

    case 'SET_SELECTED_LOB':
      return { ...state, selectedLob: action.payload };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? { ...msg, ...action.payload } : msg
        ),
      };

    case 'STREAM_UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? { ...msg, content: msg.content + action.payload.contentChunk }
            : msg
        ),
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_THINKING_STEPS':
      return { ...state, thinkingSteps: action.payload };

    case 'ADD_THINKING_STEP':
      return { ...state, thinkingSteps: [...state.thinkingSteps, action.payload] };

    case 'CLEAR_THINKING_STEPS':
      return { ...state, thinkingSteps: [] };

    case 'UPDATE_WORKFLOW_STEP':
      return {
        ...state,
        workflow: state.workflow.map(step =>
          step.id === action.payload.id ? { ...step, ...action.payload } : step
        ),
      };

    case 'SET_WORKFLOW':
      return { ...state, workflow: action.payload };

    case 'RESET_WORKFLOW':
      return { ...state, workflow: [] };

    case 'SET_AGENT_MONITOR_OPEN':
      return {
        ...state,
        agentMonitor: { ...state.agentMonitor, isOpen: action.payload },
      };

    case 'ADD_BU': {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const now = new Date();
      const newBu: BusinessUnit = {
        id: action.payload.id || `bu-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description,
        code: `BU${Date.now()}`,
        startDate: now,
        displayName: action.payload.name,
        color: colors[state.businessUnits.length % colors.length],
        lobs: [],
        createdDate: now,
        updatedDate: now,
        status: 'active',
      };
      return { ...state, businessUnits: [...state.businessUnits, newBu] };
    }

    case 'ADD_LOB': {
      const now = new Date();
      return {
        ...state,
        businessUnits: state.businessUnits.map(bu =>
          bu.id === action.payload.buId
            ? {
              ...bu,
              lobs: [
                ...bu.lobs,
                {
                  id: action.payload.id || `lob-${Date.now()}`,
                  name: action.payload.name,
                  description: action.payload.description,
                  code: `LOB${Date.now()}`,
                  businessUnitId: action.payload.buId,
                  startDate: now,
                  hasData: false,
                  dataUploaded: null,
                  recordCount: 0,
                  dataQuality: { trend: 'stable', seasonality: 'none' },
                  createdDate: now,
                  updatedDate: now,
                  status: 'active',
                },
              ],
            }
            : bu
        ),
      };
    }

    case 'UPLOAD_DATA':
      return {
        ...state,
        businessUnits: state.businessUnits.map(bu => ({
          ...bu,
          lobs: bu.lobs.map(lob =>
            lob.id === action.payload.lobId
              ? { ...lob, recordCount: lob.recordCount + 1, hasData: true, dataUploaded: new Date() }
              : lob
          ),
        })),
      };

    case 'TOGGLE_VISUALIZATION':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId && msg.visualization
            ? { ...msg, visualization: { ...msg.visualization, isShowing: !msg.visualization.isShowing } }
            : msg
        ),
      };

    case 'SET_DATA_PANEL_OPEN':
      return { ...state, dataPanelOpen: action.payload };

    case 'SET_DATA_PANEL_MODE':
      return { ...state, dataPanelMode: action.payload };

    case 'SET_DATA_PANEL_TARGET':
      return { ...state, dataPanelTarget: action.payload };

    case 'SET_DATA_PANEL_WIDTH':
      return { ...state, dataPanelWidthPct: Math.max(20, Math.min(70, action.payload)) };

    case 'END_ONBOARDING':
      return { ...state, isOnboarding: false };

    case 'QUEUE_USER_PROMPT':
      return { ...state, queuedUserPrompt: action.payload };

    case 'CLEAR_QUEUED_PROMPT':
      return { ...state, queuedUserPrompt: null };

    case 'GENERATE_REPORT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, reportData: action.payload.reportData }
            : msg
        ),
      };

    case 'SET_ANALYZED_DATA':
      return {
        ...state,
        analyzedData: { ...state.analyzedData, ...action.payload },
      };

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };

    case 'ADD_FORECAST_DATA':
      return state;

    case 'SET_FORECAST_METRICS':
      return {
        ...state,
        forecastMetrics: action.payload,
      };

    case 'SET_ONBOARDING_STEP': {
      const stepIndex = state.onboardingProgress.findIndex(s => s.id === action.payload);
      const updatedProgress = state.onboardingProgress.map((step, idx) => ({
        ...step,
        status: (
          idx < stepIndex
            ? 'completed'
            : idx === stepIndex
              ? 'active'
              : 'pending'
        ) as 'pending' | 'active' | 'completed',
      }));
      return { ...state, onboardingStep: action.payload, onboardingProgress: updatedProgress };
    }

    case 'ADVANCE_ONBOARDING_STEP': {
      const currentIdx = state.onboardingProgress.findIndex(s => s.id === state.onboardingStep);
      const nextIdx = Math.min(currentIdx + 1, state.onboardingProgress.length - 1);
      const nextStep = state.onboardingProgress[nextIdx].id;
      const updatedProgress = state.onboardingProgress.map((step, idx) => ({
        ...step,
        status: (
          idx < nextIdx
            ? 'completed'
            : idx === nextIdx
              ? 'active'
              : 'pending'
        ) as 'pending' | 'active' | 'completed',
      }));
      return { ...state, onboardingStep: nextStep, onboardingProgress: updatedProgress };
    }

    case 'RESET_ONBOARDING_PROGRESS':
      return {
        ...state,
        onboardingStep: 'welcome',
        onboardingProgress: defaultOnboardingProgress.map((step, idx) => ({
          ...step,
          status: (idx === 0 ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
        })),
      };

    case 'SET_ONBOARDING_PROGRESS':
      return { ...state, onboardingProgress: action.payload };

    case 'SET_BUSINESS_UNITS':
      return { ...state, businessUnits: action.payload };

    case 'SET_LOADING':
      return { ...state, isProcessing: action.payload };

    default:
      return state;
  }
}

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshData: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [hasLoadedData, setHasLoadedData] = React.useState(false);

  // Load business units from backend on mount
  React.useEffect(() => {
    const loadBusinessUnits = async () => {
      // Check if authenticated
      const isAuthenticated = typeof window !== 'undefined' 
        ? localStorage.getItem('isAuthenticated') === 'true'
        : false;

      if (!isAuthenticated || hasLoadedData) {
        return;
      }

      try {
        dispatch({ type: 'SET_PROCESSING', payload: true });
        
        // Show loading message
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: 'loading-bu-lob',
            role: 'assistant',
            content: '🔄 Loading your Business Units and Lines of Business from the backend...',
            isTyping: true,
          },
        });
        
        const apiClient = getAPIClient();
        
        // Get credentials from localStorage or use defaults
        const username = typeof window !== 'undefined' 
          ? localStorage.getItem('zentere_username') || 'martin@demo.com'
          : 'martin@demo.com';
        const password = typeof window !== 'undefined'
          ? localStorage.getItem('zentere_password') || 'demo'
          : 'demo';

        console.log('🔐 Authenticating with:', username);

        // Authenticate
        await apiClient.authenticate(username, password);
        
        console.log('✅ Authentication successful, fetching data...');

        // Fetch business units with LOBs and their data
        const businessUnits = await apiClient.getBusinessUnitsWithLOBs();
        
        console.log('📊 Loaded BUs:', businessUnits.length);

        dispatch({ type: 'SET_BUSINESS_UNITS', payload: businessUnits });
        setHasLoadedData(true);
        
        // Update the loading message with success
        const totalLobs = businessUnits.reduce((sum, bu) => sum + bu.lobs.length, 0);
        const lobsWithData = businessUnits.reduce(
          (sum, bu) => sum + bu.lobs.filter(lob => lob.hasData).length, 
          0
        );
        
        dispatch({
          type: 'UPDATE_LAST_MESSAGE',
          payload: {
            content: `✅ **Successfully loaded from backend!**\n\n📊 **Summary:**\n• ${businessUnits.length} Business Units\n• ${totalLobs} Lines of Business\n• ${lobsWithData} LOBs with data\n\nSelect a Business Unit and Line of Business to get started with analysis.`,
            isTyping: false,
            suggestions: ['View all Business Units', 'Create new Business Unit', 'Upload data to LOB'],
          },
        });
      } catch (error) {
        console.error('❌ Failed to load business units:', error);
        
        dispatch({
          type: 'UPDATE_LAST_MESSAGE',
          payload: {
            content: `❌ **Failed to load data from backend**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your connection and try again.`,
            isTyping: false,
            suggestions: ['Retry loading', 'Use demo data', 'Check connection'],
          },
        });
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    };

    loadBusinessUnits();
  }, []); // Run once on mount

  // Manual refresh function
  const refreshData = React.useCallback(async () => {
    const isAuthenticated = typeof window !== 'undefined' 
      ? localStorage.getItem('isAuthenticated') === 'true'
      : false;

    if (!isAuthenticated) {
      return;
    }

    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '🔄 Refreshing data from backend...',
          isTyping: true,
        },
      });

      const apiClient = getAPIClient();
      const username = localStorage.getItem('zentere_username') || 'martin@demo.com';
      const password = localStorage.getItem('zentere_password') || 'demo';

      await apiClient.authenticate(username, password);
      const businessUnits = await apiClient.getBusinessUnitsWithLOBs();
      
      dispatch({ type: 'SET_BUSINESS_UNITS', payload: businessUnits });
      
      const totalLobs = businessUnits.reduce((sum, bu) => sum + bu.lobs.length, 0);
      const lobsWithData = businessUnits.reduce(
        (sum, bu) => sum + bu.lobs.filter(lob => lob.hasData).length, 
        0
      );

      dispatch({
        type: 'UPDATE_LAST_MESSAGE',
        payload: {
          content: `✅ **Data refreshed successfully!**\n\n📊 **Summary:**\n• ${businessUnits.length} Business Units\n• ${totalLobs} Lines of Business\n• ${lobsWithData} LOBs with data`,
          isTyping: false,
          suggestions: ['View Business Units', 'Analyze data', 'Upload new data'],
        },
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      dispatch({
        type: 'UPDATE_LAST_MESSAGE',
        payload: {
          content: `❌ **Failed to refresh data**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isTyping: false,
          suggestions: ['Try again', 'Check connection'],
        },
      });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
