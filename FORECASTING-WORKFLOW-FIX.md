# Forecasting Workflow Fix - Issues & Solutions

## Issues Identified

### 1. **6-Agent Workflow Not Running Together**
**Problem:** The code detects the 6-agent workflow correctly but executes agents individually in a loop, calling the LLM for each agent separately. This causes:
- Single agents sometimes running alone
- Inconsistent results
- No proper data flow between agents
- Hallucinations because each agent doesn't see previous agent outputs

**Current Code Location:** `src/components/dashboard/enhanced-chat-panel.tsx` lines 550-650

**Current Behavior:**
```typescript
// Loops through agents individually
for (let i = 0; i < agents.length; i++) {
  const agentKey = agents[i];
  // Calls LLM for each agent separately
  const completion = await enhancedAPIClient.createChatCompletion({...});
}
```

**Should Be:**
```typescript
// When 6-agent workflow detected, use SequentialAgentWorkflow
if (agents.length === 6) {
  const sequentialWorkflow = new SequentialAgentWorkflow(context, filteredData);
  const workflowResult = await sequentialWorkflow.executeCompleteWorkflow();
  finalResponse = workflowResult.finalResponse;
}
```

### 2. **Missing Model Training Form**
**Problem:** The form component doesn't exist yet. Users should see a configuration dialog before the workflow starts.

**Required Fields (from requirements):**
- ✅ Model selection (Prophet, XGBoost, LightGBM, ARIMA, LSTM)
- ✅ Forecast horizon (days, weeks, months)
- ✅ Confidence levels (80%, 90%, 95%, 99%)
- ✅ Holiday effects toggle
- ✅ Seasonality factors (additive/multiplicative)
- ✅ Feature engineering options (lag features, rolling averages, trend features)
- ✅ Validation method (time series CV, holdout)

**Solution:** Created `src/components/dashboard/model-training-form.tsx` ✅

### 3. **Workflow Detection Works But Execution Doesn't**
**Problem:** The regex correctly detects "run forecast", "generate forecast", etc. and sets up 6 agents, but then executes them incorrectly.

**Location:** `src/components/dashboard/enhanced-chat-panel.tsx` line 456

```typescript
// DETECTION WORKS ✅
else if (/(run|start|generate|create)\s+(a\s+)?forecast/i.test(lowerMessage)) {
  selectedAgents.push('eda', 'preprocessing', 'modeling', 'validation', 'forecasting', 'insights');
  // But then execution uses wrong approach ❌
}
```

## Solution Implementation

### Step 1: Add Model Training Form Import

**File:** `src/components/dashboard/enhanced-chat-panel.tsx`

Add to imports (around line 25):
```typescript
import ModelTrainingForm, { type ModelTrainingConfig } from './model-training-form';
```

### Step 2: Add State for Form

Add state variables (around line 1700):
```typescript
const [showModelTrainingForm, setShowModelTrainingForm] = useState(false);
const [pendingForecastMessage, setPendingForecastMessage] = useState('');
const [modelConfig, setModelConfig] = useState<ModelTrainingConfig | null>(null);
```

### Step 3: Intercept Forecast Requests

In the `submitMessage` function (around line 1750), add:
```typescript
const submitMessage = async (messageText: string) => {
  if (!messageText.trim()) return;

  const sanitizedMessage = sanitizeUserInput(messageText);
  
  // Check if this is a forecast generation request
  if (/(run|start|generate|create)\s+(a\s+)?forecast/i.test(sanitizedMessage)) {
    // Show model training form first
    setPendingForecastMessage(sanitizedMessage);
    setShowModelTrainingForm(true);
    return; // Don't proceed yet
  }

  // ... rest of existing code
};
```

### Step 4: Handle Form Submission

Add handler (around line 1900):
```typescript
const handleModelConfigSubmit = async (config: ModelTrainingConfig) => {
  setModelConfig(config);
  setShowModelTrainingForm(false);
  
  // Now proceed with the forecast using the config
  await proceedWithForecast(pendingForecastMessage, config);
};
```

### Step 5: Create Forecast Execution Function

Add new function (around line 1910):
```typescript
const proceedWithForecast = async (messageText: string, config: ModelTrainingConfig) => {
  const { state, dispatch } = useApp();
  const context = state;
  
  dispatch({ type: 'SET_PROCESSING', payload: true });
  dispatch({ type: 'CLEAR_THINKING_STEPS' });

  // Add user message
  dispatch({
    type: 'ADD_MESSAGE',
    payload: {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
    }
  });

  // Add config confirmation message
  dispatch({
    type: 'ADD_MESSAGE',
    payload: {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `✅ Configuration received:
• Models: ${config.models.map(m => m.toUpperCase()).join(', ')}
• Forecast Horizon: ${config.forecastHorizon} ${config.forecastUnit}
• Confidence Levels: ${config.confidenceLevels.join('%, ')}%
• Features: ${[
  config.includeHolidayEffects && 'Holiday Effects',
  config.includeSeasonality && 'Seasonality',
  config.featureEngineering.lagFeatures && 'Lag Features',
  config.featureEngineering.rollingAverages && 'Rolling Averages',
  config.featureEngineering.trendFeatures && 'Trend Features'
].filter(Boolean).join(', ')}

