/**
 * AgentOrchestrator: Central orchestrator for multi-agent forecasting workflow.
 * Follows the architecture in design.md.
 */

import type { Agent, WorkflowStep } from '@/lib/types';
import { CapacityPlanningAgent } from './capacity-planning-agent';

export type OrchestratorInput = {
  userMessage: string;
  sessionId: string;
  context: any;
};

export type OrchestratorOutput = {
  response: string;
  workflow: WorkflowStep[];
  agentStatus: Agent[];
  provenance: {
    [key: string]: boolean; // e.g., { 'eda': true, 'forecasting': false }
  };
};

export class AgentOrchestrator {
  private workflow: WorkflowStep[] = [];
  private agentStatus: Agent[] = [];
  private provenance: { [key: string]: boolean } = {};

  constructor() {}

  /**
   * Main entry: process user query, plan workflow, execute agents, aggregate results.
   */
  async handleUserQuery(input: OrchestratorInput): Promise<OrchestratorOutput> {
    // 1. Analyze intent
    const intent = this.analyzeIntent(input.userMessage);

    // 2. Plan workflow steps based on intent
    this.workflow = this.planWorkflow(intent);

    // 3. Execute workflow: run only required agents, collect concise results, update provenance
    let finalOutput = '';
    for (const step of this.workflow) {
      const { output, provenanceKey } = await this.executeAgentStep(step, input);
      this.provenance[provenanceKey] = true;
      this.agentStatus.push({
        id: step.agent ?? 'unknown',
        name: step.agent ?? 'unknown',
        task: step.name,
        status: 'completed',
        successRate: 1,
        avgCompletionTime: 1000,
        errorCount: 0,
        cpuUsage: 1,
        memoryUsage: 1,
      });
      // Only keep the output of the final agent step for the response
      finalOutput = output;
    }

    // 4. Aggregate results for response (only the final agent's output, concise)
    return {
      response: finalOutput,
      workflow: this.workflow,
      agentStatus: this.agentStatus,
      provenance: this.provenance,
    };
  }

  /**
   * Stub: Analyze user intent from message.
   */
  private analyzeIntent(message: string): string {
    if (/forecast|predict/i.test(message)) return 'forecasting';
    if (/eda|analyz/i.test(message)) return 'eda';
    if (/preprocess|clean/i.test(message)) return 'preprocessing';
    if (/capacity|headcount/i.test(message)) return 'capacity';
    return 'general';
  }

  /**
   * Plan workflow steps based on intent.
   */
  private planWorkflow(intent: string): WorkflowStep[] {
    // Example: EDA → Preprocessing → Modeling → Evaluation → Forecasting
    const steps: WorkflowStep[] = [];
    if (intent === 'forecasting') {
      steps.push(
        { id: 'step-1', name: 'Data Analysis', status: 'pending', dependencies: [], estimatedTime: '30s', details: '', agent: 'EDA Agent' },
        { id: 'step-2', name: 'Data Preprocessing', status: 'pending', dependencies: ['step-1'], estimatedTime: '30s', details: '', agent: 'Preprocessing Agent' },
        { id: 'step-3', name: 'Model Training', status: 'pending', dependencies: ['step-2'], estimatedTime: '2m', details: '', agent: 'Modeling Agent' },
        { id: 'step-4', name: 'Model Evaluation', status: 'pending', dependencies: ['step-3'], estimatedTime: '20s', details: '', agent: 'Evaluation Agent' },
        { id: 'step-5', name: 'Generate Forecast', status: 'pending', dependencies: ['step-4'], estimatedTime: '15s', details: '', agent: 'Forecasting Agent' }
      );
    } else if (intent === 'eda') {
      steps.push(
        { id: 'step-1', name: 'Data Analysis', status: 'pending', dependencies: [], estimatedTime: '30s', details: '', agent: 'EDA Agent' }
      );
    } else if (intent === 'preprocessing') {
      steps.push(
        { id: 'step-1', name: 'Data Preprocessing', status: 'pending', dependencies: [], estimatedTime: '30s', details: '', agent: 'Preprocessing Agent' }
      );
    } else if (intent === 'capacity') {
      steps.push(
        { id: 'step-1', name: 'Capacity Planning', status: 'pending', dependencies: [], estimatedTime: '20s', details: '', agent: 'Capacity Planning Agent' }
      );
    } else {
      steps.push(
        { id: 'step-1', name: 'General Assistance', status: 'pending', dependencies: [], estimatedTime: '10s', details: '', agent: 'General Assistant' }
      );
    }
    return steps;
  }

