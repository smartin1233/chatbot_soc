
import type { BusinessUnit, Agent, AgentCommunication, WorkflowStep, WeeklyData } from './types';

// Mock Data Generator
function generateWeeklyData(totalRecords: number, lobType: string): WeeklyData[] {
  const data: WeeklyData[] = [];
  const baseValue: { [key: string]: number } = {
    'premium-phone': 45,
    'premium-chat': 32,
    'mass-phone': 120,
    'mass-chat': 85,
    'ecom-phone': 95,
    'ecom-chat': 67
  }[lobType] || 50;

  for (let week = 1; week <= 52; week++) {
    const seasonalMultiplier = 1 + 0.2 * Math.sin((week / 52) * 2 * Math.PI);
    const weeklyMultiplier = week % 7 < 5 ? 1.2 : 0.8; // Weekday vs weekend
    const randomVariation = 0.9 + Math.random() * 0.2;
    
    const value = Math.round(baseValue * seasonalMultiplier * weeklyMultiplier * randomVariation);
    const orders = Math.round(value * (0.8 + Math.random() * 0.4));
    
    data.push({
      Date: new Date(2024, 0, week * 7),
      Value: value,
      Orders: orders,
    });
  }
  
  return data;
}


export const mockBusinessUnits: BusinessUnit[] = [
  {
    id: 'bu-premium',
    name: 'Premium Order Services',
    description: 'High-value customer service operations',
    color: '#8B5CF6',
    lobs: [
      {
        id: 'lob-premium-phone',
        name: 'Phone',
        description: 'Premium phone support services',
        hasData: true,
        dataUploaded: new Date('2024-01-10'),
        recordCount: 1250,
        mockData: generateWeeklyData(1250, 'premium-phone'),
        dataQuality: {
          seasonality: 'strong_weekly',
          trend: 'increasing'
        }
      },
      {
        id: 'lob-premium-chat',
        name: 'Chat', 
        description: 'Premium chat support services',
        hasData: true,
        dataUploaded: new Date('2024-01-10'),
        recordCount: 890,
        mockData: generateWeeklyData(890, 'premium-chat'),
        dataQuality: {
          seasonality: 'moderate_weekly',
          trend: 'stable'
        }
      }
    ]
  },
  {
    id: 'bu-mass',
    name: 'Mass Order Services',
    description: 'High-volume customer service operations',
    color: '#10B981',
    lobs: [
      {
        id: 'lob-mass-phone',
        name: 'Phone',
        description: 'Mass market phone support',
        hasData: true,
        dataUploaded: new Date('2024-01-08'),
        recordCount: 3450,
        mockData: generateWeeklyData(3450, 'mass-phone'),
        dataQuality: {
          seasonality: 'strong_weekly_monthly',
          trend: 'increasing'
        }
      },
      {
        id: 'lob-mass-chat',
        name: 'Chat',
        description: 'Mass market chat support',
        hasData: true,
        dataUploaded: new Date('2024-01-08'),
        recordCount: 2100,
        mockData: generateWeeklyData(2100, 'mass-chat'),
        dataQuality: {
          seasonality: 'moderate_weekly',
          trend: 'stable'
        }
      }
    ]
  },
  {
    id: 'bu-ecom',
    name: 'ECOM',
    description: 'E-commerce platform services',
    color: '#F59E0B',
    lobs: [
      {
        id: 'lob-ecom-phone',
        name: 'Phone',
        description: 'E-commerce phone support',
        hasData: true, // NOW HAS MOCK DATA
        dataUploaded: new Date('2024-01-12'),
        recordCount: 2800,
        mockData: generateWeeklyData(2800, 'ecom-phone'),
        dataQuality: {
          seasonality: 'strong_weekly_seasonal',
          trend: 'increasing'
        }
      },
      {
        id: 'lob-ecom-chat',
        name: 'Chat',
        description: 'E-commerce chat support',
        hasData: true, // NOW HAS MOCK DATA
        dataUploaded: new Date('2024-01-12'),
        recordCount: 1950,
        mockData: generateWeeklyData(1950, 'ecom-chat'),
        dataQuality: {
          seasonality: 'strong_weekly_seasonal',
          trend: 'increasing'
        }
      }
    ]
  }
];