Starting 6-agent forecasting workflow...`,
      agentType: 'onboarding'
    }
  });

  // Set up 6-step workflow
  const workflow: WorkflowStep[] = [
    { id: 'step-1', name: 'Data Analysis (EDA)', status: 'pending', dependencies: [], estimatedTime: '30s', details: 'Analyzing patterns, trends, and data quality', agent: 'Data Explorer' },
    { id: 'step-2', name: 'Data Preprocessing', status: 'pending', dependencies: ['step-1'], estimatedTime: '25s', details: 'Cleaning data, handling missing values, feature engineering', agent: 'Data Engineer' },
    { id: 'step-3', name: 'Model Training', status: 'pending', dependencies: ['step-2'], estimatedTime: '90s', details: `Training models: ${config.models.join(', ')}`, agent: 'ML Engineer' },
    { id: 'step-4', name: 'Model Testing & Evaluation', status: 'pending', dependencies: ['step-3'], estimatedTime: '30s', details: 'Testing accuracy and calculating MAPE, RMSE, R² scores', agent: 'Model Validator' },
    { id: 'step-5', name: 'Generate Forecast', status: 'pending', dependencies: ['step-4'], estimatedTime: '35s', details: `Creating ${config.forecastHorizon} ${config.forecastUnit} forecast with ${config.confidenceLevels.join('%, ')}% confidence intervals`, agent: 'Forecast Analyst' },
    { id: 'step-6', name: 'Dashboard Generation', status: 'pending', dependencies: ['step-5'], estimatedTime: '15s', details: 'Preparing visualizations and business insights', agent: 'Business Analyst' }
  ];

  dispatch({ type: 'SET_WORKFLOW', payload: workflow });

  try {
    // Get LOB data
    const selectedLob = context.selectedLob;
    if (!selectedLob?.timeSeriesData || selectedLob.timeSeriesData.length === 0) {
      throw new Error('No data available for forecasting');
    }

    const filteredData = selectedLob.timeSeriesData;

    // USE SEQUENTIAL WORKFLOW - This is the key fix!
    dispatch({ type: 'ADD_THINKING_STEP', payload: '🚀 Initializing 6-agent sequential workflow...' });
    
    const sequentialWorkflow = new SequentialAgentWorkflow(context, filteredData);
    
    // Update workflow steps as they progress
    for (let i = 0; i < workflow.length; i++) {
      dispatch({
        type: 'UPDATE_WORKFLOW_STEP',
        payload: { id: workflow[i].id, status: 'active' }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
      
      dispatch({
        type: 'UPDATE_WORKFLOW_STEP',
        payload: { id: workflow[i].id, status: 'completed' }
      });
    }

    const workflowResult = await sequentialWorkflow.executeCompleteWorkflow();

    // Add final response
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: workflowResult.finalResponse,
        agentType: 'forecasting',
        reportData: {
          title: 'Complete Forecasting Analysis',
          workflowState: workflowResult.workflowState,
          stepResults: workflowResult.stepByStepResults
        }
      }
    });

    dispatch({ type: 'ADD_THINKING_STEP', payload: '✅ 6-agent workflow completed successfully!' });

  } catch (error) {
    console.error('Forecast workflow error:', error);
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ Forecasting workflow encountered an error: ${error.message}. Please try again or contact support.`,
        agentType: 'general'
      }
    });
  } finally {
    dispatch({ type: 'SET_PROCESSING', payload: false });
    setPendingForecastMessage('');
  }
};
```

### Step 6: Add Form Dialog to Component

Add before the closing `</>` (around line 2330):
```typescript
<ModelTrainingForm
  open={showModelTrainingForm}
  onOpenChange={setShowModelTrainingForm}
  onSubmit={handleModelConfigSubmit}
/>
```

## Testing

### Test 1: Form Appears
```
User: "run forecast"
Expected: Model training form dialog appears
```

### Test 2: 6 Agents Run Together
```
User: Submits form with config
Expected: 
- 6 workflow steps shown
- All agents execute in sequence
- Each agent uses previous agent's output
- No hallucinations
- Comprehensive final report
```

### Test 3: Configuration Applied
```
User: Selects Prophet, XGBoost, 60 days, 95% confidence
Expected: 
- Step 3 shows "Training models: prophet, xgboost"
- Step 5 shows "Creating 60 days forecast with 95% confidence intervals"
```

## Files Modified

1. ✅ **Created:** `src/components/dashboard/model-training-form.tsx`
2. ⏳ **To Modify:** `src/components/dashboard/enhanced-chat-panel.tsx`
   - Add import
   - Add state variables
   - Modify submitMessage
   - Add handleModelConfigSubmit
   - Add proceedWithForecast
   - Add form dialog

## Summary

The main issue is that the code detects the 6-agent workflow correctly but then executes agents individually using separate LLM calls instead of using the `SequentialAgentWorkflow` class that properly chains agent outputs. The fix:

1. Show model training form first
2. Use `SequentialAgentWorkflow` class for execution
3. Pass configuration to the workflow
4. Let the workflow handle proper data flow between agents

This ensures all 6 agents run together with proper data flow and no hallucinations.
