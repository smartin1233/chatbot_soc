# Dynamic Chart System - Use Cases & Examples

## Real-World Usage Scenarios

### Use Case 1: Sales Forecasting

**User Query**: "show me the sales forecast for next 30 days"

**System Response**:
```
📈 Sales Forecast Analysis

Based on your historical data, here's what we predict:

• Next 30 days: Expected increase of 12%
• Projected revenue: $125,000 (±8%)
• Confidence level: High (R² = 0.87)
• Trend: Upward with seasonal patterns

[INLINE CHART APPEARS HERE]
- Blue line: Historical sales
- Green dashed: 30-day forecast
- Shaded area: 95% confidence interval
- Yellow line: Trend direction

Key Insights:
• Strong upward trend detected
• Seasonal peak expected in week 3
• Recommend inventory increase by 15%
```

**Chart Features**:
- Forecast comparison chart
- Confidence intervals
- Trend line
- Interactive tooltips showing exact values

---

### Use Case 2: Anomaly Detection

**User Query**: "detect outliers in my revenue data"

**System Response**:
```
🔍 Outlier Detection Results

I found 3 unusual data points in your revenue:

• Week of Jan 15: $45,000 (2.8σ above mean)
  Reason: Holiday promotion spike
  
• Week of Feb 3: $12,000 (2.3σ below mean)
  Reason: System downtime
  
• Week of Mar 10: $52,000 (3.1σ above mean)
  Reason: Major client order

[INLINE CHART APPEARS HERE]
- Blue dots: Normal data points
- Red dots (large): Detected outliers
- Red dashed lines: Statistical bounds
- Green line: 7-day moving average

Recommendation:
• Investigate Feb 3 drop for process improvements
• Replicate success factors from Mar 10 spike
```

**Chart Features**:
- Outlier detection chart
- Custom red dots for anomalies
- Upper/lower bounds
- Moving average smoothing

---

### Use Case 3: Trend Analysis

**User Query**: "what's the growth trend in my business?"

**System Response**:
```
📊 Growth Trend Analysis

Your business shows strong positive momentum:

• Overall trend: +18% growth
• Linear regression: R² = 0.82 (strong fit)
• Average weekly growth: +2.3%
• Acceleration: Increasing

[INLINE CHART APPEARS HERE]
- Blue shaded area: Actual revenue
- Yellow line: Linear trend
- Green dashed: Moving average

Pattern Analysis:
• Consistent upward trajectory
• Minimal volatility (good stability)
• Seasonal peaks every 4 weeks
• Growth accelerating in recent months

Next Steps:
• Continue current strategy
• Plan for capacity expansion
• Monitor for trend changes
```

**Chart Features**:
- Trend analysis chart
- Area chart for visual impact
- Regression line
- Moving average

---

### Use Case 4: Actual vs Forecast Comparison

**User Query**: "compare my actual sales with the forecast"

**System Response**:
```
⚖️ Forecast Accuracy Report

Comparing your actual performance vs predictions:

• Overall accuracy: 94.2%
• MAPE: 5.8% (excellent)
• Forecast beat: 60% of weeks
• Average variance: ±$3,200

[INLINE CHART APPEARS HERE]
- Blue solid: Actual sales
- Green dashed: Forecasted sales
- Both lines overlaid for comparison

Performance Breakdown:
• Weeks 1-4: Forecast underestimated (+8%)
• Weeks 5-8: Highly accurate (±2%)
• Weeks 9-12: Forecast overestimated (-5%)

Insights:
• Model performs well overall
• Slight bias toward underestimation
• Consider seasonal adjustments
```

**Chart Features**:
- Composed chart with multiple series
- Side-by-side comparison
- Legend for clarity

---

### Use Case 5: Distribution Analysis

**User Query**: "show me the distribution of my order values"

**System Response**:
```
📊 Order Value Distribution

Here's how your orders are distributed:

• Most common range: $800-$1,200
• Average order: $1,050
• Median order: $980
• Standard deviation: $320

[INLINE CHART APPEARS HERE]
- Bar chart showing frequency
- Green line: Moving average
- Highlights peak periods

Distribution Insights:
• Normal distribution (good sign)
• Few extreme outliers
• Consistent order sizes
• Predictable revenue stream

Opportunities:
• Upsell to increase average order
• Target $1,500+ segment
• Bundle products for higher value
```

**Chart Features**:
- Bar chart for distribution
- Moving average overlay
- Frequency analysis

---

## Query Patterns & Chart Types

### Pattern 1: Explicit Visualization Request

**Queries**:
- "show me..."
- "display the..."
- "visualize..."
- "plot the..."
- "chart the..."
- "graph the..."

**Result**: Automatic inline chart

---

### Pattern 2: Forecast Keywords

**Queries**:
- "forecast"
- "predict"
- "projection"
- "future"
- "next 30 days"

**Chart Type**: Forecast Comparison
**Features**: Confidence intervals, trend line

---

### Pattern 3: Outlier Keywords

**Queries**:
- "outliers"
- "anomalies"
- "unusual"
- "spikes"
- "drops"
- "abnormal"

**Chart Type**: Outlier Detection
**Features**: Highlighted anomalies, bounds, moving average

---

### Pattern 4: Trend Keywords

**Queries**:
- "trend"
- "pattern"
- "direction"
- "growth"
- "decline"

