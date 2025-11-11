// src/lib/langgraph/agents/contextualChat.ts
import { StateGraph, END } from "@langchain/langgraph";
import { AgentStateSchema, gpt4o, gpt4oMini, memory } from "../config";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

type AgentState = z.infer<typeof AgentStateSchema>;

export class ContextualChatAgent {
  private graph: StateGraph<AgentState>;

  constructor() {
    this.graph = new StateGraph({
      channels: {
        messages: {
          value: (x: any[], y: any[]) => [...x, ...y],
          default: () => [],
        },
        context: {
          value: (x: Record<string, any>, y: Record<string, any>) => ({ ...x, ...y }),
          default: () => ({}),
        },
        visualizations: {
          value: (x: any[], y: any[]) => [...x, ...y],
          default: () => [],
        },
        awaitingUserInput: {
          value: (x: boolean, y?: boolean) => y ?? x,
          default: () => false,
        },
        userInputPrompt: {
          value: (x: string, y?: string) => y ?? x,
          default: () => "",
        },
        modelParameters: {
          value: (x: Record<string, any>, y: Record<string, any>) => ({ ...x, ...y }),
          default: () => ({}),
        },
        dataFrequency: {
          value: (x: string, y?: string) => y ?? x,
          default: () => "",
        },
      },
    });

    this.setupNodes();
    this.setupEdges();
  }

  private setupNodes() {
    // Add nodes for different conversation contexts
    this.graph.addNode("analyzeIntent", this.analyzeIntent.bind(this));
    this.graph.addNode("handleInsights", this.handleInsights.bind(this));
    this.graph.addNode("handleAnomalies", this.handleAnomalies.bind(this));
    this.graph.addNode("handleForecasting", this.handleForecasting.bind(this));
    this.graph.addNode("handleVisualization", this.handleVisualization.bind(this));
    this.graph.addNode("handleGeneral", this.handleGeneral.bind(this));
    this.graph.addNode("awaitUserInput", this.awaitUserInput.bind(this));
  }

  private setupEdges() {
    this.graph.setEntryPoint("analyzeIntent");

    // Conditional routing based on intent
    this.graph.addConditionalEdges("analyzeIntent", this.routeByIntent.bind(this), {
      "insights": "handleInsights",
      "anomalies": "handleAnomalies",
      "forecasting": "handleForecasting",
      "visualization": "handleVisualization",
      "general": "handleGeneral",
      "await_input": "awaitUserInput",
    });

    // Edges back to intent analysis for follow-up questions
    this.graph.addEdge("handleInsights", "analyzeIntent");
    this.graph.addEdge("handleAnomalies", "analyzeIntent");
    this.graph.addEdge("handleForecasting", "analyzeIntent");
    this.graph.addEdge("handleVisualization", "analyzeIntent");
    this.graph.addEdge("handleGeneral", "analyzeIntent");

    // Edge from user input back to intent analysis
    this.graph.addEdge("awaitUserInput", "analyzeIntent");
  }

  private async analyzeIntent(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];

    // Use a smaller model for intent analysis
    const intentModel = gpt4oMini;

    const systemPrompt = `
You are an intent classifier for a data analysis assistant.
Analyze the user's message and determine their intent.

Possible intents:
- insights: User wants insights on historical data
- anomalies: User wants to detect anomalies in data
- forecasting: User wants to forecast future values
- visualization: User wants to create visualizations
- general: General conversation or explanation

Also check if the message is a follow-up to a previous conversation.

Respond with a JSON object:
{
"intent": "insights|anomalies|forecasting|visualization|general",
"isFollowUp": true/false,
"contextNeeded": ["list", "of", "context", "keys"]
}
`;

    const response = await intentModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    let intentData;
    try {
      intentData = JSON.parse(response.content as string);
    } catch (e) {
      // Fallback to general intent
      intentData = { intent: "general", isFollowUp: false, contextNeeded: [] };
    }

