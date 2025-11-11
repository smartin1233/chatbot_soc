// src/lib/langgraph/pipelines/forecasting.ts
import { StateGraph, END } from "@langchain/langgraph";
import { AgentStateSchema, gpt4o, memory } from "../config";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

type AgentState = z.infer<typeof AgentStateSchema>;

export class ForecastingPipeline {
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
    this.graph.addNode("initialize", this.initialize.bind(this));
    this.graph.addNode("validateData", this.validateData.bind(this));
    this.graph.addNode("selectModel", this.selectModel.bind(this));
    this.graph.addNode("trainModel", this.trainModel.bind(this));
    this.graph.addNode("generateForecast", this.generateForecast.bind(this));
    this.graph.addNode("analyzeResults", this.analyzeResults.bind(this));
    this.graph.addNode("createVisualization", this.createVisualization.bind(this));
    this.graph.addNode("awaitUserInput", this.awaitUserInput.bind(this));
  }

  private setupEdges() {
    this.graph.setEntryPoint("initialize");

    this.graph.addEdge("initialize", "validateData");
    this.graph.addEdge("validateData", "selectModel");
    this.graph.addEdge("selectModel", "trainModel");
    this.graph.addEdge("trainModel", "generateForecast");
    this.graph.addEdge("generateForecast", "analyzeResults");
    this.graph.addEdge("analyzeResults", "createVisualization");
    this.graph.addEdge("createVisualization", END);

    // Edge for user input
    this.graph.addEdge("awaitUserInput", "selectModel");
  }

  private async initialize(state: AgentState): Promise<Partial<AgentState>> {
    const lastMessage = state.messages[state.messages.length - 1];

    // Check if we have the necessary information
    if (!state.context?.dataFrequency || !state.context?.modelParameters) {
      return {
        awaitingUserInput: true,
        userInputPrompt: "To proceed with forecasting, I need some information. What is the frequency of your data (daily, weekly, monthly)? Also, would you like to adjust any model parameters?",
        context: {
          ...state.context,
          forecastingInitialized: true,
        }
      };
    }

    return {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: "I'm initializing the forecasting pipeline with your specified parameters.",
          timestamp: new Date(),
        }
      ]
    };
  }

  private async validateData(state: AgentState): Promise<Partial<AgentState>> {
    const validationModel = gpt4o;

    const systemPrompt = `
You are a data validation specialist for forecasting. Validate the data based on the specified frequency.

Data frequency: ${state.context?.dataFrequency}

When validating data:
1. Check for missing values
2. Verify data consistency with the specified frequency
3. Identify any outliers or anomalies
4. Assess data quality for forecasting

Provide a summary of the validation results and any recommendations.
`;

    const response = await validationModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage("Please validate the data for forecasting.")
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
        validationResults: response.content,
      }
    };
  }

  private async selectModel(state: AgentState): Promise<Partial<AgentState>> {
    const modelSelectionModel = gpt4o;

    const systemPrompt = `
You are a forecasting model selection expert. Select the most appropriate model based on the data characteristics and user requirements.

Data frequency: ${state.context?.dataFrequency}
Model parameters: ${JSON.stringify(state.context?.modelParameters)}

Available models:
1. ARIMA - Good for stationary time series with clear autocorrelation
2. Prophet - Good for data with strong seasonal effects and multiple seasonality
3. LSTM - Best for complex nonlinear patterns and long-term dependencies
4. Linear Regression - Appropriate for simple linear trends

Select the most appropriate model and explain your choice.
`;

    const response = await modelSelectionModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage("Please select the most appropriate forecasting model.")
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
        selectedModel: response.content,
      }
    };
  }

  private async trainModel(state: AgentState): Promise<Partial<AgentState>> {
    const modelTrainingModel = gpt4o;

    const systemPrompt = `
You are a model training specialist. Train the selected forecasting model with the specified parameters.

Selected model: ${state.context?.selectedModel}
Model parameters: ${JSON.stringify(state.context?.modelParameters)}
Data frequency: ${state.context?.dataFrequency}

When training the model:
1. Apply appropriate preprocessing steps
2. Train the model with the specified parameters
3. Validate the model performance
4. Provide training metrics and diagnostics

Explain the training process and results.
`;

    const response = await modelTrainingModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage("Please train the forecasting model.")
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
        trainingResults: response.content,
      }
    };
  }

  private async generateForecast(state: AgentState): Promise<Partial<AgentState>> {
    const forecastModel = gpt4o;

    const systemPrompt = `
You are a forecasting specialist. Generate forecasts using the trained model.

Data frequency: ${state.context?.dataFrequency}
Training results: ${state.context?.trainingResults}

When generating forecasts:
1. Generate forecasts for the appropriate time horizon
2. Provide confidence intervals
3. Consider seasonality and trends
4. Explain the forecast methodology

Provide detailed forecasts and explanations.
`;

    const response = await forecastModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage("Please generate forecasts using the trained model.")
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
        forecastResults: response.content,
      }
    };
  }

  private async analyzeResults(state: AgentState): Promise<Partial<AgentState>> {
    const analysisModel = gpt4o;

    const systemPrompt = `
You are a forecasting results analyst. Analyze the forecasting results and provide insights.

Forecast results: ${state.context?.forecastResults}

When analyzing results:
1. Compare forecasts with historical data
2. Identify key trends and patterns
3. Highlight significant changes or events
4. Explain differences between actual and forecasted values
5. Provide business insights and recommendations

Provide a comprehensive analysis of the forecasting results.
`;

    const response = await analysisModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage("Please analyze the forecasting results.")
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
        analysisResults: response.content,
      }
    };
  }

  private async createVisualization(state: AgentState): Promise<Partial<AgentState>> {
    const visualizationModel = gpt4o;

    const systemPrompt = `
You are a data visualization specialist. Create visualizations for the forecasting results.

Forecast results: ${state.context?.forecastResults}
Analysis results: ${state.context?.analysisResults}
Data frequency: ${state.context?.dataFrequency}

Create visualizations that:
1. Show historical data and forecasts
2. Highlight confidence intervals
3. Display key trends and patterns
4. Compare actual vs. forecasted values

Generate plotly.js configurations for the visualizations.

Respond with a JSON object:
{
"explanation": "Brief explanation of the visualizations",
"visualizations": [
{
"type": "chart type",
"data": "data for the chart",
"config": "plotly.js configuration"
}
]
}
`;

    const response = await visualizationModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage("Please create visualizations for the forecasting results.")
    ]);

    let vizData;
    try {
      vizData = JSON.parse(response.content as string);
    } catch (e) {
      vizData = {
        explanation: "I'm sorry, I couldn't create visualizations for the forecasting results.",
        visualizations: []
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
      visualizations: vizData.visualizations,
    };
  }

  private async awaitUserInput(state: AgentState): Promise<Partial<AgentState>> {
    // This node waits for user input and processes it
    const lastMessage = state.messages[state.messages.length - 1];

    // Process the user input to extract model parameters or data frequency
    const inputProcessor = gpt4o;

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
