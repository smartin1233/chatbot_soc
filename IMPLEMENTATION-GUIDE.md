# Implementation Guide: Intent-Based Analysis

## Overview
This guide provides the implementation steps to fix the analysis workflow based on user intents.

## Key Changes Required

### 1. Update Agent Selection Logic

The agent selection should check the user message and route to the appropriate agent:

```typescript
// In the message processing function
const selectAgentForMessage = (userMessage: string): { agent: string; hints: string[] } => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for model training intent - show form first
  if (/(train|build|create|configure).*model/i.test(lowerMessage) ||
      /(run|start|generate|create).*forecast/i.test(lowerMessage)) {
    return { agent: 'model_training', hints: ['show_training_form_first'] };
  }
  
  // Check for outlier detection intent
  if (/(check|detect|find|identify|show|analyze).*(anomal|outlier)/i.test(lowerMessage)) {
    return { agent: 'outlier_detection', hints: ['detailed_outlier_info', 'prepare_visualization'] };
  }
  
  // Check for detailed EDA intent
  if (/(detailed|comprehensive|full|complete).*(eda|analysis|exploration)/i.test(lowerMessage)) {
    return { agent: 'eda', hints: ['comprehensive_analysis', 'include_outlier_analysis'] };
  }
  
  // Check for basic exploration intent (default)
  if (/(explore|show|display).*(data|dataset)/i.test(lowerMessage)) {
    return { agent: 'eda', hints: ['exclude_outlier_analysis', 'simple_exploration_only'] };
  }
  
  // Check for visualization intent
  if (/(visuali[sz]e|plot|chart|graph|show).*(data|trend)/i.test(lowerMessage)) {
    return { agent: 'visualization', hints: ['highlight_outliers_if_detected'] };
  }
  
  // Default to general agent
  return { agent: 'general', hints: [] };
};
```

### 2. Update submitMessage Function

Add intent detection before processing:

```typescript
const submitMessage = async (messageText: string) => {
  if (!messageText.trim()) return;

  // Detect intent and select agent
  const { agent, hints } = selectAgentForMessage(messageText);
  
  // If model training, show form first
  if (agent === 'model_training') {
    setPendingForecastMessage(messageText);
    setShowModelTrainingForm(true);
    
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
      }
    });
    
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `📋 **Model Training Configuration**\n\nBefore we proceed with forecasting, let's configure the model parameters. Please fill out the form below to customize your forecast.`,
        agentType: 'onboarding'
      }
    });
    
    return;
  }
  
  // Continue with regular processing, passing hints to agent
  dispatch({ type: 'SET_PROCESSING', payload: true });
  dispatch({ type: 'CLEAR_THINKING_STEPS' });
  
  dispatch({
    type: 'ADD_MESSAGE',
    payload: {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
    }
  });
  
  // Process with selected agent and hints
  await processWithAgent(messageText, agent, hints);
};
```

### 3. Update Agent System Prompts

The agent system prompts should check for hints in the context:

```typescript
// In buildEnhancedContext function
const buildEnhancedContext = (context: any, agentKey: string, hints: string[]) => {
  const enhancedContext = {
    ...context,
    hints: hints, // Pass hints to agent
    // ... other context
  };
  
  return enhancedContext;
};

