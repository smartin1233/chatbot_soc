"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { BusinessUnit, LineOfBusiness, ChatMessage, WorkflowStep, BUCreationData, LOBCreationData, DateRange, WeeklyData, OutlierData, ForecastData } from '@/lib/types';
import { getAPIClient } from '@/lib/api-client';
import type { AgentMonitorProps } from '@/lib/types';

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
  dataPanelMode: 'chart' | 'table' | 'menu';
  dataPanelTarget: 'units' | 'revenue';
  dataPanelWidthPct: number; // Range: 20 to 70 percent
  isOnboarding: boolean;
  queuedUserPrompt?: string | null;
  insightsPanelOpen: boolean;
  dateRange: DateRange;
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
  conversationContext: {
    topics: string[]; // for example, ['data_exploration', 'forecasting', 'modeling']
    currentPhase: 'onboarding' | 'exploration' | 'analysis' | 'modeling' | 'forecasting' | 'insights';
    completedTasks: string[];
    userIntent: string; // Description of what user wants to achieve
  };
  userActivity: {
    hasSelectedBU: boolean;
    hasSelectedLOB: boolean;
    hasUploadedData: boolean;
    hasPerformedEDA: boolean;
    hasPreprocessed: boolean;
    hasTrainedModels: boolean;
    hasGeneratedForecast: boolean;
    hasViewedInsights: boolean;
    lastAction: string;
    lastAgentType?: string;
  };
};

type Action =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_SELECTED_BU'; payload: BusinessUnit | null }
  | { type: 'SET_SELECTED_LOB'; payload: LineOfBusiness | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'REMOVE_MESSAGE'; payload: string }
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
  | { type: 'ADD_BU'; payload: BUCreationData }
  | { type: 'ADD_LOB'; payload: LOBCreationData }
  | { type: 'UPLOAD_DATA', payload: { lobId: string, file: File } }
  | { type: 'UPDATE_LOB_FORECAST'; payload: { lobId: string, forecastData: WeeklyData[], forecastMetrics: any } }
  | { type: 'TRACK_ACTIVITY'; payload: Partial<AppState['userActivity']> }
  | { type: 'TOGGLE_VISUALIZATION', payload: { messageId: string } }
  | { type: 'SET_DATA_PANEL_OPEN'; payload: boolean }
  | { type: 'SET_DATA_PANEL_MODE'; payload: 'chart' | 'table' | 'menu' }
  | { type: 'SET_DATA_PANEL_TARGET'; payload: 'units' | 'revenue' }
  | { type: 'SET_DATA_PANEL_WIDTH'; payload: number }
  | { type: 'SET_INSIGHTS_PANEL_OPEN'; payload: boolean }
  | { type: 'SET_DATE_RANGE'; payload: DateRange }
  | { type: 'UPDATE_ANALYZED_DATA'; payload: Partial<AppState['analyzedData']> }
  | { type: 'SET_ANALYZED_DATA'; payload: Partial<AppState['analyzedData']> }
  | { type: 'RESET_ANALYZED_DATA' }
  | { type: 'END_ONBOARDING' }
  | { type: 'QUEUE_USER_PROMPT'; payload: string }
  | { type: 'CLEAR_QUEUED_PROMPT' }
  | { type: 'GENERATE_REPORT'; payload: { messageId: string; reportData: any; agentType: string; timestamp: string } }
  | {
    type: 'UPDATE_CONVERSATION_CONTEXT'; payload: {
      topics?: string[];
      currentPhase?: string;
      completedTasks?: string[];
      userIntent?: string;
    }
  }
  | { type: 'SET_BUSINESS_UNITS'; payload: BusinessUnit[] };


