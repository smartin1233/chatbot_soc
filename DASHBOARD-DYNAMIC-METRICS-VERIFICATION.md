# Dashboard Dynamic Metrics Verification

## Current Implementation

The BI Dashboard in the Enhanced Insights Panel is **already configured to be dynamic** and should automatically update when forecast metrics are available.

### How It Works

#### 1. State Management
Forecast metrics are stored in the application state:
```typescript
state.selectedLob.forecastMetrics = {
  modelName: "LightGBM",
  mape: 6.9,
  accuracy: 93.1,
  r2: 0.892,
  rmse: 120,
  forecastHorizon: "30 days",
  confidenceLevel: 95,
  trainedDate: new Date()
}
```

#### 2. Dashboard Reads from State
The bi-dashboard component uses `useMemo` to reactively read from state:

```typescript
// src/components/dashboard/bi-dashboard.tsx
const modelMetrics = useMemo(() => {
  if (state.selectedLob?.forecastMetrics) {
    const fm = state.selectedLob.forecastMetrics;
    return {
      mape: fm.mape.toFixed(1),        // "6.9"
      rmse: fm.rmse.toFixed(0),        // "120"
      r2: fm.r2.toFixed(3),            // "0.892"
      model: fm.modelName,             // "LightGBM"
      confidence: fm.confidenceLevel.toFixed(0)  // "95"
    };
  }
  return null;
}, [state.selectedLob?.forecastMetrics]);
```

#### 3. Display in UI
The metrics are displayed dynamically:

```typescript
{modelMetrics && (
  <div className="space-y-4">
    {/* MAPE */}
    <div className="text-2xl font-bold text-green-600">
      {modelMetrics.mape}%
    </div>
    
    {/* Model Algorithm */}
    <Badge variant="secondary">
      {modelMetrics.model}
    </Badge>
    
    {/* R² */}
    <div className="text-2xl font-bold text-blue-600">
      {modelMetrics.r2}
    </div>
    
    {/* RMSE */}
    <div className="text-2xl font-bold">
      {modelMetrics.rmse}
    </div>
  </div>
)}
```

## Data Flow

```
User runs forecast workflow
  ↓
SequentialAgentWorkflow executes
  ├─ Modeling Agent: Trains models
  ├─ Selects best: "LightGBM" with 6.9% MAPE
  └─ Returns workflowResult
  ↓
enhanced-chat-panel.tsx extracts metrics:
  - modelName: "LightGBM"
  - mape: 6.9
  - r2: 0.892
  ↓
Dispatch UPDATE_LOB_FORECAST:
  state.selectedLob.forecastMetrics = {
    modelName: "LightGBM",
    mape: 6.9,
    ...
  }
  ↓
React detects state change
  ↓
bi-dashboard.tsx re-renders
  ↓
useMemo recalculates modelMetrics
  ↓
UI updates automatically:
  - Model Algorithm: "LightGBM" ✅
  - MAPE: "6.9%" ✅
  - R²: "0.892" ✅
```

## Verification Steps

### 1. Check State Update
After forecast completes, verify in React DevTools:
```javascript
state.selectedLob.forecastMetrics = {
  modelName: "LightGBM",  // Should match chat
  mape: 6.9,              // Should match chat
  r2: 0.892,
  // ...
}
```

### 2. Check Dashboard Rendering
The dashboard should show:
- **Model Algorithm:** Badge with actual model name (e.g., "LightGBM")
- **MAPE:** Actual percentage (e.g., "6.9%")
- **R²:** Actual R² score (e.g., "0.892")

### 3. Check Reactivity
When you run a new forecast:
1. Old metrics should be replaced
2. Dashboard should update automatically
3. No page refresh needed

## Potential Issues & Solutions

### Issue 1: Dashboard Not Updating
**Symptom:** Dashboard shows old or no metrics after forecast

**Possible Causes:**
1. State not being updated
2. Component not re-rendering
3. Metrics not being extracted from workflow