**Chart Type**: Trend Analysis
**Features**: Regression line, moving average, area chart

---

### Pattern 5: Comparison Keywords

**Queries**:
- "compare"
- "versus"
- "vs"
- "actual vs forecast"
- "difference"

**Chart Type**: Composed Chart
**Features**: Multiple series, legend

---

## Advanced Use Cases

### Use Case 6: Multi-Feature Request

**User Query**: "show me the forecast with outliers and trend"

**System Response**:
```
📈 Comprehensive Analysis

Complete view of your data with all insights:

[INLINE CHART APPEARS HERE]
- Blue line: Historical data
- Green dashed: Forecast
- Red dots: Outliers (3 detected)
- Yellow line: Trend
- Shaded area: Confidence interval

Analysis:
• Upward trend: +15% growth
• 3 outliers detected and explained
• Forecast shows continued growth
• High confidence (95%)

All features combined in one view for complete understanding.
```

**Chart Features**:
- All features enabled
- Forecast + outliers + trend
- Comprehensive visualization

---

### Use Case 7: Time Period Specific

**User Query**: "visualize last quarter's performance"

**System Response**:
```
📊 Q1 Performance Review

Your last quarter at a glance:

[INLINE CHART APPEARS HERE]
- Filtered to Q1 data only
- Shows weekly breakdown
- Highlights key events

Quarter Summary:
• Total revenue: $450,000
• Growth: +22% vs Q4
• Best week: Week 8 ($42,000)
• Worst week: Week 3 ($28,000)

Quarter-over-quarter comparison available on request.
```

**Chart Features**:
- Filtered data range
- Period-specific insights
- Contextual annotations

---

### Use Case 8: Metric Comparison

**User Query**: "compare revenue vs orders over time"

**System Response**:
```
⚖️ Revenue vs Orders Analysis

Relationship between your metrics:

[INLINE CHART APPEARS HERE]
- Blue line: Revenue (left axis)
- Orange line: Orders (right axis)
- Dual-axis chart

Correlation Analysis:
• Strong positive correlation (0.89)
• Average order value: $125
• Revenue grows faster than orders
• Indicates increasing order sizes

Insight: Your average order value is increasing, which is excellent for profitability.
```

**Chart Features**:
- Dual-axis chart
- Multiple metrics
- Correlation visualization

---

## Interactive Features

### Feature 1: Hover Tooltips

**What Users See**:
```
[Hovering over data point]

┌─────────────────────────┐
│ Week of Jan 15, 2024    │
├─────────────────────────┤
│ Value: $45,000          │
│ Orders: 360             │
│ 7-day Avg: $38,500      │
│ Trend: $39,200          │
│                         │
│ ⚠️ Outlier Detected     │
│ (2.8σ above mean)       │
└─────────────────────────┘
```

---

### Feature 2: Export Options

**User Clicks Export**:
```
Choose format:
• PNG (for presentations)
• SVG (for editing)
• PDF (for reports)

Chart exported successfully!
```

---

### Feature 3: Expand to Fullscreen

**User Clicks Expand**:
```
[Modal opens with full-size chart]

Larger view with:
• More data points visible
• Enhanced interactivity
• Zoom and pan controls
• Detailed legend
```

---

## Business Scenarios

### Scenario 1: Executive Dashboard

**Context**: CEO wants quick insights

**Query**: "show me our performance"

**Result**:
- Automatic trend chart
- Key metrics highlighted
- Growth percentage visible
- Actionable insights

---

### Scenario 2: Data Analysis

**Context**: Analyst investigating anomaly

**Query**: "why did sales drop on Feb 3?"

**Result**:
- Outlier detection chart
- Anomaly highlighted
- Context provided
- Recommendations given

---

### Scenario 3: Planning Meeting

**Context**: Team planning next quarter

**Query**: "what should we expect next month?"

**Result**:
- Forecast chart with confidence
- Trend projection
- Risk factors identified
- Action items suggested

---

### Scenario 4: Performance Review

**Context**: Reviewing forecast accuracy

**Query**: "how accurate were our predictions?"

**Result**:
- Actual vs forecast comparison
- Accuracy metrics (MAPE, RMSE)
- Variance analysis
- Model improvement suggestions

---

## Tips for Best Results

### 1. Be Specific
```
❌ "show data"
✅ "show me the sales forecast with outliers"
```

### 2. Use Action Words
```
✅ "visualize"
✅ "plot"
✅ "display"
✅ "show"
```

### 3. Mention Features
```
✅ "with outliers"
✅ "including trend"
✅ "with confidence intervals"
```

### 4. Specify Time Periods
```
✅ "for next 30 days"
✅ "last quarter"
✅ "this year"
```

### 5. Request Comparisons
```
✅ "compare actual vs forecast"
✅ "revenue vs orders"
✅ "this year vs last year"
```

---

## Summary

The dynamic chart system handles:
- ✅ Automatic chart generation from natural language
- ✅ Multiple chart types (forecast, outlier, trend, comparison)
- ✅ Statistical enhancements (moving averages, regression, outliers)
- ✅ Interactive features (tooltips, export, expand)
- ✅ Business-focused insights
- ✅ Professional visualizations
- ✅ Real-time rendering

All with simple, conversational queries like ChatGPT and Gemini!