// In agent execution
const executeAgent = async (agentKey: string, userMessage: string, context: any, hints: string[]) => {
  const agent = ENHANCED_AGENTS[agentKey];
  
  // Build context with hints
  const enhancedContext = buildEnhancedContext(context, agentKey, hints);
  
  // Add hints to system prompt
  let systemPrompt = agent.systemPrompt;
  if (hints.includes('exclude_outlier_analysis')) {
    systemPrompt += "\n\nIMPORTANT: DO NOT mention outliers in your analysis. Focus only on basic statistics, trends, and patterns.";
  } else if (hints.includes('include_outlier_analysis')) {
    systemPrompt += "\n\nIMPORTANT: Include comprehensive outlier analysis with specific counts, values, and recommendations.";
  }
  
  // Call API with enhanced prompt
  const completion = await enhancedAPIClient.createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    // ... other options
  });
  
  return completion;
};
```

### 4. Update Visualization Component

Add outlier highlighting to charts:

```typescript
// In dynamic-chart-renderer.tsx or data-visualizer.tsx
const renderChartWithOutliers = (data: any[], outlierIndices: number[]) => {
  const chartData = data.map((point, index) => ({
    ...point,
    isOutlier: outlierIndices.includes(index),
    fill: outlierIndices.includes(index) ? '#ef4444' : '#3b82f6'
  }));
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        
        {/* Regular data points */}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (payload.isOutlier) {
              return (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={6} 
                  fill="#ef4444" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                />
              );
            }
            return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />;
          }}
        />
        
        {/* Outlier markers */}
        {outlierIndices.map(index => (
          <ReferenceLine
            key={`outlier-${index}`}
            x={data[index].date}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Outlier', position: 'top', fill: '#ef4444' }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};
```

### 5. Update Outlier Detection Logic

Enhance the outlier detector to provide detailed information:

```typescript
// In src/lib/outlier-detector.ts
export const detectOutliersDetailed = (data: DataPoint[]) => {
  const values = data.map(d => d.value).filter(v => v !== null) as number[];
  
  // Calculate IQR
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  // Find outliers with details
  const outliers = data
    .map((point, index) => ({
      index,
      date: point.date,
      value: point.value,
      isOutlier: point.value !== null && (point.value < lowerBound || point.value > upperBound),
      deviation: point.value !== null ? 
        (point.value < lowerBound ? 
          ((lowerBound - point.value) / lowerBound * 100).toFixed(1) :
          ((point.value - upperBound) / upperBound * 100).toFixed(1)) : 
        '0'
    }))
    .filter(o => o.isOutlier);
  
  return {
    count: outliers.length,
    percentage: ((outliers.length / data.length) * 100).toFixed(1),
    method: 'IQR (Interquartile Range)',
    thresholds: {
      lower: lowerBound.toFixed(2),
      upper: upperBound.toFixed(2)
    },
    outliers: outliers.map(o => ({
      index: o.index,
      date: o.date.toISOString().split('T')[0],
      value: o.value,
      deviation: o.deviation + '%'
    })),
    recommendations: [
      `Option 1: Cap outliers at ${upperBound.toFixed(0)} (preserves data)`,
      `Option 2: Remove ${outliers.length} outliers (reduces noise)`,
      `Option 3: Keep outliers (use robust models like XGBoost)`
    ]
  };
};
```

## Testing

Test each intent with these phrases:

1. **Basic Exploration (no outliers)**:
   - "Explore the data"
   - "Show me the data"
   - "What does the data look like"

2. **Detailed EDA (with outliers)**:
   - "Perform detailed EDA"
   - "Comprehensive analysis"
   - "Full data exploration"

3. **Outlier Detection**:
   - "Check for anomalies"
   - "Detect outliers"
   - "Find unusual values"

4. **Visualization**:
   - "Visualize the data"
   - "Show me a chart"
   - "Plot the trend"

5. **Model Training**:
   - "Train a model"
   - "Generate forecast"
   - "Predict future values"

## Expected Behavior

| User Input | Agent | Outliers Mentioned | Form Shown | Chart Type |
|------------|-------|-------------------|------------|------------|
| "Explore data" | EDA | ❌ No | ❌ No | Basic trend |
| "Detailed EDA" | EDA | ✅ Yes | ❌ No | Basic trend |
| "Check for anomalies" | Outlier Detection | ✅ Yes (detailed) | ❌ No | Trend with highlights |
| "Visualize data" | Visualization | ❌ No | ❌ No | Trend with outliers highlighted |
| "Train model" | Model Training | ❌ No | ✅ Yes | N/A (form first) |
| "Generate forecast" | Model Training | ❌ No | ✅ Yes | N/A (form first) |

## Summary

The key insight is to:
1. Detect user intent from the message
2. Select the appropriate agent and hints
3. Pass hints to the agent via context
4. Agent checks hints and adjusts response accordingly
5. For model training, show form before proceeding
6. For outlier detection, provide detailed information
7. For visualization, highlight outliers if detected
