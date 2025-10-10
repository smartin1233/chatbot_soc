# Quick Fix Summary: Intent-Based Analysis

## Problem
- "Explore data" was mentioning outliers (should not)
- No distinction between basic and detailed EDA
- Outlier detection not providing detailed information
- Model training not showing form first
- Visualizations not highlighting outliers

## Solution

### 1. Intent Detection (src/lib/intent-analyzer.ts) ✅
Added new intent types:
- `DETAILED_EDA` - For comprehensive analysis
- Updated `DATA_DESCRIPTION` - For basic exploration (no outliers)
- Enhanced `OUTLIER_DETECTION` - For detailed anomaly analysis
- Added `VISUALIZE_DATA` - For chart requests

### 2. Agent Configuration (src/components/dashboard/enhanced-chat-panel.tsx) ✅
- Updated EDA agent to check for hints and exclude outliers by default
- Added new `outlier_detection` agent for detailed anomaly analysis
- Updated agent prompts to respect context hints

### 3. Message Routing (Needs Implementation)
Add intent detection in submitMessage:
```typescript
// Detect intent
if (/(explore|show).*data/i.test(message)) {
  agent = 'eda'
  hints = ['exclude_outlier_analysis']
}
else if (/(detailed|comprehensive).*eda/i.test(message)) {
  agent = 'eda'
  hints = ['include_outlier_analysis']
}
else if (/(check|detect).*outlier/i.test(message)) {
  agent = 'outlier_detection'
  hints = ['detailed_outlier_info']
}
else if (/(train|forecast)/i.test(message)) {
  showModelTrainingForm()
  return
}
```

### 4. Visualization (Needs Implementation)
Update chart component to highlight outliers:
- Add `isOutlier` flag to data points
- Use different color/marker for outliers
- Add reference lines for outlier points

## Files Modified
1. ✅ `src/lib/intent-analyzer.ts` - Intent detection
2. ✅ `src/components/dashboard/enhanced-chat-panel.tsx` - Agent configuration
3. ⏳ Message routing logic (needs implementation)
4. ⏳ Visualization component (needs implementation)

## Testing Checklist
- [ ] "Explore data" → No outlier mentions
- [ ] "Detailed EDA" → Includes outliers
- [ ] "Check for anomalies" → Detailed outlier report
- [ ] "Visualize data" → Chart with outliers highlighted
- [ ] "Train model" → Shows form first
- [ ] "Generate forecast" → Shows form first

## Next Steps
1. Implement message routing logic in chat panel
2. Update visualization component to highlight outliers
3. Test all intent variations
4. Refine agent prompts based on feedback
