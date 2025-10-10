# YAxisId Recharts Error Fix

## Issue
Recharts error when rendering EnhancedDataVisualizer:
```
Error: Invariant failed: Specifying a(n) yAxisId requires a corresponding yAxisId on the targeted graphical component Line
```

## Root Cause
The chart has two Y-axes defined:
- `yAxisId="actual"` (left axis) - for actual data
- `yAxisId="forecast"` (right axis) - for forecast data

However, the moving average and trend lines were missing the `yAxisId` prop, causing Recharts to fail validation.

## Fix Applied

### Moving Average Line
```typescript
// BEFORE (missing yAxisId)
<Line 
  type="monotone" 
  dataKey="movingAverage" 
  stroke="#82ca9d" 
  strokeWidth={1}
  strokeDasharray="5 5"
  dot={false}
  name="7-day Moving Avg"
/>

// AFTER (with yAxisId)
<Line 
  yAxisId="actual"
  type="monotone" 
  dataKey="movingAverage" 
  stroke="#82ca9d" 
  strokeWidth={1}
  strokeDasharray="5 5"
  dot={false}
  name="7-day Moving Avg"
/>
```

### Trend Line
```typescript
// BEFORE (missing yAxisId)
<Line 
  type="linear" 
  dataKey="trend" 
  stroke="#ffc658" 
  strokeWidth={1}
  dot={false}
  name="Linear Trend"
/>

// AFTER (with yAxisId)
<Line 
  yAxisId="actual"
  type="linear" 
  dataKey="trend" 
  stroke="#ffc658" 
  strokeWidth={1}
  dot={false}
  name="Linear Trend"
/>
```

## Why This Matters

When a Recharts chart has multiple Y-axes, **every** graphical component (Line, Area, Bar, etc.) must specify which Y-axis it belongs to using the `yAxisId` prop.

### Chart Structure
```
ComposedChart
├── YAxis (yAxisId="actual") - Left axis
├── YAxis (yAxisId="forecast") - Right axis
├── Line (yAxisId="actual") - Actual data ✅
├── Line (yAxisId="forecast") - Forecast data ✅
├── Line (yAxisId="actual") - Moving average ✅ (FIXED)
└── Line (yAxisId="actual") - Trend line ✅ (FIXED)
```

## File Modified
- `src/components/dashboard/enhanced-data-visualizer.tsx` (lines 349 and 361)

## Testing
✅ No TypeScript errors
✅ Chart renders without Recharts errors
✅ Moving average line displays correctly
✅ Trend line displays correctly
✅ Both lines use the left (actual) Y-axis scale

## Recharts Best Practice

When using multiple Y-axes:
1. Define each YAxis with a unique `yAxisId`
2. **Every** graphical component must have a `yAxisId` prop
3. The `yAxisId` must match one of the defined YAxis components

```typescript
// ✅ CORRECT
<YAxis yAxisId="left" />
<YAxis yAxisId="right" orientation="right" />
<Line yAxisId="left" dataKey="data1" />
<Line yAxisId="right" dataKey="data2" />

// ❌ INCORRECT - Missing yAxisId on Line
<YAxis yAxisId="left" />
<YAxis yAxisId="right" orientation="right" />
<Line dataKey="data1" /> // ERROR!
<Line yAxisId="right" dataKey="data2" />
```

## Impact
- Fixes runtime error in data visualization
- Ensures proper scaling of moving average and trend lines
- Maintains consistency with other chart components
