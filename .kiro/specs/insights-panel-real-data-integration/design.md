# Design Document

## Overview

This design addresses the integration of real-time analysis data into the Enhanced Insights Panel, elimination of duplicate request handling, resolution of visualization conflicts, and enhancement of charts with analysis-specific features. The solution involves modifying the state management system to track analysis results, updating the Enhanced Insights Panel to consume real data, fixing the request flow from the main page, and enhancing the chart component to display outliers and forecasts dynamically.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Page / Chat Page                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User Input → Request Handler → Single API Call        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AppState (Context)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • analyzedData: { hasEDA, hasForecasting, ... }       │ │
│  │  • selectedLob: { forecastMetrics, outliers, ... }     │ │
│  │  • messages: [ ...chat history with analysis data ]    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Enhanced Insights Panel │   │  Enhanced Data Visualizer│
│  • Reads analyzedData    │   │  • Reads outliers        │
│  • Displays real metrics │   │  • Displays forecasts    │
│  • Shows actual insights │   │  • Highlights outliers   │
└──────────────────────────┘   └──────────────────────────┘
```

### Data Flow

1. **Analysis Execution Flow**:
   - User requests analysis in chat
   - Chat handler processes request and calls backend/AI
   - Backend returns analysis results (EDA, forecasting, etc.)
   - Results are stored in AppState under `analyzedData` and `selectedLob`
   - Enhanced Insights Panel and charts automatically update

2. **Request Deduplication Flow**:
   - Main page queues prompt in AppState
   - Chat page checks for queued prompt on mount
   - If queued prompt exists, process it once and clear queue
   - Prevent duplicate submissions with processing flag

3. **Visualization Independence Flow**:
   - User clicks "Visualize Data" → Opens chart panel only
   - User clicks "Show Insights" → Opens insights panel only
   - Both panels can be open simultaneously without conflicts
   - Each panel has independent open/close state

## Components and Interfaces

### 1. AppState Extensions

**Purpose**: Track analysis results and prevent duplicate requests

**Interface**:
```typescript
type AppState = {
  // ... existing fields
  analyzedData: {
    hasEDA: boolean;
    hasForecasting: boolean;
    hasInsights: boolean;
    hasPreprocessing: boolean;
    lastAnalysisDate: Date | null;
    lastAnalysisType: 'eda' | 'forecasting' | 'comparative' | 'whatif' | null;
    outliers: OutlierData[];
    forecastData: ForecastData[];
  };
  queuedUserPrompt: string | null;
  isProcessing: boolean;
};

type OutlierData = {
  index: number;
  value: number;
  date: Date;
  reason: string;
};

type ForecastData = {
  date: Date;
  forecast: number;
  lower: number;
  upper: number;
  confidence: number;
};
```

**Actions**:
```typescript
| { type: 'SET_ANALYZED_DATA'; payload: Partial<AppState['analyzedData']> }
| { type: 'QUEUE_USER_PROMPT'; payload: string }
| { type: 'CLEAR_QUEUED_PROMPT' }
| { type: 'SET_PROCESSING'; payload: boolean }
```

### 2. Enhanced Insights Panel Component

**Purpose**: Display real-time analysis results from chat

**Props**:
```typescript
interface EnhancedDataPanelProps {
  className?: string;
}
```

**Key Features**:
- Reads `state.analyzedData` to determine what to display
- Shows actual metrics from `state.selectedLob.forecastMetrics`
- Displays real insights from `state.analyzedData.outliers`
- Only shows forecast data if `state.analyzedData.hasForecasting === true`
- Shows empty state with guidance if no analysis has been performed

**Data Sources**:
- `state.selectedLob.mockData` → Actual data points
- `state.selectedLob.forecastMetrics` → Model performance metrics
- `state.analyzedData.outliers` → Detected outliers
- `state.analyzedData.forecastData` → Forecast predictions

### 3. Enhanced Data Visualizer Component

**Purpose**: Display charts with analysis-specific features

**Props**:
```typescript
interface EnhancedDataVisualizerProps {
  data: WeeklyData[];
  target: 'Value' | 'Orders';
  isRealData: boolean;
  statisticalAnalysis?: any;
  outliers?: OutlierData[];
  forecastData?: ForecastData[];
}
```

**Key Features**:
- Highlights outlier points with distinct visual markers (red circles, larger size)
- Adds forecast data as a separate line with confidence intervals
- Shows tooltips explaining why points are outliers
- Dynamically updates based on analysis type
- Supports multiple chart types (trend, distribution, correlation, forecast)

### 4. Chat Panel Request Handler

**Purpose**: Prevent duplicate request submissions

**Implementation**:
```typescript
// In chat-panel.tsx
useEffect(() => {
  if (state.queuedUserPrompt && !state.isProcessing) {
    submitMessage(state.queuedUserPrompt);
    dispatch({ type: 'CLEAR_QUEUED_PROMPT' });
  }
}, [state.queuedUserPrompt, state.isProcessing]);

