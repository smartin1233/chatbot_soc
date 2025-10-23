export type WeeklyData = {
  Date: Date;
  Value: number;
  Orders: number;
};

export type DataQuality = {
  seasonality: string;
  trend: string;
};

export type LineOfBusiness = {
  id: string;
  name: string;
  description: string;
  hasData: boolean;
  dataUploaded: Date | null;
  recordCount: number;
  mockData?: WeeklyData[];
  dataQuality?: DataQuality;
  file?: File;
  suggestions?: string[];
};

export type BusinessUnit = {
  id: string;
  name: string;
  description: string;
  color: string;
  lobs: LineOfBusiness[];
};

export type AgentStatus = 'active' | 'idle' | 'error' | 'completed';

export type Agent = {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  successRate: number;
  avgCompletionTime: number; // in ms
  errorCount: number;
  cpuUsage: number;
  memoryUsage: number;
};

export type AgentCommunication = {
  timestamp: string;
  from: string;
  to: string;
  message: string;
  type: 'task_handoff' | 'data_ready' | 'user_control' | 'system_update';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  suggestions?: string[];
  visualization?: {
    data: WeeklyData[];
    target: 'Value' | 'Orders';
    isShowing?: boolean;
  };
  agentType?: string;
  canGenerateReport?: boolean;
  reportData?: any;
};

export type WorkflowStatus = 'completed' | 'active' | 'pending' | 'error';

export type WorkflowStep = {
  id: string;
  name: string;
  status: WorkflowStatus;
  dependencies: string[];
  estimatedTime: string; // e.g., "2m 15s"
  details: string;
  agent?: string;
};

export type AgentMonitorProps = {
  isOpen: boolean;
};