export const mockAgents: Agent[] = [
  {
    id: 'agent-01',
    name: 'Data Analysis Agent',
    task: 'Idle',
    status: 'idle',
    successRate: 99.2,
    avgCompletionTime: 2500,
    errorCount: 4,
    cpuUsage: 5,
    memoryUsage: 10,
  },
  {
    id: 'agent-02',
    name: 'Preprocessing Agent',
    task: 'Idle',
    status: 'idle',
    successRate: 98.5,
    avgCompletionTime: 4000,
    errorCount: 8,
    cpuUsage: 8,
    memoryUsage: 15,
  },
  {
    id: 'agent-03',
    name: 'Modeling Agent',
    task: 'Idle',
    status: 'idle',
    successRate: 97.1,
    avgCompletionTime: 15000,
    errorCount: 12,
    cpuUsage: 12,
    memoryUsage: 25,
  },
    {
    id: 'agent-04',
    name: 'Evaluation Agent',
    task: 'Idle',
    status: 'idle',
    successRate: 100,
    avgCompletionTime: 1800,
    errorCount: 0,
    cpuUsage: 4,
    memoryUsage: 8,
  },
    {
    id: 'agent-05',
    name: 'Forecasting Agent',
    task: 'Idle',
    status: 'idle',
    successRate: 99.8,
    avgCompletionTime: 3200,
    errorCount: 2,
    cpuUsage: 6,
    memoryUsage: 12,
  },
];


export const agentCommunications: AgentCommunication[] = [
  {
    timestamp: '2024-01-15T10:45:23Z',
    from: 'Data Analysis Agent',
    to: 'Preprocessing Agent',
    message: 'Pattern analysis complete. Detected strong weekly seasonality. Recommend seasonal decomposition.',
    type: 'task_handoff',
  },
  {
    timestamp: '2024-01-15T10:46:01Z',
    from: 'Preprocessing Agent',
    to: 'Modeling Agent',
    message: 'Data cleaned. 3 outliers removed, 2 new features created. Ready for model training.',
    type: 'data_ready',
  },
  {
    timestamp: '2024-01-15T10:47:15Z',
    from: 'System Orchestrator',
    to: 'All Agents',
    message: 'User requested workflow pause. Completing current tasks before stopping.',
    type: 'user_control',
  },
  {
    timestamp: '2024-01-15T10:49:05Z',
    from: 'Modeling Agent',
    to: 'System Orchestrator',
    message: 'XGBoost training failed. Reverting to LightGBM as per recovery protocol.',
    type: 'system_update',
  },
];

export const mockWorkflow: WorkflowStep[] = [
    {
        id: 'step-1',
        name: 'Data Ingestion',
        status: 'pending',
        dependencies: [],
        estimatedTime: '15s',
        details: 'Upload and validate CSV/Excel data for the selected Line of Business.',
        agent: 'Orchestrator Agent',
    },
    {
        id: 'step-2',
        name: 'Data Analysis',
        status: 'pending',
        dependencies: ['step-1'],
        estimatedTime: '45s',
        details: 'Perform exploratory data analysis to identify trends, seasonality, and anomalies.',
        agent: 'Data Analysis Agent',
    },
    {
        id: 'step-3',
        name: 'Data Preprocessing',
        status: 'pending',
        dependencies: ['step-2'],
        estimatedTime: '30s',
        details: 'Clean data, handle missing values, and create features for modeling.',
        agent: 'Preprocessing Agent',
    },
    {
        id: 'step-4',
        name: 'Model Training',
        status: 'pending',
        dependencies: ['step-3'],
        estimatedTime: '2m 30s',
        details: 'Train multiple forecasting models (e.g., ARIMA, XGBoost) in parallel.',
        agent: 'Modeling Agent',
    },
    {
        id: 'step-5',
        name: 'Model Evaluation',
        status: 'pending',
        dependencies: ['step-4'],
        estimatedTime: '25s',
        details: 'Evaluate models based on accuracy metrics (MAPE, RMSE) and select the best performer.',
        agent: 'Evaluation Agent',
    },
    {
        id: 'step-6',
        name: 'Generate Forecast',
        status: 'pending',
        dependencies: ['step-5'],
        estimatedTime: '20s',
        details: 'Generate future forecasts using the best-performing model.',
        agent: 'Forecasting Agent',
    },
    {
        id: 'step-7',
        name: 'Result Visualization',
        status: 'pending',
        dependencies: ['step-6'],
        estimatedTime: '10s',
        details: 'Create interactive charts and tables to display the forecast results.',
        agent: 'Orchestrator Agent',
    },
];
