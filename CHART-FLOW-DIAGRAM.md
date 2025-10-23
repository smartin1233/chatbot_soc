# Dynamic Chart System - Flow Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    "show me the forecast"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT PANEL COMPONENT                        │
│  • Receives user query                                           │
│  • Passes to message handler                                     │
│  • Renders ChatMessageWithChart                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE HANDLER / AGENT                       │
│  • Generates AI response                                         │
│  • Detects visualization intent                                  │
│  • Includes visualization data in message                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              DYNAMIC CHART GENERATOR (Analysis)                  │
│                                                                   │
│  detectVisualizationIntent(query)                               │
│    ├─ needsChart: true                                          │
│    ├─ chartType: 'forecast-comparison'                          │
│    └─ features: ['forecast', 'trend']                           │
│                                                                   │
│  analyzeQuery(query)                                            │
│    └─ Returns ChartConfig:                                      │
│        ├─ type: 'forecast-comparison'                           │
│        ├─ title: 'Actual vs Forecast'                           │
│        ├─ showForecast: true                                    │
│        ├─ showTrend: true                                       │
│        └─ showConfidenceInterval: true                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              STATISTICAL ANALYZER (Enhancement)                  │
│                                                                   │
│  calculateStatisticalSummary(values)                            │
│    ├─ mean, median, stdDev                                      │
│    ├─ outliers (IQR method)                                     │
│    └─ skewness, kurtosis                                        │
│                                                                   │
│  analyzeTrend(dataPoints)                                       │
│    ├─ linear regression                                         │
│    ├─ slope, intercept                                          │
│    └─ R² score                                                  │
│                                                                   │
│  analyzeSeasonality(dataPoints)                                 │
│    └─ weekly patterns                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              DYNAMIC CHART GENERATOR (Processing)                │
│                                                                   │
│  processData(data, config, stats)                               │
│    ├─ Add formattedDate                                         │
│    ├─ Calculate movingAverage (7-day)                           │
│    ├─ Add trend line values                                     │
│    ├─ Mark outliers (isOutlier: true)                           │
│    ├─ Calculate anomalyScore (z-score)                          │
│    ├─ Add confidence intervals                                  │
│    └─ Include forecast data                                     │
│                                                                   │
│  Returns: ProcessedChartData[]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHAT MESSAGE WITH CHART                         │
│                                                                   │
│  • Receives message with visualization data                      │
│  • Checks if inline chart should show                           │
│  • Renders InlineChartMessage if needed                         │
│  • Shows manual "Visualize" button otherwise                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INLINE CHART MESSAGE                           │
│                                                                   │
│  • Wraps DynamicChartRenderer                                   │
│  • Adds export/expand buttons                                   │
│  • Shows contextual insights                                    │
│  • Displays feature badges                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DYNAMIC CHART RENDERER                          │
│                                                                   │
│  Based on config.type, renders:                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  FORECAST COMPARISON CHART                          │       │
│  │  • Blue line: Actual data                           │       │
│  │  • Green dashed: Forecast                           │       │
│  │  • Light green area: Confidence interval            │       │
│  │  • Yellow line: Trend                               │       │
│  │  • Red dots: Outliers                               │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  OUTLIER DETECTION CHART                            │       │
│  │  • Blue dots: Normal points                         │       │
│  │  • Red dots (large): Outliers                       │       │
│  │  • Red dashed: Upper/lower bounds                   │       │
│  │  • Green dashed: Moving average                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  TREND ANALYSIS CHART                               │       │
│  │  • Blue shaded area: Data values                    │       │
│  │  • Yellow line: Linear regression                   │       │
│  │  • Green dashed: Moving average                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                   │
│  Custom Components:                                              │
│  • CustomTooltip (rich information)                             │
│  • CustomDot (outlier highlighting)                             │
│  • Statistical summary footer                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RECHARTS LIBRARY                            │
│  • LineChart, AreaChart, BarChart                               │
│  • ComposedChart, ScatterChart                                  │
│  • XAxis, YAxis, CartesianGrid                                  │
│  • Tooltip, Legend, ResponsiveContainer                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDERED CHART IN CHAT                        │
│  ✅ Interactive tooltips on hover                               │
│  ✅ Export button (PNG/SVG)                                     │
│  ✅ Expand button (fullscreen)                                  │
│  ✅ Refresh button (reload data)                                │
│  ✅ Statistical insights below                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Query Detection Flow

