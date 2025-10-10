# Dynamic Chart Integration Example

## Complete Integration Guide

This guide shows how to integrate the dynamic chart system into your chat panel for automatic, inline chart rendering like ChatGPT/Gemini.

## Step 1: Update Chat Panel to Use New Component

```typescript
// src/components/dashboard/chat-panel.tsx

import ChatMessageWithChart from './chat-message-with-chart';
import { statisticalAnalyzer } from '@/lib/statistical-analysis';

export default function ChatPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const [currentQuery, setCurrentQuery] = React.useState('');
  
  // Calculate statistical analysis for current LOB data
  const statisticalAnalysis = React.useMemo(() => {
    if (!state.selectedLob?.timeSeriesData) return null;
    
    const data = state.selectedLob.timeSeriesData;
    const dataPoints = data.map(d => ({
      date: new Date(d.Date),
      value: d.Value,
      orders: d.Orders
    }));
    
    return {
      statistical: statisticalAnalyzer.calculateStatisticalSummary(
        dataPoints.map(d => d.value)
      ),
      trend: statisticalAnalyzer.analyzeTrend(dataPoints),
      seasonality: statisticalAnalyzer.analyzeSeasonality(dataPoints),
      quality: {
        score: 85,
        issues: [],
        recommendations: []
      }
    };
  }, [state.selectedLob?.timeSeriesData]);
  
  // Render messages with chart support
  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="p-4 space-y-4">
          {state.messages.map((message, index) => (
            <ChatMessageWithChart
              key={message.id}
              message={message}
              userQuery={index > 0 ? state.messages[index - 1]?.content : currentQuery}
              statisticalAnalysis={statisticalAnalysis}
              onSuggestionClick={handleSuggestionClick}
              onVisualizeClick={handleVisualizeClick}
              onGenerateReport={handleGenerateReport}
              thinkingSteps={message.isTyping ? state.thinkingSteps : []}
            />
          ))}
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <form onSubmit={handleSubmit}>
        <Textarea
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          placeholder="Ask about your data..."
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
```

## Step 2: Update Message Handler to Include Visualization Data

```typescript
// In your chat handler or agent orchestrator

async function handleUserMessage(userMessage: string, context: any) {
  const { selectedLob } = context;
  
  // Detect if visualization is needed
  const vizIntent = dynamicChartGenerator.detectVisualizationIntent(userMessage);
  
  // Generate AI response
  const aiResponse = await generateAIResponse(userMessage, context);
  
  // Prepare message with visualization data
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: aiResponse.text,
    agentType: aiResponse.agentType,
    suggestions: aiResponse.suggestions,
    
    // Include visualization data if needed
    visualization: vizIntent.needsChart && selectedLob?.timeSeriesData ? {
      data: selectedLob.timeSeriesData,
      target: 'Value',
      isShowing: false, // Will auto-show based on query intent
      showOutliers: vizIntent.features.includes('outliers')
    } : undefined
  };
  
  return message;
}
```

## Step 3: Query Examples That Trigger Charts

### Automatic Inline Charts (No Button Click Needed)

```typescript
// These queries will automatically show charts inline:

"show me the forecast"
→ Displays forecast comparison chart with confidence intervals

"visualize the data with outliers"
→ Shows outlier detection chart with anomalies highlighted

"plot the trend"
→ Renders trend analysis with regression line

"compare actual vs forecast"
→ Shows comparison chart with both series

"display the data"
→ Shows basic line chart with data
```

### Manual Chart Toggle

```typescript
// These queries provide a "Visualize" button:

"what's the trend?" (without "show" or "plot")
→ Text response + "Visualize Data" button

"analyze my data"
→ Analysis text + "Show Chart" button
```

## Step 4: Customize Chart Behavior

### Override Default Chart Config

```typescript
// In your message handler

const customConfig: ChartConfig = {
  type: 'forecast-comparison',
  title: 'Custom Sales Forecast',
  description: 'Next 30 days with 95% confidence',
  dataKeys: ['Value', 'Forecast'],
  showForecast: true,
  showConfidenceInterval: true,
  showTrend: true,
  showMovingAverage: true
};

// Pass to InlineChartMessage
<InlineChartMessage
  data={data}
  query={query}
  customConfig={customConfig}  // Override auto-detection
/>
```

### Add Custom Statistical Analysis

```typescript
import { statisticalAnalyzer, insightsGenerator } from '@/lib/statistical-analysis';

const dataPoints = timeSeriesData.map(d => ({
  date: new Date(d.Date),
  value: d.Value,
  orders: d.Orders
}));

const analysis = {
  statistical: statisticalAnalyzer.calculateStatisticalSummary(
    dataPoints.map(d => d.value)
  ),
  trend: statisticalAnalyzer.analyzeTrend(dataPoints),
  seasonality: statisticalAnalyzer.analyzeSeasonality(dataPoints),
  quality: insightsGenerator.generateDataQualityReport(dataPoints)
};

// Pass to chart component
<InlineChartMessage
  data={timeSeriesData}
  query={userQuery}
  statisticalAnalysis={analysis}
/>
```

## Step 5: Handle Chart Interactions

### Expand Chart to Full Screen