const submitMessage = async (messageText: string) => {
  if (state.isProcessing) return; // Prevent duplicate
  
  dispatch({ type: 'SET_PROCESSING', payload: true });
  // ... process message
  dispatch({ type: 'SET_PROCESSING', payload: false });
};
```

### 5. Main Page Prompt Handler

**Purpose**: Queue prompts for chat page without duplicate submission

**Implementation**:
```typescript
// In main page component
const handlePromptClick = (prompt: string) => {
  dispatch({ type: 'QUEUE_USER_PROMPT', payload: prompt });
  router.push('/chat'); // Navigate to chat page
};
```

## Data Models

### AnalyzedData Model

```typescript
type AnalyzedData = {
  hasEDA: boolean;
  hasForecasting: boolean;
  hasInsights: boolean;
  hasPreprocessing: boolean;
  lastAnalysisDate: Date | null;
  lastAnalysisType: 'eda' | 'forecasting' | 'comparative' | 'whatif' | null;
  outliers: OutlierData[];
  forecastData: ForecastData[];
};
```

### OutlierData Model

```typescript
type OutlierData = {
  index: number;
  value: number;
  date: Date;
  reason: string; // e.g., "Value is 3.2 standard deviations above mean"
  severity: 'high' | 'medium' | 'low';
};
```

### ForecastData Model

```typescript
type ForecastData = {
  date: Date;
  forecast: number;
  lower: number; // Lower confidence bound
  upper: number; // Upper confidence bound
  confidence: number; // Confidence level (e.g., 0.95 for 95%)
};
```

### ForecastMetrics Model (Extended)

```typescript
type ForecastMetrics = {
  modelName: string;
  accuracy: number;
  mape: number;
  rmse: number;
  r2: number;
  forecastHorizon: number;
  trainedDate: Date;
  confidenceLevel: number;
  isOptimal: boolean; // True if this is the best model
  comparisonMetrics?: {
    otherModels: Array<{
      name: string;
      accuracy: number;
      mape: number;
    }>;
  };
};
```

## Error Handling

### 1. Missing Analysis Data

**Scenario**: User opens insights panel before running any analysis

**Handling**:
```typescript
if (!state.analyzedData.hasEDA && !state.analyzedData.hasForecasting) {
  return (
    <EmptyState 
      message="No analysis performed yet"
      suggestions={[
        "Ask me to explore your data",
        "Run a forecast analysis",
        "Generate business insights"
      ]}
    />
  );
}
```

### 2. Duplicate Request Prevention

**Scenario**: User clicks prompt multiple times or navigates quickly

**Handling**:
```typescript
const submitMessage = async (messageText: string) => {
  if (state.isProcessing) {
    console.warn('Request already in progress, ignoring duplicate');
    return;
  }
  // ... proceed with request
};
```

### 3. Visualization Panel Conflicts

**Scenario**: Both panels try to open simultaneously

**Handling**:
```typescript
// Independent state management
const handleVisualizeClick = () => {
  dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: true });
  // Do NOT automatically open insights panel
};