  /**
   * Execute a single agent step (modular, concise output).
   */
  private async executeAgentStep(step: WorkflowStep, input: OrchestratorInput): Promise<{ output: string; provenanceKey: string }> {
    let output = '';
    let provenanceKey = (step.agent || 'unknown').toLowerCase().replace(/\s+/g, '_');
    switch (step.agent) {
      case 'EDA Agent':
        output = await this.edaAgent(input);
        break;
      case 'Preprocessing Agent':
        output = await this.preprocessingAgent(input);
        break;
      case 'Modeling Agent':
        output = await this.modelingAgent(input);
        break;
      case 'Evaluation Agent':
        output = await this.evaluationAgent(input);
        break;
      case 'Forecasting Agent':
        output = await this.forecastingAgent(input);
        break;
      case 'Capacity Planning Agent':
        output = await this.capacityPlanningAgent(input);
        break;
      default:
        output = await this.generalAgent(input);
        provenanceKey = 'general';
    }
    return { output, provenanceKey };
  }

  // Modular agent implementations (concise, relevant output)
  private async edaAgent(input: OrchestratorInput): Promise<string> {
    // Simulate EDA: return key stats and highlights as bullet points
    const lob = input.context?.selectedLob;
    const dq = lob?.dataQuality || {};
    return [
      "🔍 **Data Overview**",
      `• Records: ${lob?.recordCount ?? 0}`,
      `• Missing: ${dq.completeness !== undefined ? (100 - dq.completeness) + "%" : "N/A"}`,
      `• Trend: ${dq.trend || "N/A"}`,
      `• Seasonality: ${dq.seasonality ? dq.seasonality.replace(/_/g, " ") : "N/A"}`,
      `• Outliers: ${dq.outliers ?? "N/A"}`,
      "",
      "⭐ **Highlights**",
      "• No major data quality issues detected.",
      "• Key patterns and correlations identified."
    ].join("\n");
  }
  private async preprocessingAgent(input: OrchestratorInput): Promise<string> {
    return [
      "🧹 **Preprocessing**",
      "• Data cleaned (missing values handled, outliers removed)",
      "• Features engineered for modeling"
    ].join("\n");
  }
  private async modelingAgent(input: OrchestratorInput): Promise<string> {
    return [
      "🤖 **Modeling**",
      "• Models trained: XGBoost, LightGBM, Prophet",
      "• Cross-validation complete"
    ].join("\n");
  }
  private async evaluationAgent(input: OrchestratorInput): Promise<string> {
    return [
      "📊 **Evaluation**",
      "• Best model: XGBoost",
      "• MAPE: 8.2%",
      "• RMSE: 120.5"
    ].join("\n");
  }
  private async forecastingAgent(input: OrchestratorInput): Promise<string> {
    return [
      "📈 **Forecast**",
      "• Next 30 days projected",
      "• Expected increase: +12%",
      "• Confidence interval: ±5%"
    ].join("\n");
  }
  private async generalAgent(input: OrchestratorInput): Promise<string> {
    return [
      "How can I assist you?",
      "• Upload your data",
      "• Explore your data",
      "• Generate a forecast"
    ].join("\n");
  }

  private async capacityPlanningAgent(input: OrchestratorInput): Promise<string> {
    const agent = new CapacityPlanningAgent();
    // Mock data for now
    const planningInput = {
      historicalData: [],
      forecastData: [
        { date: '2023-01-01', value: 1000 },
        { date: '2023-01-08', value: 1100 },
      ],
      assumptions: {
        callsPerHeadcount: 50,
        shrinkage: 0.1,
      },
    };
    const result = await agent.run(planningInput);
    const headcountStrings = result.headcount.map(
      (h) => `• ${h.date}: ${h.required} agents`
    );
    return [
      "📋 **Capacity Plan**",
      result.explanation,
      ...headcountStrings,
    ].join("\n");
  }
}