const initialState: AppState = {
  apiKey: null,
  businessUnits: [],
  selectedBu: null,
  selectedLob: null,
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your BI forecasting assistant. Select a Business Unit and Line of Business to get started.",
      suggestions: ['Create Business Unit', 'Create Line of Business', 'View existing BU/LOBs', 'Help me get started']
    },
  ],
  workflow: [],
  isProcessing: false,
  thinkingSteps: [],
  agentMonitor: {
    isOpen: false,
  },
  dataPanelOpen: false,
  dataPanelMode: 'chart',
  dataPanelTarget: 'units',
  dataPanelWidthPct: 40,
  isOnboarding: true,
  queuedUserPrompt: null,
  insightsPanelOpen: false,
  dateRange: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    end: new Date(),
    preset: 'last_90_days'
  },
  analyzedData: {
    hasEDA: false,
    hasForecasting: false,
    hasInsights: false,
    hasPreprocessing: false,
    lastAnalysisDate: null,
    lastAnalysisType: null,
    outliers: [],
    forecastData: []
  },
  conversationContext: {
    topics: [],
    currentPhase: 'onboarding',
    completedTasks: [],
    userIntent: ''
  },
  userActivity: {
    hasSelectedBU: false,
    hasSelectedLOB: false,
    hasUploadedData: false,
    hasPerformedEDA: false,
    hasPreprocessed: false,
    hasTrainedModels: false,
    hasGeneratedForecast: false,
    hasViewedInsights: false,
    lastAction: 'initial',
    lastAgentType: undefined
  }
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'SET_SELECTED_BU':
      // Don't clear workflow when selecting BU - let it continue if active
      return { 
        ...state, 
        selectedBu: action.payload, 
        selectedLob: action.payload?.lobs[0] || null,
        userActivity: {
          ...state.userActivity,
          hasSelectedBU: !!action.payload,
          hasSelectedLOB: !!(action.payload?.lobs[0]),
          lastAction: 'select_bu'
        }
      };
    case 'SET_SELECTED_LOB':
      // Don't clear workflow when selecting LOB - let it continue if active
      return {
        ...state,
        selectedLob: action.payload,
        // Keep workflow and processing state
        // Reset analyzed data for new LOB
        analyzedData: {
          hasEDA: false,
          hasForecasting: false,
          hasInsights: false,
          hasPreprocessing: false,
          lastAnalysisDate: null,
          lastAnalysisType: null,
          outliers: [],
          forecastData: []
        },
        userActivity: {
          ...state.userActivity,
          hasSelectedLOB: !!action.payload,
          hasUploadedData: action.payload?.hasData || false,
          // Reset analysis flags when switching LOB
          hasPerformedEDA: false,
          hasPreprocessed: false,
          hasTrainedModels: false,
          hasGeneratedForecast: false,
          hasViewedInsights: false,
          lastAction: 'select_lob'
        }
      };
    case 'ADD_MESSAGE': {
      const messages = state.messages.filter(m => !m.isTyping || action.payload.isTyping);
      return { ...state, messages: [...messages, action.payload] };
    }
    case 'REMOVE_MESSAGE':
      return { 
        ...state, 
        messages: state.messages.filter(m => m.id !== action.payload) 
      };
    case 'UPDATE_LAST_MESSAGE':
      const updatedMessages = [...state.messages];
      const lastMessageIndex = updatedMessages.length - 1;
      if (lastMessageIndex >= 0) {
        updatedMessages[lastMessageIndex] = { ...updatedMessages[lastMessageIndex], ...action.payload };
      }
      return { ...state, messages: updatedMessages };
    case 'STREAM_UPDATE_LAST_MESSAGE': {
      const updatedMessages = [...state.messages];
      const lastMessageIndex = updatedMessages.length - 1;
      if (lastMessageIndex >= 0) {
        const lastMessage = updatedMessages[lastMessageIndex];
        updatedMessages[lastMessageIndex] = {
          ...lastMessage,
          content: lastMessage.content + action.payload.contentChunk,
        };
      }
      return { ...state, messages: updatedMessages };
    }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_THINKING_STEPS':
      return { ...state, thinkingSteps: action.payload };
    case 'ADD_THINKING_STEP':
      return { ...state, thinkingSteps: [...state.thinkingSteps, action.payload] };
    case 'CLEAR_THINKING_STEPS':
      return { ...state, thinkingSteps: [] };
    case 'UPDATE_WORKFLOW_STEP':
      const newWorkflow = state.workflow.map(step =>
        step.id === action.payload.id ? { ...step, ...action.payload } : step
      );
      const isStillProcessing = newWorkflow.some(step => step.status === 'active' || step.status === 'pending');
      const allCompleted = newWorkflow.every(step => step.status === 'completed');
      return {
        ...state,
        workflow: newWorkflow,
        isProcessing: allCompleted ? false : isStillProcessing,
      };
    case 'SET_WORKFLOW':
      return { ...state, workflow: action.payload, isProcessing: true };
    case 'RESET_WORKFLOW':
      return { ...state, workflow: [], isProcessing: false };
    case 'SET_AGENT_MONITOR_OPEN':
      return { ...state, agentMonitor: { ...state.agentMonitor, isOpen: action.payload } };
    case 'SET_DATA_PANEL_OPEN':
      return { ...state, dataPanelOpen: action.payload };
    case 'SET_DATA_PANEL_MODE':
      return { ...state, dataPanelMode: action.payload };
    case 'SET_DATA_PANEL_TARGET':
      return { ...state, dataPanelTarget: action.payload };
    case 'SET_DATA_PANEL_WIDTH': {
      const w = Math.min(70, Math.max(20, Math.round(action.payload)));
      return { ...state, dataPanelWidthPct: w };
    }
    case 'SET_INSIGHTS_PANEL_OPEN':
      return { ...state, insightsPanelOpen: action.payload };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    case 'UPDATE_ANALYZED_DATA':
      return {
        ...state,
        analyzedData: {
          ...state.analyzedData,
          ...action.payload,
          lastAnalysisDate: new Date()
        }
      };
    case 'SET_ANALYZED_DATA':
      return {
        ...state,
        analyzedData: {
          ...state.analyzedData,
          ...action.payload,
          lastAnalysisDate: new Date()
        }
      };
    case 'RESET_ANALYZED_DATA':
      return {
        ...state,
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
    case 'END_ONBOARDING':
      return { ...state, isOnboarding: false };
    case 'QUEUE_USER_PROMPT':
      return { ...state, queuedUserPrompt: action.payload };
    case 'CLEAR_QUEUED_PROMPT':
      return { ...state, queuedUserPrompt: null };
    case 'ADD_BU': {
      const now = new Date();
      const newBu: BusinessUnit = {
        id: `bu-${crypto.randomUUID()}`,
        name: action.payload.name,
        description: action.payload.description,
        code: action.payload.code,
        startDate: action.payload.startDate,
        displayName: action.payload.displayName,
        color: getRandomColor(),
        lobs: [],
        createdDate: now,
        updatedDate: now,
        status: 'active',
      };

      // Add professional success message
      const successMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `✅ **Business Unit "${action.payload.name}" created successfully!**\n\nYour new Business Unit is now ready for use. You can start adding Lines of Business to organize your forecasting data.`,
        suggestions: [
          'Add Line of Business',
          'Upload Data',
          'View All Business Units'
        ]
      };

      return {
        ...state,
        businessUnits: [...state.businessUnits, newBu],
        messages: [...state.messages, successMessage]
      };
    }
    case 'ADD_LOB': {
      const now = new Date();
      const newLob: LineOfBusiness = {
        id: `lob-${crypto.randomUUID()}`,
        name: action.payload.name,
        description: action.payload.description,
        code: action.payload.code,
        businessUnitId: action.payload.businessUnitId,
        startDate: action.payload.startDate,
        hasData: false,
        dataUploaded: null,
        recordCount: 0,
        createdDate: now,
        updatedDate: now,
        status: 'active',
      };

      const parentBU = state.businessUnits.find(bu => bu.id === action.payload.businessUnitId);

      // Add professional success message
      const successMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `✅ **Line of Business "${action.payload.name}" created successfully!**\n\nYour new LOB has been added to ${parentBU?.name || 'the selected Business Unit'}. You can now upload data to start forecasting.`,
        suggestions: [
          'Upload Data for this LOB',
          'Create Another LOB',
          'View LOB Details'
        ]
      };

      return {
        ...state,
        businessUnits: state.businessUnits.map(bu =>
          bu.id === action.payload.businessUnitId
            ? { ...bu, lobs: [...bu.lobs, newLob], updatedDate: now }
            : bu
        ),
        messages: [...state.messages, successMessage]
      };
    }
    case 'UPLOAD_DATA': {
      // TODO: Parse actual file data and send to backend
      // For now, mark as uploaded and let backend handle the data
      const businessUnitsWithData = state.businessUnits.map(bu => ({
        ...bu,
        lobs: bu.lobs.map(lob =>
          lob.id === action.payload.lobId
            ? {
              ...lob,
              hasData: true,
              file: action.payload.file,
              recordCount: 0, // Will be set after backend processing
              dataUploaded: new Date(),
              dataQuality: {
                completeness: 0, // Will be calculated from actual data
                outliers: 0, // Will be detected from actual data
                seasonality: 'unknown',
                trend: 'unknown'
              }
            }
            : lob
        )
      }));
      const updatedLob = businessUnitsWithData.flatMap(bu => bu.lobs).find(lob => lob.id === action.payload.lobId);
      const newMessages: ChatMessage[] = [...state.messages];
      if (updatedLob) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I've uploaded "${action.payload.file.name}" and analyzed the data for the ${updatedLob.name} LOB. It contains ${updatedLob.recordCount} records.`,
          suggestions: ['Explore data quality', 'Analyze patterns and trends', 'Check for seasonality', 'Run forecast analysis']
        });
      }
      return { 
        ...state, 
        businessUnits: businessUnitsWithData, 
        messages: newMessages,
        userActivity: {
          ...state.userActivity,
          hasUploadedData: true,
          lastAction: 'upload_data'
        }
      };
    }
    case 'UPDATE_LOB_FORECAST': {
      return {
        ...state,
        businessUnits: state.businessUnits.map(bu => ({
          ...bu,
          lobs: bu.lobs.map(lob =>
            lob.id === action.payload.lobId
              ? {
                  ...lob,
                  timeSeriesData: action.payload.forecastData,
                  forecastMetrics: action.payload.forecastMetrics
                }
              : lob
          )
        })),
        selectedLob: state.selectedLob?.id === action.payload.lobId
          ? {
              ...state.selectedLob,
              timeSeriesData: action.payload.forecastData,
              forecastMetrics: action.payload.forecastMetrics
            }
          : state.selectedLob
      };
    }
    case 'TOGGLE_VISUALIZATION': {
      return {
        ...state,
        messages: state.messages.map(msg => {
          if (msg.id === action.payload.messageId && msg.visualization) {
            return { ...msg, visualization: { ...msg.visualization, isShowing: !msg.visualization.isShowing } };
          }
          return msg;
        })
      };
    }
    case 'GENERATE_REPORT': {
      // Placeholder for report generation logic
      // For now, log the report generation activity
      console.log('Generating report for message:', action.payload.messageId);
      // Could add logic to save report, update state, etc.
      return state;
    }
    case 'TRACK_ACTIVITY': {
      return {
        ...state,
        userActivity: {
          ...state.userActivity,
          ...action.payload
        }
      };
    }
    case 'UPDATE_CONVERSATION_CONTEXT':
      return {
        ...state,
        conversationContext: {
          ...state.conversationContext,
          ...action.payload
        }
      };

    case 'SET_BUSINESS_UNITS':
      return { ...state, businessUnits: action.payload };

    default:
      return state;
  }
}

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [hasLoadedData, setHasLoadedData] = React.useState(false);

  // Load business units from backend on mount
  useEffect(() => {
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

        console.log('📊 Loaded BUs:', businessUnits.length, businessUnits);
        console.log('📊 First BU structure:', businessUnits[0]);
        console.log('📊 First BU LOBs:', businessUnits[0]?.lobs);

        dispatch({ type: 'SET_BUSINESS_UNITS', payload: businessUnits });
        setHasLoadedData(true);

        console.log('✅ State updated with business units');

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

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('Network error') || errorMessage.includes('fetch');

        dispatch({
          type: 'UPDATE_LAST_MESSAGE',
          payload: {
            content: `❌ **Failed to load data from backend**\n\n**Error:** ${errorMessage}\n\n${isNetworkError ? '**Possible causes:**\n• API server is not accessible\n• CORS is blocking the request\n• Network connection issue\n\n**Solutions:**\n• Check if the API is running at https://app-api-dev.zentere.com\n• Try using a VPN or different network\n• Contact your administrator to enable CORS\n• Use demo data for testing' : 'Please check your credentials and try again.'}\n\n**Note:** You can continue using the app with demo data by creating Business Units manually.`,
            isTyping: false,
            suggestions: ['Create Business Unit', 'Create Line of Business', 'Contact Support'],
          },
        });
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    };

    loadBusinessUnits();
  }, []); // Run once on mount

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
