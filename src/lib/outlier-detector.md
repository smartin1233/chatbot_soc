# Outlier Detector Module

## Overview

The Outlier Detector is a dedicated module for detecting and analyzing outliers in time series data. It activates only on explicit user requests containing specific keywords and provides comprehensive outlier analysis with visualization data and preprocessing suggestions.

## Features

### 1. Activation Trigger Detection
The module automatically detects when outlier analysis is requested through keywords:
- "quality check"
- "anomalies" / "anomaly"
- "outliers" / "outlier"
- "unusual values"
- "data issues"
- "data quality"
- "bad data"
- "suspicious values"
- "extreme values"

### 2. Multiple Detection Methods

#### IQR (Interquartile Range)
- **Best for**: Normally distributed data with clear boundaries
- **How it works**: Uses Q1 - 1.5×IQR and Q3 + 1.5×IQR as thresholds
- **Sensitivity levels**:
  - Low: 3.0× multiplier (fewer outliers)
  - Medium: 1.5× multiplier (standard)
  - High: 1.0× multiplier (more outliers)

#### Z-Score
- **Best for**: Large datasets with normal distribution
- **How it works**: Identifies points with z-scores exceeding threshold
- **Sensitivity levels**:
  - Low: 3.5 threshold
  - Medium: 3.0 threshold (standard)
  - High: 2.5 threshold

#### Isolation Forest
- **Best for**: Complex, multi-dimensional patterns
- **How it works**: Measures isolation of data points
- **Sensitivity levels**:
  - Low: 0.7 threshold
  - Medium: 0.6 threshold
  - High: 0.5 threshold

### 3. Severity Classification

Outliers are classified into four severity levels:

- **Critical**: Z-score > 4 or extreme distance from threshold
  - Requires immediate investigation
  - Suggests removal or correction
  
- **High**: Z-score > 3 or significant distance
  - Needs review and potential correction
  - May require special handling
  
- **Medium**: Z-score > 2 or moderate distance
  - Should be monitored
  - Consider transformation or capping
  
- **Low**: Z-score < 2 or minor distance
  - Minor outlier
  - May be acceptable depending on context

### 4. Visualization Data