```
User Query: "show me the forecast with outliers"
     │
     ▼
┌─────────────────────────────────────┐
│  detectVisualizationIntent()        │
│  • Checks for keywords:             │
│    - show, display, visualize       │
│    - forecast, predict              │
│    - outliers, anomalies            │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Result:                             │
│  • needsChart: true                  │
│  • chartType: 'forecast-comparison'  │
│  • features: ['forecast', 'outliers']│
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  analyzeQuery()                      │
│  • Matches "forecast" pattern       │
│  • Returns ChartConfig:              │
│    - type: forecast-comparison       │
│    - showForecast: true              │
│    - showOutliers: true              │
│    - showConfidenceInterval: true    │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Chart automatically renders inline  │
│  with all requested features         │
└─────────────────────────────────────┘
```

## Data Processing Pipeline

```
Raw Data (WeeklyData[])
     │
     ▼
┌─────────────────────────────────────┐
│  Statistical Analysis                │
│  • Calculate mean, stdDev            │
│  • Detect outliers (IQR)             │
│  • Compute linear regression         │
│  • Analyze seasonality               │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Data Enhancement                    │
│  • Format dates                      │
│  • Add moving averages               │
│  • Calculate trend values            │
│  • Mark outliers                     │
│  • Add confidence intervals          │
│  • Include forecast data             │
└─────────────────────────────────────┘
     │
     ▼
ProcessedChartData[]
     │
     ▼
┌─────────────────────────────────────┐
│  Chart Rendering                     │
│  • Select appropriate chart type     │
│  • Apply configuration               │
│  • Render with Recharts              │
│  • Add custom tooltips               │
│  • Highlight special points          │
└─────────────────────────────────────┘
     │
     ▼
Interactive Chart in Chat
```

## Component Hierarchy

```
ChatPanel
  └─ ScrollArea
      └─ ChatMessageWithChart (for each message)
          ├─ Avatar
          ├─ Message Content
          ├─ InlineChartMessage (if visualization needed)
          │   ├─ Chart Context Header
          │   │   ├─ Feature Badges
          │   │   └─ Action Buttons (Export, Expand, Refresh)
          │   ├─ DynamicChartRenderer
          │   │   ├─ Card
          │   │   │   ├─ CardHeader (Title, Description, Badges)
          │   │   │   └─ CardContent
          │   │   │       ├─ ResponsiveContainer
          │   │   │       │   └─ Recharts Component
          │   │   │       │       ├─ CartesianGrid
          │   │   │       │       ├─ XAxis
          │   │   │       │       ├─ YAxis
          │   │   │       │       ├─ Tooltip (CustomTooltip)
          │   │   │       │       ├─ Legend
          │   │   │       │       ├─ Lines/Areas/Bars
          │   │   │       │       └─ Custom Dots (for outliers)
          │   │   │       └─ Statistical Summary Footer
          │   └─ Chart Insights Footer
          ├─ Suggested Actions
          └─ Report Generation Button
```

## Agent Workflow Integration

```
User Query
     │
     ▼
┌─────────────────────────────────────┐
│  Agent Orchestrator                  │
│  • analyzeIntent()                   │
│    - Detects: forecasting_with_viz   │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Workflow Planning                   │
│  Step 1: EDA Agent                   │
│  Step 2: Forecasting Agent           │
│  Step 3: Visualization Agent         │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Execute Workflow                    │
│  • EDA Agent: Analyze data           │
│  • Forecasting Agent: Generate pred  │
│  • Visualization Agent: Create chart │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Return Response                     │
│  • AI text response                  │
│  • Chart configuration               │
│  • Processed data                    │
│  • Statistical analysis              │
└─────────────────────────────────────┘
     │
     ▼
Chart Renders Inline in Chat
```

## Key Decision Points

```
┌─────────────────────────────────────┐
│  Should chart show inline?           │
│                                      │
│  IF query contains:                  │
│    - show/display/visualize/plot     │
│  AND                                 │
│    - visualization data exists       │
│  THEN                                │
│    → Show inline automatically       │
│  ELSE                                │
│    → Show "Visualize" button         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Which chart type to use?            │
│                                      │
│  IF query contains "forecast"        │
│    → forecast-comparison             │
│  ELSE IF query contains "outlier"    │
│    → outlier-detection               │
│  ELSE IF query contains "trend"      │
│    → trend-analysis                  │
│  ELSE IF query contains "compare"    │
│    → composed                        │
│  ELSE                                │
│    → line (default)                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Which features to include?          │
│                                      │
│  • showForecast: if "forecast" in Q  │
│  • showOutliers: if "outlier" in Q   │
│  • showTrend: if "trend" in Q        │
│  • showConfidenceInterval: if        │
│    forecast + confidence in Q        │
│  • showMovingAverage: always         │
└─────────────────────────────────────┘
```

## Summary

This architecture provides:
- ✅ Automatic chart detection from natural language
- ✅ Intelligent chart type selection
- ✅ Statistical data enhancement
- ✅ Beautiful inline rendering
- ✅ Interactive features
- ✅ Agent workflow integration
- ✅ Extensible and customizable
