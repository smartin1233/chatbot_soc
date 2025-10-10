# Intent-Based Analysis Fix

## Summary
Fixed the analysis workflow to properly handle different user intents:
1. "Explore data" - Basic exploration WITHOUT outlier mentions
2. "Detailed EDA" - Comprehensive analysis INCLUDING outliers
3. "Check for anomaly/outliers" - Detailed outlier detection with specific information
4. "Visualize data" - Show charts with outliers highlighted
5. "Model training" - Always show form first before proceeding

## Changes Made

### 1. Intent Analyzer Updates (`src/lib/intent-analyzer.ts`)

Added new intent types:
- `DETAILED_EDA` - For comprehensive analysis requests
- `VISUALIZE_DATA` - For visualization requests

Updated pattern matching:
- `dataDescription` - Now matches "explore data" and basic exploration
- `detailedEDA` - Matches "detailed EDA", "comprehensive analysis"
- `outlierDetection` - Matches "check for anomaly/outliers", "detect outliers"

Updated contextual hints:
- `DATA_DESCRIPTION`: exclude_outlier_analysis, focus_on_basic_statistics, simple_exploration_only
- `DETAILED_EDA`: comprehensive_analysis, include_outlier_analysis, detailed_patterns
- `OUTLIER_DETECTION`: activate_outlier_detection, detailed_outlier_info, prepare_visualization_with_outliers
- `MODEL_TRAINING`: show_training_form_first, collect_parameters

### 2. Agent Configuration Updates

#### EDA Agent
- Updated to check for contextual hints
- If `simple_exploration_only` hint: Skip outlier analysis
- If `comprehensive_analysis` hint: Include full outlier analysis
- Default behavior: Basic exploration without outliers

#### Outlier Detection Agent (New)
- Dedicated agent for anomaly/outlier detection
- Provides detailed information about detected outliers:
  - Count and percentage
  - Specific values and indices
  - Statistical thresholds used
  - Impact assessment
  - Recommendations for handling

#### Visualization Agent
- Updated to highlight outliers in trend charts when requested
- Uses different colors/markers for outlier points
- Adds annotations for significant outliers

### 3. Model Training Workflow

Updated to always show form first:
- Detect model training intent
- Show ModelTrainingForm component
- Collect parameters (model type, forecast horizon, etc.)
- Only proceed with training after form submission

### 4. Chat Panel Updates

Updated message routing:
- Check intent before selecting agents
- Route to appropriate agent based on intent
- Pass contextual hints to agents
- Handle form display for model training

## User Experience

### "Explore the data"
**Before:** Mentioned outliers, causing confusion
**After:** Shows basic statistics, trends, patterns - NO outlier mentions

### "Detailed EDA" or "Comprehensive analysis"
**Before:** Same as basic exploration
**After:** Shows full analysis including outliers, correlations, distributions

### "Check for anomaly" or "Detect outliers"
**Before:** Generic mention in EDA
**After:** Detailed outlier report with:
- Specific outlier values
- Indices/dates where they occur
- Statistical thresholds
- Recommendations

### "Visualize data"
**Before:** Basic chart without outlier highlighting
**After:** Chart with outliers highlighted in different color

### "Train model" or "Forecast"
**Before:** Immediately started training
**After:** Shows form first to collect:
- Model type selection
- Forecast horizon
- Confidence level
- Other parameters

## Technical Implementation

### Intent Detection Flow
```
User Message → Intent Analyzer → Intent Type + Hints → Agent Selection → Agent Execution
```

### Agent Selection Logic
```typescript
if (intent === 'DATA_DESCRIPTION') {
  agent = 'eda'
  hints = ['exclude_outlier_analysis', 'simple_exploration_only']
} else if (intent === 'DETAILED_EDA') {
  agent = 'eda'
  hints = ['comprehensive_analysis', 'include_outlier_analysis']
} else if (intent === 'OUTLIER_DETECTION') {
  agent = 'outlier_detection'
  hints = ['detailed_outlier_info', 'prepare_visualization']
} else if (intent === 'MODEL_TRAINING') {
  showForm = true
  hints = ['show_training_form_first']
}
```

### Visualization with Outliers
```typescript
// In chart component
if (hints.includes('highlight_outliers_if_detected')) {
  data.forEach((point, index) => {
    if (outlierIndices.includes(index)) {
      point.isOutlier = true
      point.color = '#ef4444' // red
    }
  })
}
```

## Testing Checklist

- [ ] "Explore data" - No outlier mentions
- [ ] "Explore my data" - No outlier mentions
- [ ] "Show me the data" - No outlier mentions
- [ ] "Detailed EDA" - Includes outliers
- [ ] "Comprehensive analysis" - Includes outliers
- [ ] "Check for anomaly" - Detailed outlier report
- [ ] "Detect outliers" - Detailed outlier report
- [ ] "Find anomalies" - Detailed outlier report
- [ ] "Visualize data" - Chart with outliers highlighted
- [ ] "Train model" - Shows form first
- [ ] "Forecast" - Shows form first
- [ ] "Predict" - Shows form first

## Files Modified

1. `src/lib/intent-analyzer.ts` - Intent detection and classification
2. `src/components/dashboard/enhanced-chat-panel.tsx` - Agent routing and execution
3. `src/components/dashboard/dynamic-chart-renderer.tsx` - Outlier visualization
4. `src/lib/outlier-detector.ts` - Outlier detection logic

## Next Steps

1. Test all intent variations
2. Refine agent prompts based on user feedback
3. Add more visualization options
4. Enhance model training form with advanced options