The module generates comprehensive visualization data including:
- Data points with outlier indices
- Upper and lower threshold boundaries
- Color coding by severity:
  - Low: Orange (#FFA500)
  - Medium: Dark Orange (#FF8C00)
  - High: Orange Red (#FF4500)
  - Critical: Crimson (#DC143C)
  - Normal: Blue (#3B82F6)

### 5. Preprocessing Suggestions

Based on outlier detection results, the module suggests appropriate preprocessing strategies:

#### Removal
- **When**: Outlier percentage < 5%
- **Pros**: Simple, eliminates problematic data, improves stability
- **Cons**: Data loss, reduced dataset size, may remove valid extremes
- **Applicability**: High for low outlier counts

#### Imputation
- **When**: Always available
- **Pros**: Preserves dataset size, maintains continuity, less aggressive
- **Cons**: May introduce artificial patterns, reduces variance
- **Applicability**: Medium to high

#### Capping (Winsorization)
- **When**: Critical or high severity outliers present
- **Pros**: Preserves all points, reduces extreme impact, maintains structure
- **Cons**: Distorts distribution, may hide signals, arbitrary thresholds
- **Applicability**: High for extreme outliers

#### Transformation
- **When**: Outlier percentage > 10%
- **Pros**: Preserves all data, normalizes distribution, reduces skewness
- **Cons**: Changes scale, complicates interpretation, requires inverse transform
- **Applicability**: Medium to high for many outliers

## Usage

### Basic Usage

```typescript
import { outlierDetector } from './outlier-detector';
import { DataPoint } from './statistical-analysis';

// Check if user query should trigger outlier detection
const userMessage = "Can you check for outliers?";
if (outlierDetector.shouldActivate(userMessage)) {
  // Detect outliers
  const result = outlierDetector.detect(data, {
    method: 'iqr',
    sensitivity: 'medium'
  });
  
  console.log(result.summary);
  console.log(`Found ${result.outliers.length} outliers`);
}
```

### Advanced Usage

```typescript
// Detect outliers with custom configuration
const config = {
  method: 'zscore' as const,
  sensitivity: 'high' as const,
  threshold: 2.5 // Optional custom threshold
};

const result = outlierDetector.detect(data, config);

// Access detailed outlier information
result.outliers.forEach(outlier => {
  console.log(`Outlier at index ${outlier.index}:`);
  console.log(`  Value: ${outlier.value}`);
  console.log(`  Severity: ${outlier.severity}`);
  console.log(`  Z-Score: ${outlier.zScore}`);
  console.log(`  Reason: ${outlier.reason}`);
  console.log(`  Action: ${outlier.suggestedAction}`);
});

// Get preprocessing suggestions
const suggestions = outlierDetector.suggestPreprocessing(result);
suggestions.forEach(suggestion => {
  console.log(`${suggestion.title} (${suggestion.applicability * 100}% applicable)`);
  console.log(`  Pros: ${suggestion.pros.join(', ')}`);
  console.log(`  Cons: ${suggestion.cons.join(', ')}`);
});

// Use visualization data for charting
const vizData = result.visualizationData;
// Pass vizData to your chart component
```

### Integration with Chat Panel

```typescript
// In chat panel message handler
async function handleUserMessage(message: string, data: DataPoint[]) {
  // Check if outlier detection should be triggered
  if (outlierDetector.shouldActivate(message)) {
    // Run outlier detection
    const result = outlierDetector.detect(data, {
      method: 'iqr',
      sensitivity: 'medium'
    });
    
    // Generate response
    const response = {
      content: result.summary,
      visualization: {
        data: result.visualizationData.dataPoints,
        outlierIndices: result.visualizationData.outlierIndices,
        showOutliers: true
      },
      suggestions: outlierDetector.suggestPreprocessing(result)
        .map(s => s.title)
    };
    
    return response;
  }
  
  // Handle other message types...
}
```

## API Reference

### OutlierDetector Class

#### Methods

##### `shouldActivate(userQuery: string): boolean`
Checks if the user query contains keywords that should trigger outlier detection.

**Parameters:**
- `userQuery`: The user's message

**Returns:** `true` if outlier detection should be activated

##### `detect(data: DataPoint[], config: OutlierConfig): OutlierDetectionResult`
Detects outliers in the provided data using the specified method.

**Parameters:**
- `data`: Array of data points to analyze
- `config`: Configuration object with method and sensitivity

**Returns:** Complete outlier detection result

##### `suggestPreprocessing(result: OutlierDetectionResult): PreprocessingSuggestion[]`
Generates preprocessing suggestions based on outlier detection results.

**Parameters:**
- `result`: The outlier detection result

**Returns:** Array of preprocessing suggestions sorted by applicability

### Types

#### OutlierConfig
```typescript
interface OutlierConfig {
  method: 'iqr' | 'zscore' | 'isolation_forest';
  threshold?: number;
  sensitivity?: 'low' | 'medium' | 'high';
}
```

#### OutlierDetectionResult
```typescript
interface OutlierDetectionResult {
  outliers: OutlierPoint[];
  method: OutlierMethod;
  threshold: number;
  visualizationData: OutlierVisualizationData;
  statistics: {
    totalPoints: number;
    outlierCount: number;
    outlierPercentage: number;
    severityBreakdown: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  summary: string;
}
```

#### OutlierPoint
```typescript
interface OutlierPoint {
  index: number;
  value: number;
  date: Date;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedAction: string;
  distanceFromThreshold: number;
}
```

#### PreprocessingSuggestion
```typescript
interface PreprocessingSuggestion {
  id: string;
  type: 'removal' | 'imputation' | 'transformation' | 'capping';
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  applicability: number; // 0-1 score
  implementation: {
    method: string;
    parameters: Record<string, any>;
    expectedOutcome: string;
  };
}
```

## Requirements Addressed

This module addresses the following requirements from the specification:

- **3.1**: Activates only on explicit user requests with specific keywords
- **3.2**: Provides visualizations highlighting detected outliers
- **3.3**: Clearly marks outliers with distinct colors/markers on charts
- **3.4**: Provides statistics about number and percentage of outliers
- **3.5**: Suggests preprocessing steps to handle outliers

## Testing

The module includes comprehensive unit tests covering:
- Activation trigger detection
- All three detection methods (IQR, Z-Score, Isolation Forest)
- Severity classification
- Visualization data generation
- Preprocessing suggestions
- Statistics calculation
- Edge cases (no outliers, all outliers, etc.)

Run tests with:
```bash
npm test -- src/lib/__tests__/outlier-detector.test.ts
```

## Best Practices

1. **Choose the right method**:
   - Use IQR for normally distributed data
   - Use Z-Score for large datasets
   - Use Isolation Forest for complex patterns

2. **Adjust sensitivity based on context**:
   - Use low sensitivity for conservative detection
   - Use high sensitivity when you want to catch all potential issues

3. **Review suggestions carefully**:
   - Consider the applicability score
   - Evaluate pros and cons for your specific use case
   - Test preprocessing impact before applying

4. **Combine with domain knowledge**:
   - Not all statistical outliers are errors
   - Some extreme values may be valid business events
   - Use severity levels to prioritize investigation

## Future Enhancements

Potential improvements for future versions:
- Additional detection methods (DBSCAN, LOF)
- Time series-specific outlier detection
- Automated preprocessing application
- Outlier explanation with business context
- Interactive outlier review interface
