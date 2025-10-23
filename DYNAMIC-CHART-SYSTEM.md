# Dynamic Chart System - Implementation Guide

## Overview

The Dynamic Chart System provides ChatGPT/Gemini-style inline chart rendering that automatically generates appropriate visualizations based on user queries. It supports outlier detection, forecasting, trend analysis, and comparisons.

## Architecture

### Core Components

1. **DynamicChartGenerator** (`src/lib/dynamic-chart-generator.ts`)
   - Analyzes user queries to determine chart type
   - Processes data with statistical enhancements
   - Recommends appropriate visualizations

2. **DynamicChartRenderer** (`src/components/dashboard/dynamic-chart-renderer.tsx`)
   - Renders Recharts visualizations dynamically
   - Supports multiple chart types (line, area, bar, scatter, composed)
   - Includes custom tooltips and outlier highlighting

3. **InlineChartMessage** (`src/components/dashboard/inline-chart-message.tsx`)
   - Embeds charts directly in chat messages
   - Provides export and expand functionality
   - Shows contextual insights

4. **AgentOrchestrator** (`src/ai/agent-orchestrator.ts`)
   - Coordinates visualization workflow
   - Integrates with statistical analysis
   - Manages agent execution

## Features

### Automatic Chart Detection

The system automatically detects visualization needs from user queries:

```typescript
// Query examples that trigger specific charts:
"show me the forecast" → Forecast Comparison Chart
"detect outliers" → Outlier Detection Chart
"what's the trend?" → Trend Analysis Chart
"compare actual vs forecast" → Comparison Chart
```

### Supported Chart Types

1. **Forecast Comparison**
   - Shows actual vs predicted values
   - Includes confidence intervals
   - Displays trend lines

2. **Outlier Detection**
   - Highlights anomalies
   - Shows upper/lower bounds
   - Includes moving average

3. **Trend Analysis**
   - Linear regression line
   - Moving average smoothing
   - Area chart for visual impact

4. **Distribution Analysis**
   - Bar chart with moving average
   - Value distribution over time

5. **Composed Charts**
   - Multiple data series
   - Flexible configuration
   - Custom comparisons

### Statistical Enhancements

All charts include:
- Moving averages (7-day window)
- Trend lines (linear regression)
- Outlier detection (IQR method)
- Confidence intervals (95%)
- Anomaly scoring

## Usage

### Basic Integration in Chat Panel

```typescript
import InlineChartMessage from '@/components/dashboard/inline-chart-message';
import { dynamicChartGenerator } from '@/lib/dynamic-chart-generator';

// In your chat message renderer:
{message.role === 'assistant' && shouldShowChart && (
  <InlineChartMessage
    data={timeSeriesData}
    query={userQuery}
    statisticalAnalysis={analysisResults}
    onExpand={() => openFullScreen()}
    onRefresh={() => regenerateChart()}
  />
)}
```

### Standalone Chart Rendering

```typescript
import DynamicChartRenderer from '@/components/dashboard/dynamic-chart-renderer';
import { dynamicChartGenerator } from '@/lib/dynamic-chart-generator';

// Analyze query and generate config
const config = dynamicChartGenerator.analyzeQuery("show forecast with outliers");

// Process data
const processedData = dynamicChartGenerator.processData(
  rawData,
  config,
  statisticalAnalysis
);

// Render chart
<DynamicChartRenderer
  data={processedData}
  config={config}
/>
```

### Query Intent Detection

```typescript
import { dynamicChartGenerator } from '@/lib/dynamic-chart-generator';

const intent = dynamicChartGenerator.detectVisualizationIntent(userQuery);

if (intent.needsChart) {
  console.log('Chart type:', intent.chartType);
  console.log('Features:', intent.features); // ['outliers', 'forecast', 'trend']
}
```

### Chart Recommendations

```typescript
const recommendations = dynamicChartGenerator.recommendCharts(
  data,
  statisticalAnalysis
);

// Returns array of recommended chart configurations
recommendations.forEach(config => {
  console.log(config.title, config.description);
});
```

## Integration with Agent Orchestrator

The system integrates with the agent workflow:

```typescript
// User query: "show me actual vs forecast data in a plot"

// 1. Intent Analysis
const intent = analyzeIntent(query); // Returns: 'forecasting_with_viz'

// 2. Workflow Planning
const workflow = [
  { agent: 'EDA Agent', task: 'Analyze data' },
  { agent: 'Forecasting Agent', task: 'Generate forecast' },
  { agent: 'Visualization Agent', task: 'Create chart' }
];

// 3. Chart Generation
const config = dynamicChartGenerator.analyzeQuery(query);
const processedData = dynamicChartGenerator.processData(data, config, stats);

// 4. Inline Rendering
<InlineChartMessage data={processedData} query={query} />
```

## Configuration Options

### ChartConfig Interface