```typescript
const [expandedChart, setExpandedChart] = useState<string | null>(null);

const handleExpand = (messageId: string) => {
  setExpandedChart(messageId);
  // Open modal/dialog with full-size chart
};

<Dialog open={expandedChart !== null} onOpenChange={() => setExpandedChart(null)}>
  <DialogContent className="max-w-4xl">
    <InlineChartMessage
      data={chartData}
      query={query}
      statisticalAnalysis={analysis}
      className="w-full"
    />
  </DialogContent>
</Dialog>
```

### Export Chart

```typescript
const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
  // Implementation using html2canvas or similar
  const chartElement = document.getElementById('chart-container');
  
  if (format === 'png') {
    const canvas = await html2canvas(chartElement);
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = canvas.toDataURL();
    link.click();
  }
  
  // Similar for SVG and PDF
};
```

### Refresh Chart

```typescript
const handleRefresh = async (messageId: string) => {
  // Re-fetch data
  const newData = await fetchLatestData();
  
  // Update message with new data
  dispatch({
    type: 'UPDATE_MESSAGE_VISUALIZATION',
    payload: {
      messageId,
      data: newData
    }
  });
};
```

## Step 6: Add to Agent Workflow

### Update Agent Orchestrator

```typescript
// src/ai/agent-orchestrator.ts

async handleUserQuery(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const intent = this.analyzeIntent(input.userMessage);
  
  // Check if visualization is needed
  const vizIntent = dynamicChartGenerator.detectVisualizationIntent(input.userMessage);
  
  // Plan workflow including visualization step
  this.workflow = this.planWorkflow(intent);
  
  // Execute workflow
  let finalOutput = '';
  let chartConfig: ChartConfig | null = null;
  
  for (const step of this.workflow) {
    const { output, provenanceKey } = await this.executeAgentStep(step, input);
    
    // If visualization agent, generate chart config
    if (step.agent === 'Visualization Agent') {
      chartConfig = dynamicChartGenerator.analyzeQuery(input.userMessage);
    }
    
    finalOutput = output;
  }
  
  return {
    response: finalOutput,
    workflow: this.workflow,
    agentStatus: this.agentStatus,
    provenance: this.provenance,
    chartConfig // Include chart config in response
  };
}
```

## Step 7: Real-World Usage Examples

### Example 1: Forecast Request

```typescript
// User: "show me the forecast for next 30 days"

// System automatically:
// 1. Detects visualization intent
// 2. Generates forecast data (from backend or model)
// 3. Creates forecast-comparison chart config
// 4. Renders inline chart with:
//    - Actual historical data (blue line)
//    - Forecast data (green dashed line)
//    - Confidence interval (shaded area)
//    - Trend line (yellow line)

// Result: Chart appears inline in chat message
```

### Example 2: Outlier Detection

```typescript
// User: "detect outliers in my data"

// System automatically:
// 1. Runs statistical analysis
// 2. Identifies outliers using IQR method
// 3. Creates outlier-detection chart config
// 4. Renders inline chart with:
//    - Data points (blue dots)
//    - Outliers (red dots with larger size)
//    - Upper/lower bounds (red dashed lines)
//    - Moving average (green line)

// Result: Chart with highlighted anomalies
```

### Example 3: Trend Analysis

```typescript
// User: "what's the trend in my sales?"

// System automatically:
// 1. Calculates linear regression
// 2. Computes R² score
// 3. Creates trend-analysis chart config
// 4. Renders inline chart with:
//    - Area chart (blue shaded)
//    - Trend line (yellow)
//    - Moving average (green dashed)

// Result: Visual trend representation
```

### Example 4: Comparison

```typescript
// User: "compare actual vs forecast data"

// System automatically:
// 1. Identifies comparison intent
// 2. Prepares both data series
// 3. Creates composed chart config
// 4. Renders inline chart with:
//    - Actual data (blue solid line)
//    - Forecast data (green dashed line)
//    - Legend for clarity

// Result: Side-by-side comparison
```

## Step 8: Testing

### Test Chart Generation

```typescript
import { dynamicChartGenerator } from '@/lib/dynamic-chart-generator';

describe('Dynamic Chart Generator', () => {
  it('should detect forecast intent', () => {
    const config = dynamicChartGenerator.analyzeQuery('show me the forecast');
    expect(config.type).toBe('forecast-comparison');
    expect(config.showForecast).toBe(true);
  });
  
  it('should detect outlier intent', () => {
    const config = dynamicChartGenerator.analyzeQuery('find outliers');
    expect(config.type).toBe('outlier-detection');
    expect(config.showOutliers).toBe(true);
  });
  
  it('should process data with statistical enhancements', () => {
    const data = [/* mock data */];
    const config = { type: 'line', dataKeys: ['Value'] };
    const processed = dynamicChartGenerator.processData(data, config);
    
    expect(processed[0]).toHaveProperty('formattedDate');
    expect(processed[0]).toHaveProperty('movingAverage');
  });
});
```

## Summary

With this integration:

✅ **Automatic chart detection** from user queries
✅ **Inline rendering** like ChatGPT/Gemini
✅ **Statistical enhancements** (outliers, trends, forecasts)
✅ **Interactive features** (expand, export, refresh)
✅ **Agent workflow integration**
✅ **Customizable configurations**
✅ **Performance optimized**

The system provides a seamless, intelligent visualization experience that enhances user interaction with data analysis.
