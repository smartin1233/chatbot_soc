// src/types/database.ts
export interface Conversation {
  id: string;
  sessionId: string;
  userId?: string;
  agentId?: string;
  messageType: 'user' | 'agent';
  content: string;
  reasoning?: string;
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface UserData {
  id: string;
  userId: string;
  dataType: string;
  data: any;
  createdAt: Date;
}

export type ConversationCreate = Omit<Conversation, 'id' | 'timestamp'>;
export type AgentCreate = Omit<Agent, 'id' | 'createdAt'>;
export type WorkflowCreate = Omit<Workflow, 'id' | 'createdAt'>;
export type UserDataCreate = Omit<UserData, 'id' | 'createdAt'>;
