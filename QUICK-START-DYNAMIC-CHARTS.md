# Quick Start: Dynamic Charts in 5 Minutes

## 1. Install (Already Done ✅)

The system is already created. You have:
- `src/lib/dynamic-chart-generator.ts`
- `src/components/dashboard/dynamic-chart-renderer.tsx`
- `src/components/dashboard/inline-chart-message.tsx`
- `src/components/dashboard/chat-message-with-chart.tsx`

## 2. Update Your Chat Panel (2 minutes)

Replace your existing chat message rendering with:

```typescript
// src/components/dashboard/chat-panel.tsx

import ChatMessageWithChart from './chat-message-with-chart';
import { statisticalAnalyzer } from '@/lib/statistical-analysis';

export default function ChatPanel() {
  const { state } = useApp();
  
  // Calculate stats once for all messages
  const stats = React.useMemo(() => {
    if (!state.selectedLob?.timeSeriesData) return null;
    
    const data = state.selectedLob.timeSeriesData;
    const values = data.map(d => d.Value);
    const dataPoints = data.map(d => ({
      date: new Date(d.Date),
      value: d.Value,
      orders: d.Orders
    }));
    
    return {
      statistical: statisticalAnalyzer.calculateStatisticalSummary(values),
      trend: statisticalAnalyzer.analyzeTrend(dataPoints),
      quality: { score: 85, issues: [], recommendations: [] }
    };
  }, [state.selectedLob?.timeSeriesData]);
  
  return (
    <ScrollArea>
      {state.messages.map((message, i) => (
        <ChatMessageWithChart
          key={message.id}
          message={message}
          userQuery={i > 0 ? state.messages[i-1]?.content : ''}
          statisticalAnalysis={stats}
          onSuggestionClick={(s) => console.log('Suggestion:', s)}
          onVisualizeClick={(id) => console.log('Visualize:', id)}
        />
      ))}
    </ScrollArea>
  );
}
```

## 3. Update Message Handler (2 minutes)

When creating assistant messages, include visualization data:

```typescript
import { dynamicChartGenerator } from '@/lib/dynamic-chart-generator';

async function handleUserMessage(userMessage: string) {
  const { selectedLob } = state;
  
  // Detect if chart is needed
  const vizIntent = dynamicChartGenerator.detectVisualizationIntent(userMessage);
  
  // Generate AI response
  const aiResponse = await generateResponse(userMessage);
  
  // Create message with visualization
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: aiResponse,
    
    // Add visualization data if needed
    visualization: vizIntent.needsChart && selectedLob?.timeSeriesData ? {
      data: selectedLob.timeSeriesData,
      target: 'Value',
      showOutliers: vizIntent.features.includes('outliers')
    } : undefined
  };
  
  dispatch({ type: 'ADD_MESSAGE', payload: message });
}
```

## 4. Test It! (1 minute)

Try these queries in your chat:

```
✅ "show me the forecast"
   → Automatic forecast chart appears

✅ "detect outliers in my data"
   → Outlier detection chart with red dots

✅ "plot the trend"
   → Trend analysis with regression line

✅ "compare actual vs forecast"
   → Comparison chart with both series

✅ "visualize the data"
   → Basic line chart
```

## That's It! 🎉

Your chat now has ChatGPT/Gemini-style inline charts that automatically appear based on user queries.

## What You Get

- ✅ Automatic chart detection from queries
- ✅ Inline rendering in chat messages
- ✅ Outlier highlighting
- ✅ Forecast visualization
- ✅ Trend analysis
- ✅ Interactive tooltips
- ✅ Export functionality
- ✅ Statistical insights

## Customization (Optional)

### Change Chart Colors

```typescript
// In src/components/dashboard/dynamic-chart-renderer.tsx
const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
```

### Add Custom Chart Type

```typescript
// In src/lib/dynamic-chart-generator.ts
if (/(your-keyword)/i.test(lowerQuery)) {
  return {
    type: 'your-chart-type',
    title: 'Your Chart',
    dataKeys: ['Value'],
    // ... config
  };
}
```

### Modify Tooltip

```typescript
// In src/components/dashboard/dynamic-chart-renderer.tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  // Your custom tooltip JSX
};
```

## Troubleshooting

**Charts not showing?**
- Check that `visualization.data` exists in message
- Verify query contains visualization keywords
- Ensure statistical analysis is passed

**Outliers not highlighted?**
- Confirm `showOutliers: true` in visualization config
- Check statistical analysis includes outlier data

**Wrong chart type?**
- Review query keywords in `analyzeQuery` method
- Add custom detection logic if needed

## Need Help?

See full documentation:
- `DYNAMIC-CHART-SYSTEM.md` - Complete technical docs
- `INTEGRATION-EXAMPLE.md` - Detailed integration guide
- `DYNAMIC-PLOT-AREA-SUMMARY.md` - Feature overview

## Example Queries

### Forecasting
```
"show me the forecast for next 30 days"
"predict future values"
"visualize the projection"
```

### Outliers
```
"find outliers in my data"
"detect anomalies"
"show unusual values"
```

### Trends
```
"what's the trend?"
"plot the growth pattern"
"show me the direction"
```

### Comparisons
```
"compare actual vs forecast"
"show actual and predicted"
"visualize the difference"
```

All of these will automatically generate and display appropriate charts inline in the chat!