    // Store intent in context
    return {
      context: {
        ...state.context,
        lastIntent: intentData.intent,
        isFollowUp: intentData.isFollowUp,
        contextNeeded: intentData.contextNeeded,
      }
    };
  }

  private routeByIntent(state: AgentState): string {
    const intent = state.context?.lastIntent;

    // Check if we need user input
    if (state.awaitingUserInput) {
      return "await_input";
    }

    // Route based on intent
    switch (intent) {
      case "insights":
        return "insights";
      case "anomalies":
        return "anomalies";
      case "forecasting":
        return "forecasting";
      case "visualization":
        return "visualization";
      default:
        return "general";
    }
  }

  private async handleInsights(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    const isFollowUp = state.context?.isFollowUp || false;

    // Use the more powerful model for insights
    const insightsModel = gpt4o;

    let systemPrompt;

    if (isFollowUp) {
      // Follow-up question about previous insights
      systemPrompt = `
You are a data insights assistant. The user is asking a follow-up question about previous insights.

Previous context:
${JSON.stringify(state.context)}

Provide a detailed explanation of the insights, focusing on the user's specific question.
Be conversational and helpful.
`;
    } else {
      // New insights request
      systemPrompt = `
You are a data insights assistant. Analyze the user's request and provide insights on historical data.

When providing insights:
1. Identify key trends and patterns
2. Highlight significant changes or events
3. Provide context and potential explanations
4. Suggest areas for further investigation

Be thorough but concise in your analysis.
`;
    }

    const response = await insightsModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    return {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: response.content as string,
          timestamp: new Date(),
        }
      ],
      context: {
        ...state.context,
        lastInsights: response.content,
      }
    };
  }

  private async handleAnomalies(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    const isFollowUp = state.context?.isFollowUp || false;

    const anomaliesModel = gpt4o;

    let systemPrompt;

    if (isFollowUp) {
      // Follow-up question about anomalies
      systemPrompt = `
You are a data anomaly detection assistant. The user is asking a follow-up question about previously detected anomalies.

Previous context:
${JSON.stringify(state.context)}

Provide a detailed explanation of the anomalies, focusing on the user's specific question.
Explain what makes these points anomalous and how they differ from normal patterns.
`;
    } else {
      // New anomaly detection request
      systemPrompt = `
You are a data anomaly detection assistant. Analyze the user's request and detect anomalies in the data.

When detecting anomalies:
1. Identify data points that deviate significantly from the norm
2. Explain why these points are considered anomalies
3. Provide potential causes or explanations
4. Suggest how to investigate further

Be thorough in your analysis and explanation.
`;
    }

    const response = await anomaliesModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    return {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: response.content as string,
          timestamp: new Date(),
        }
      ],
      context: {
        ...state.context,
        lastAnomalies: response.content,
      }
    };
  }

  private async handleForecasting(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    const isFollowUp = state.context?.isFollowUp || false;

    // Check if we need model parameters or data frequency
    if (!isFollowUp && !state.context?.forecastingInitialized) {
      return {
        awaitingUserInput: true,
        userInputPrompt: "To proceed with forecasting, I need some information. What is the frequency of your data (daily, weekly, monthly)? Also, would you like to adjust any model parameters?",
        context: {
          ...state.context,
          forecastingInitialized: true,
          nextStep: "forecasting",
        }
      };
    }

    const forecastingModel = gpt4o;

    let systemPrompt;

    if (isFollowUp) {
      // Follow-up question about forecasting results
      systemPrompt = `
You are a forecasting assistant. The user is asking a follow-up question about previous forecasting results.

Previous context:
${JSON.stringify(state.context)}

Provide a detailed explanation of the forecasting results, focusing on the user's specific question.
Explain differences between actual and forecasted values, and what they might indicate.
`;
    } else {
      // New forecasting request
      systemPrompt = `
You are a forecasting assistant. Generate forecasts based on the user's request.

Data frequency: ${state.context?.dataFrequency || "Not specified"}
Model parameters: ${JSON.stringify(state.context?.modelParameters || {})}

When generating forecasts:
1. Use appropriate models for the data frequency
2. Consider seasonality and trends
3. Provide confidence intervals
4. Explain the methodology used
5. Highlight key insights from the forecast

Be thorough in your explanation and methodology.
`;
    }

    const response = await forecastingModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    return {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: response.content as string,
          timestamp: new Date(),
        }
      ],
      context: {
        ...state.context,
        lastForecast: response.content,
      }
    };
  }

  private async handleVisualization(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];

    const visualizationModel = gpt4o;

    const systemPrompt = `
You are a data visualization assistant. Create visualizations based on the user's request.

When creating visualizations:
1. Determine the most appropriate chart type for the data
2. Generate the necessary data for the visualization
3. Create a plotly.js configuration for the chart
4. Provide a brief explanation of what the visualization shows

Respond with a JSON object:
{
"explanation": "Brief explanation of the visualization",
"visualization": {
"type": "chart type",
"data": "data for the chart",
"config": "plotly.js configuration"
}
}
`;

    const response = await visualizationModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    let vizData;
    try {
      vizData = JSON.parse(response.content as string);
    } catch (e) {
      // Fallback if parsing fails
      vizData = {
        explanation: "I'm sorry, I couldn't create a visualization for your request.",
        visualization: null
      };
    }

    return {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: vizData.explanation,
          timestamp: new Date(),
        }
      ],
      visualizations: vizData.visualization ? [
        ...(state.visualizations || []),
        vizData.visualization
      ] : state.visualizations,
    };
  }

  private async handleGeneral(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];

    const generalModel = gpt4oMini;

    const systemPrompt = `
You are a helpful AI assistant. Respond to the user's question or request in a conversational manner.

If the question is related to data analysis, provide helpful explanations.
If it's a general question, respond appropriately.

Be friendly, helpful, and informative in your responses.
`;

    const response = await generalModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    return {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: response.content as string,
          timestamp: new Date(),
        }
      ]
    };
  }

  private async awaitUserInput(state: AgentState): Promise<Partial<AgentState>> {
    // This node waits for user input and processes it
    const lastMessage = state.messages[state.messages.length - 1];

    // Process the user input to extract model parameters or data frequency
    const inputProcessor = gpt4oMini;

    const systemPrompt = `
You are processing user input for a forecasting pipeline.

The user provided: "${lastMessage.content}"

Extract the following information if present:
1. Data frequency (daily, weekly, monthly)
2. Any model parameters mentioned

Respond with a JSON object:
{
"dataFrequency": "extracted frequency or null",
"modelParameters": {"key": "value"} or {}
}
`;

    const response = await inputProcessor.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(lastMessage.content)
    ]);

    let extractedInfo;
    try {
      extractedInfo = JSON.parse(response.content as string);
    } catch (e) {
      extractedInfo = { dataFrequency: null, modelParameters: {} };
    }

    // Update the context with the extracted information
    return {
      awaitingUserInput: false,
      context: {
        ...state.context,
        dataFrequency: extractedInfo.dataFrequency || state.context?.dataFrequency,
        modelParameters: {
          ...(state.context?.modelParameters || {}),
          ...extractedInfo.modelParameters
        },
      }
    };
  }

  public compile() {
    return this.graph.compile({
      checkpointer: memory,
    });
  }
}
