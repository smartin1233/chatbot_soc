# Follow-Up Questions Fix

## Problem

When users asked about "model training" or "train model" for forecasting, the wrong form appeared showing generic modeling questions like:
- "What type of model would you like to build?" (Forecasting/Classification/Regression/Anomaly detection)
- "What's most important for your model?" (Accuracy/Speed/Explainability)
- "How should I validate the model performance?"
- "Should I create additional features from your data?"

These questions are too generic and not forecasting-specific.

## Root Cause

The `follow-up-questions.ts` service was intercepting model training requests and showing a generic "modeling" questionnaire instead of letting the request go to the proper `ModelTrainingForm` component.

## Solution

**Separated concerns:**
1. **ModelTrainingForm** - Handles ALL forecasting and model training requests
2. **FollowUpQuestions** - Only handles data exploration and business insights

## Changes Made in `src/lib/follow-up-questions.ts`

### 1. Updated Detection Logic

**Before:**
```typescript
needsFollowUpQuestions(message: string, context?: any): boolean {
  // Would trigger for model training, forecasting, etc.
  const customizableScenarios = [
    /(train|build|create).*?(model|algorithm)/i,
    /(forecast|predict|prediction).*?(model|algorithm)/i,
    // ... etc
  ];
}
```

**After:**
```typescript
needsFollowUpQuestions(message: string, context?: any): boolean {
  // NEVER trigger for model training or forecast generation
  const usesModelTrainingForm = [
    /(run|start|generate|create)\s+(a\s+)?forecast/i,
    /(train|build).*?(model|ml|machine learning).*?(forecast|predict)/i,
    /(forecast|predict).*?(train|build).*?(model)/i,
    /model.*?training/i
  ];
  
  if (usesModelTrainingForm.some(pattern => pattern.test(message))) {
    return false; // Use ModelTrainingForm instead
  }
  
  // Only trigger for data exploration and business insights
  const customizableScenarios = [
    /(business|strategic).*?(insight|recommendation|analysis)/i,
    /(explore|eda).*?(approach|method|focus|type)/i,
  ];
}
```

### 2. Removed Forecasting/Modeling Detection

**Before:**
```typescript
private detectAnalysisType(message: string): string | null {
  if (/(forecast|predict).*?(days?|weeks?|months?)/i.test(message)) {
    return 'forecasting'; // ❌ Wrong - should use form
  }
  
  if (/(train|build|create).*?(model|algorithm)/i.test(message)) {
    return 'modeling'; // ❌ Wrong - should use form
  }
  
  if (/(complete|comprehensive|full).*?(analysis|workflow)/i.test(message)) {
    return 'complete_analysis'; // ❌ Wrong - should use form
  }
  
  // ... other cases
}
```

**After:**
```typescript
private detectAnalysisType(message: string): string | null {
  // NOTE: Forecasting and modeling use ModelTrainingForm, not follow-up questions
  
  if (/(business|strategic).*?(insight|recommendation)/i.test(message)) {
    return 'business_insights'; // ✅ Correct
  }
  
  if (/(explore|eda|analyze).*?(approach|method|focus)/i.test(message)) {
    return 'data_exploration'; // ✅ Correct
  }
  
  return null;
}
```

### 3. Removed Unused Question Sets

Deleted these methods (no longer needed):
- ❌ `generateForecastingQuestions()` - Use ModelTrainingForm
- ❌ `generateModelingQuestions()` - Use ModelTrainingForm
- ❌ `generateCompleteAnalysisQuestions()` - Use ModelTrainingForm
- ❌ `generateForecastingPrompt()` - Use ModelTrainingForm
- ❌ `generateModelingPrompt()` - Use ModelTrainingForm
- ❌ `generateCompleteAnalysisPrompt()` - Use ModelTrainingForm

Kept these methods (still valid):
- ✅ `generateExplorationQuestions()` - For data exploration
- ✅ `generateBusinessInsightsQuestions()` - For business insights
- ✅ `generateExplorationPrompt()` - For data exploration
- ✅ `generateBusinessInsightsPrompt()` - For business insights

## Request Routing

### Forecasting & Model Training → ModelTrainingForm
```
User: "run forecast"
User: "train model"
User: "generate forecast"
User: "build forecasting model"
User: "create ml model for prediction"

→ Shows ModelTrainingForm with:
  - Forecasting Models (Prophet, XGBoost, LightGBM, ARIMA, LSTM)
  - Forecast Time Period (how far into future)
  - Prediction Confidence Levels (80%, 90%, 95%, 99%)
  - External Regressors & Patterns (holidays, seasonality)
  - Advanced Feature Engineering (lag, rolling avg, trends)
  - Model Validation Strategy (cross-validation, holdout)
```

### Data Exploration → FollowUpQuestions
```
User: "explore data"
User: "analyze patterns"
User: "what's in my data"

→ Shows FollowUpQuestions with:
  - What aspects are you interested in? (quality, trends, outliers, etc.)
  - What time period to focus on?
  - What visualizations would help?
  - Any specific concerns?
```

### Business Insights → FollowUpQuestions
```
User: "give me business insights"
User: "strategic recommendations"
User: "what should I do"

→ Shows FollowUpQuestions with:
  - What type of insights? (growth, cost reduction, risks, etc.)
  - What's your business domain?
  - What level of recommendations? (strategic, tactical, detailed)
  - Consider competitive factors?
```

## Testing

### Test 1: Model Training Shows Form (Not Questions)
```
User: "train model"
Expected: ModelTrainingForm appears
Should NOT show: Generic modeling questions
```

### Test 2: Forecast Shows Form (Not Questions)
```
User: "run forecast"
Expected: ModelTrainingForm appears
Should NOT show: Forecasting questions
```

### Test 3: Data Exploration Shows Questions
```
User: "explore my data"
Expected: FollowUpQuestions appear
Questions about: exploration focus, time period, visualizations
```

### Test 4: Business Insights Shows Questions
```
User: "give me business insights"
Expected: FollowUpQuestions appear
Questions about: insight type, domain, action level
```

## Summary

✅ **Fixed:** Model training requests now go to ModelTrainingForm
✅ **Fixed:** Forecasting requests now go to ModelTrainingForm
✅ **Removed:** Generic modeling questions
✅ **Kept:** Data exploration questions (still valid)
✅ **Kept:** Business insights questions (still valid)
✅ **Clear separation:** Form for forecasting/modeling, Questions for exploration/insights

## Before vs After

### Before (Wrong)
```
User: "train model"
→ Shows generic questions:
  "What type of model?" (Forecasting/Classification/Regression)
  "What's most important?" (Accuracy/Speed/Explainability)
  "How to validate?" (Cross-validation/Holdout)
```

### After (Correct)
```
User: "train model"
→ Shows ModelTrainingForm:
  "Forecasting Models" (Prophet, XGBoost, LightGBM, ARIMA, LSTM)
  "Forecast Time Period" (How far into future?)
  "Prediction Confidence Levels" (80%, 90%, 95%, 99%)
  "External Regressors & Patterns" (Holidays, seasonality)
  "Advanced Feature Engineering" (Lag, rolling avg, trends)
  "Model Validation Strategy" (Cross-validation, holdout)
```

Much better! 🎉