**Solution:**
Check the dispatch in enhanced-chat-panel.tsx (line 2360):
```typescript
dispatch({
  type: 'UPDATE_LOB_FORECAST',
  payload: {
    lobId: state.selectedLob.id,
    forecastData: state.selectedLob.timeSeriesData,
    forecastMetrics: forecastMetrics  // ← Should contain actual metrics
  }
});
```

### Issue 2: Wrong Model Name Displayed
**Symptom:** Dashboard shows "XGBoost Ensemble" but chat shows "LightGBM"

**Possible Causes:**
1. Metrics not being extracted from workflow
2. Old cached metrics
3. Hardcoded fallback being used

**Solution:**
Verify the extraction (line 2348-2352):
```typescript
const modelResults = workflowResult.workflowState.modelResults;
const forecastMetrics = {
  modelName: modelResults.bestModel || 'Ensemble Model',  // ← Should be actual model
  mape: parseFloat(modelResults.performance.mape),        // ← Should be actual MAPE
  // ...
};
```

### Issue 3: MAPE Format Issues
**Symptom:** MAPE shows as "NaN%" or incorrect value

**Possible Causes:**
1. MAPE is a string with "%" already
2. parseFloat failing
3. Wrong property path

**Solution:**
The workflow returns MAPE as a string number (e.g., "6.9"), so parseFloat should work:
```typescript
// Workflow returns: { mape: "6.9", r2: "0.892" }
mape: parseFloat(modelResults.performance.mape),  // → 6.9
```

## Testing Checklist

- [ ] Run forecast with LightGBM selected
  - [ ] Chat shows: "LightGBM 6.9% MAPE"
  - [ ] Dashboard shows: Model Algorithm "LightGBM", MAPE "6.9%"

- [ ] Run forecast with Prophet selected
  - [ ] Chat shows: "Prophet 8.2% MAPE"
  - [ ] Dashboard shows: Model Algorithm "Prophet", MAPE "8.2%"

- [ ] Run forecast with XGBoost selected
  - [ ] Chat shows: "XGBoost 5.5% MAPE"
  - [ ] Dashboard shows: Model Algorithm "XGBoost", MAPE "5.5%"

- [ ] Run multiple forecasts in sequence
  - [ ] Dashboard updates each time
  - [ ] No stale data shown
  - [ ] Metrics match chat every time

## Files Involved

1. **src/lib/sequential-workflow.ts**
   - Generates model metrics
   - Returns in workflowResult.workflowState.modelResults

2. **src/components/dashboard/enhanced-chat-panel.tsx**
   - Extracts metrics from workflow
   - Dispatches UPDATE_LOB_FORECAST
   - Updates state.selectedLob.forecastMetrics

3. **src/components/dashboard/bi-dashboard.tsx**
   - Reads from state.selectedLob.forecastMetrics
   - Displays metrics dynamically
   - Re-renders when state changes

4. **src/components/dashboard/app-provider.tsx**
   - Handles UPDATE_LOB_FORECAST action
   - Updates state.selectedLob.forecastMetrics

## Summary

The dashboard is **already configured to be dynamic**. The metrics should automatically update when:
1. Forecast workflow completes
2. Metrics are extracted from workflow results
3. State is updated via UPDATE_LOB_FORECAST dispatch
4. Dashboard re-renders with new metrics

If the dashboard is not updating, the issue is likely in the state update chain, not in the dashboard component itself.

## Debugging

To debug, add console logs:

```typescript
// In enhanced-chat-panel.tsx after workflow completes
console.log('Workflow Results:', {
  bestModel: modelResults.bestModel,
  mape: modelResults.performance.mape,
  r2: modelResults.performance.r2
});

console.log('Forecast Metrics to Dispatch:', forecastMetrics);

// In bi-dashboard.tsx
console.log('Current Forecast Metrics:', state.selectedLob?.forecastMetrics);
console.log('Model Metrics Calculated:', modelMetrics);
```

This will help identify where the data flow breaks.