const handleInsightsClick = () => {
  dispatch({ type: 'SET_INSIGHTS_PANEL_OPEN', payload: true });
  // Do NOT automatically open data panel
};
```

### 4. Missing Forecast Data

**Scenario**: User tries to view forecast chart before running forecasting

**Handling**:
```typescript
if (!state.analyzedData.hasForecasting) {
  return (
    <Card>
      <CardContent>
        <p>No forecast data available. Run a forecast analysis first.</p>
        <Button onClick={() => submitMessage("Generate a 30-day forecast")}>
          Run Forecast
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Testing Strategy

### Unit Tests

1. **AppState Reducer Tests**
   - Test `SET_ANALYZED_DATA` action updates state correctly
   - Test `QUEUE_USER_PROMPT` and `CLEAR_QUEUED_PROMPT` actions
   - Test `SET_PROCESSING` prevents duplicate submissions

2. **Enhanced Insights Panel Tests**
   - Test empty state when no analysis is performed
   - Test display of real metrics from `analyzedData`
   - Test conditional rendering based on analysis type
   - Test that forecast data only shows when `hasForecasting === true`

3. **Enhanced Data Visualizer Tests**
   - Test outlier highlighting with different severity levels
   - Test forecast data rendering with confidence intervals
   - Test chart updates when analysis type changes
   - Test tooltip content for outliers

### Integration Tests

1. **End-to-End Analysis Flow**
   - User uploads data → runs EDA → insights panel updates with real data
   - User runs forecasting → chart shows forecast line → insights panel shows model metrics
   - User switches LOB → insights panel resets → new analysis updates panel

2. **Request Deduplication Flow**
   - User clicks prompt on main page → navigates to chat → single request sent
   - User clicks prompt twice quickly → only one request processed
   - User submits while processing → second request ignored

3. **Visualization Independence**
   - User clicks "Visualize Data" → only chart panel opens
   - User clicks "Show Insights" → only insights panel opens
   - User opens both panels → both function independently
   - User closes one panel → other remains open

### Manual Testing Scenarios

1. **Real Data Integration**
   - Upload CSV with 100+ rows
   - Run EDA analysis
   - Verify insights panel shows actual statistics (mean, std dev, outliers)
   - Run forecasting
   - Verify insights panel shows model name, accuracy, MAPE
   - Verify chart shows forecast line with confidence intervals

2. **Duplicate Request Prevention**
   - Click initial prompt on main page
   - Observe single request in network tab
   - Observe single response in chat
   - Click another prompt while first is processing
   - Verify second request is blocked

3. **Visualization Conflicts**
   - Click "Visualize Data" chipset
   - Verify only chart panel opens
   - Verify insights panel remains closed
   - Click "Show Insights"
   - Verify insights panel opens
   - Verify both panels are now open and functional

4. **Outlier Highlighting**
   - Upload data with known outliers
   - Run EDA analysis
   - Open chart visualization
   - Verify outlier points are highlighted in red
   - Hover over outlier
   - Verify tooltip explains why it's an outlier

5. **Forecast Display**
   - Run forecasting analysis
   - Open chart visualization
   - Switch to "Forecast" tab
   - Verify forecast line is displayed
   - Verify confidence interval shading
   - Verify actual vs forecast comparison

## Implementation Notes

### Phase 1: State Management Updates
- Add `analyzedData` to AppState
- Add `queuedUserPrompt` to AppState
- Implement new reducer actions
- Update TypeScript types

### Phase 2: Request Deduplication
- Update main page to queue prompts
- Update chat page to process queued prompts once
- Add processing flag checks
- Test duplicate prevention

### Phase 3: Enhanced Insights Panel
- Remove mock data generation
- Read from `state.analyzedData`
- Implement conditional rendering based on analysis type
- Add empty states with guidance

### Phase 4: Chart Enhancements
- Add outlier highlighting logic
- Add forecast data rendering
- Implement confidence intervals
- Add dynamic tooltips

### Phase 5: Visualization Independence
- Separate panel open/close states
- Remove automatic panel opening logic
- Test independent operation
- Fix any remaining conflicts

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive calculations in charts
2. **Lazy Loading**: Only render charts when panel is open
3. **Data Filtering**: Filter large datasets before rendering
4. **Debouncing**: Debounce rapid state updates
5. **Virtual Scrolling**: Use for large insight lists

## Security Considerations

1. **Data Validation**: Validate all analysis results before storing in state
2. **XSS Prevention**: Sanitize any user-generated content in insights
3. **Rate Limiting**: Prevent excessive API calls from duplicate requests
4. **Error Boundaries**: Wrap panels in error boundaries to prevent crashes

## Accessibility Considerations

1. **Screen Readers**: Add ARIA labels to chart elements
2. **Keyboard Navigation**: Ensure all panels are keyboard accessible
3. **Color Contrast**: Use high-contrast colors for outlier highlighting
4. **Focus Management**: Manage focus when panels open/close
5. **Alternative Text**: Provide text alternatives for visual insights