```typescript
interface ChartConfig {
  type: ChartType;
  title: string;
  description: string;
  dataKeys: string[];
  showOutliers?: boolean;
  showForecast?: boolean;
  showTrend?: boolean;
  showConfidenceInterval?: boolean;
  showMovingAverage?: boolean;
  highlightAnomalies?: boolean;
  comparisonMode?: 'actual-vs-forecast' | 'period-over-period' | 'multiple-series';
}
```

### ProcessedChartData Interface

```typescript
interface ProcessedChartData extends WeeklyData {
  formattedDate: string;
  trend?: number;
  movingAverage?: number;
  upperBound?: number;
  lowerBound?: number;
  isOutlier?: boolean;
  anomalyScore?: number;
  forecastValue?: number;
  forecastUpper?: number;
  forecastLower?: number;
}
```

## Examples

### Example 1: Forecast with Confidence Intervals

```typescript
const config = {
  type: 'forecast-comparison',
  title: 'Sales Forecast',
  description: '30-day projection with 95% confidence',
  dataKeys: ['Value', 'Forecast'],
  showForecast: true,
  showConfidenceInterval: true,
  showTrend: true
};
```

### Example 2: Outlier Detection

```typescript
const config = {
  type: 'outlier-detection',
  title: 'Anomaly Detection',
  description: 'Unusual patterns highlighted',
  dataKeys: ['Value'],
  showOutliers: true,
  highlightAnomalies: true,
  showMovingAverage: true
};
```

### Example 3: Trend Analysis

```typescript
const config = {
  type: 'trend-analysis',
  title: 'Growth Trend',
  description: 'Historical trend with regression',
  dataKeys: ['Value'],
  showTrend: true,
  showMovingAverage: true
};
```

## Customization

### Custom Tooltips

Modify `CustomTooltip` in `DynamicChartRenderer`:

```typescript
const CustomTooltip = ({ active, payload, label }: any) => {
  // Add custom fields
  // Change styling
  // Add business logic
};
```

### Custom Dot Rendering

Modify `CustomDot` for outlier visualization:

```typescript
const CustomDot = (props: any) => {
  // Custom outlier rendering
  // Different colors for severity
  // Animation effects
};
```

### Chart Colors

Update color schemes in the render functions:

```typescript
const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
```

## Performance Considerations

1. **Data Processing**: Processed data is memoized to avoid recalculation
2. **Chart Rendering**: Uses ResponsiveContainer for efficient resizing
3. **Statistical Analysis**: Calculations cached in useMemo hooks
4. **Large Datasets**: Consider data sampling for >1000 points

## Best Practices

1. **Always provide statistical analysis** for enhanced visualizations
2. **Use appropriate chart types** based on data characteristics
3. **Include confidence intervals** for forecasts
4. **Highlight outliers** when relevant to the query
5. **Provide export functionality** for user convenience
6. **Show contextual insights** below charts
7. **Enable expand/fullscreen** for detailed analysis

## Future Enhancements

- [ ] Interactive chart editing
- [ ] Multiple chart comparison view
- [ ] Custom color themes
- [ ] Animation on data updates
- [ ] Chart annotations
- [ ] Export to multiple formats (PNG, SVG, PDF)
- [ ] Real-time data streaming
- [ ] 3D visualizations
- [ ] Heatmaps and correlation matrices
- [ ] Geospatial charts

## Troubleshooting

### Charts not rendering
- Check data format matches WeeklyData interface
- Verify statistical analysis is provided
- Ensure Recharts is installed

### Outliers not showing
- Confirm `showOutliers: true` in config
- Check statistical analysis includes outlier data
- Verify IQR calculation in data processing

### Forecast not displaying
- Ensure data includes Forecast field
- Check `showForecast: true` in config
- Verify forecast data is not null/undefined

## API Reference

### DynamicChartGenerator

```typescript
class DynamicChartGenerator {
  analyzeQuery(query: string): ChartConfig
  processData(data: WeeklyData[], config: ChartConfig, stats?: any): ProcessedChartData[]
  recommendCharts(data: WeeklyData[], stats?: any): ChartConfig[]
  detectVisualizationIntent(query: string): { needsChart: boolean; chartType?: ChartType; features: string[] }
}
```

### DynamicChartRenderer Props

```typescript
interface DynamicChartRendererProps {
  data: ProcessedChartData[];
  config: ChartConfig;
  className?: string;
}
```

### InlineChartMessage Props

```typescript
interface InlineChartMessageProps {
  data: WeeklyData[];
  query: string;
  statisticalAnalysis?: any;
  className?: string;
  onExpand?: () => void;
  onRefresh?: () => void;
}
```

## Summary

The Dynamic Chart System provides a powerful, flexible way to generate visualizations automatically based on user intent. It combines statistical analysis, intelligent query parsing, and beautiful Recharts rendering to create a ChatGPT/Gemini-like experience for data visualization.

Key benefits:
- ✅ Automatic chart type selection
- ✅ Statistical enhancements (outliers, trends, forecasts)
- ✅ Inline rendering in chat messages
- ✅ Export and expand functionality
- ✅ Customizable and extensible
- ✅ Performance optimized
