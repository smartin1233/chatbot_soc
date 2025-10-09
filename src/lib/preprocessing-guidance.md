# Data Preprocessing Guidance System

## Overview

The Data Preprocessing Guidance System provides intelligent, step-by-step guidance for cleaning and preparing data after outlier detection. It helps users make informed decisions about how to handle outliers and improve data quality.

## Features

- **Multiple Preprocessing Strategies**: Supports removal, imputation, transformation, and capping
- **Intelligent Suggestions**: Generates context-aware recommendations based on outlier characteristics
- **Workflow Builder**: Creates sequential preprocessing workflows
- **Impact Estimation**: Estimates the effect of preprocessing on data quality and forecast accuracy
- **Validation**: Validates preprocessing results and provides improvement metrics

## Usage

### 1. Generate Preprocessing Suggestions

```typescript
import { preprocessingGuidanceSystem } from './preprocessing-guidance';
import { outlierDetector } from './outlier-detector';

// First, detect outliers
const outlierResult = outlierDetector.detect(data, { method: 'iqr' });

// Generate preprocessing suggestions
const suggestions = preprocessingGuidanceSystem.generateSuggestions(
  outlierResult,
  data
);

// Suggestions are sorted by applicability score
console.log(suggestions[0].title); // Most applicable suggestion
console.log(suggestions[0].pros);  // Benefits
console.log(suggestions[0].cons);  // Drawbacks
```

### 2. Create a Preprocessing Workflow

```typescript
// Select suggestions to apply
const selectedSuggestions = [suggestions[0], suggestions[1]];

// Create workflow
const workflow = preprocessingGuidanceSystem.createWorkflow(
  selectedSuggestions,
  data,
  outlierResult
);

console.log(workflow.estimatedImpact.dataQualityImprovement); // Expected improvement %
console.log(workflow.estimatedImpact.recordsAffected);        // Number of records affected
```

### 3. Execute Preprocessing Steps

```typescript
// Execute each step in the workflow
for (const step of workflow.steps) {
  const result = preprocessingGuidanceSystem.executeStep(step, data);
  
  if (result.success) {
    console.log(`${step.description}: ${result.message}`);
    console.log(`Quality improvement: ${result.qualityImprovement}%`);
    
    // Use processed data for next step
    data = result.processedData;
  } else {
    console.error(`Failed: ${result.message}`);
  }
}
```

### 4. Validate Results

```typescript
// Validate the preprocessing results
const validation = preprocessingGuidanceSystem.validateResults(
  originalData,
  processedData
);

console.log(`Valid: ${validation.isValid}`);
console.log(`Outlier reduction: ${validation.improvements.outlierReduction}%`);
console.log(`Data quality score: ${validation.improvements.dataQualityScore}`);

// Check for concerns
if (validation.concerns.length > 0) {
  console.log('Concerns:', validation.concerns);
}

// Get recommendations
console.log('Recommendations:', validation.recommendations);
```

## Preprocessing Methods

### 1. Removal
- **When to use**: Outlier percentage < 5%
- **Effect**: Removes outlier data points completely
- **Best for**: Data errors, measurement mistakes

### 2. Imputation
- **When to use**: Moderate outlier counts
- **Effect**: Replaces outliers with interpolated values
- **Best for**: Missing or corrupted values in time series

### 3. Capping (Winsorization)
- **When to use**: Extreme outliers present
- **Effect**: Caps values at percentile thresholds
- **Best for**: Reducing impact while preserving all data points

### 4. Transformation
- **When to use**: Outlier percentage > 10%
- **Effect**: Applies mathematical transformation (log, sqrt, etc.)
- **Best for**: Skewed distributions, natural outliers

## Configuration

```typescript
import { PreprocessingGuidanceSystem } from './preprocessing-guidance';

const system = new PreprocessingGuidanceSystem({
  maxOutlierPercentageForRemoval: 5,  // Max % for removal suggestion
  minDataPointsRequired: 30,           // Minimum data points needed
  preferredMethods: ['capping', 'imputation', 'removal', 'transformation'],
  aggressiveness: 'moderate'           // 'conservative' | 'moderate' | 'aggressive'
});
```

## Integration with Chatbot

The preprocessing guidance system integrates with the chatbot workflow:

1. User asks about data quality or outliers
2. Outlier detection runs automatically
3. Preprocessing suggestions are generated
4. User selects preferred approach
5. System guides through implementation
6. Results are validated
7. Next steps are suggested

## Example: Complete Workflow

```typescript
// 1. Detect outliers
const outlierResult = outlierDetector.detect(data, { 
  method: 'iqr',
  sensitivity: 'medium'
});

// 2. Generate suggestions
const suggestions = preprocessingGuidanceSystem.generateSuggestions(
  outlierResult,
  data
);

// 3. Present to user (in chatbot)
// User selects: "Cap Extreme Values"

// 4. Create and execute workflow
const cappingSuggestion = suggestions.find(s => s.type === 'capping');
const workflow = preprocessingGuidanceSystem.createWorkflow(
  [cappingSuggestion],
  data,
  outlierResult
);

let processedData = data;
for (const step of workflow.steps) {
  const result = preprocessingGuidanceSystem.executeStep(step, processedData);
  processedData = result.processedData;
}

// 5. Validate and report
const validation = preprocessingGuidanceSystem.validateResults(data, processedData);

// 6. Suggest next steps
if (validation.improvements.dataQualityScore > 80) {
  console.log('Data is ready for forecasting!');
}
```

## Requirements Satisfied

This implementation satisfies all requirements from Requirement 4:

- ✅ 4.1: Provides actionable suggestions after outlier detection
- ✅ 4.2: Includes multiple preprocessing options (removal, imputation, transformation, capping)
- ✅ 4.3: Guides users through implementation steps
- ✅ 4.4: Offers to re-analyze data to verify improvements (via validateResults)
- ✅ 4.5: Suggests next logical workflow steps based on quality scores
