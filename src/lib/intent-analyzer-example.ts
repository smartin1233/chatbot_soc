/**
 * Example usage of Intent Analyzer
 * 
 * This file demonstrates how to use the IntentAnalyzer to classify user queries
 */

import { IntentAnalyzer, IntentType, UserContext } from './intent-analyzer';

// Example 1: Basic usage with data description query
function exampleDataDescription() {
  const analyzer = new IntentAnalyzer();
  
  const context: UserContext = {
    hasUploadedData: true,
    hasForecastResults: false,
    hasOutlierAnalysis: false,
    recentIntents: [],
  };
  
  const result = analyzer.analyze('Can you describe the data?', context);
  
  console.log('Query: "Can you describe the data?"');
  console.log('Intent Type:', result.type); // DATA_DESCRIPTION
  console.log('Confidence:', result.confidence);
  console.log('Requires Workflow:', result.requiresWorkflow); // false
  console.log('Target Agents:', result.targetAgents); // ['eda_agent']
  console.log('Contextual Hints:', result.contextualHints);
  console.log('---');
}

// Example 2: Forecasting execution with entity extraction
function exampleForecastingExecution() {
  const analyzer = new IntentAnalyzer();
  
  const context: UserContext = {
    hasUploadedData: true,
    hasForecastResults: false,
    hasOutlierAnalysis: false,
    recentIntents: [],
  };
  
  const result = analyzer.analyze('Forecast the next 6 months using Prophet', context);
  
  console.log('Query: "Forecast the next 6 months using Prophet"');
  console.log('Intent Type:', result.type); // FORECASTING_EXECUTION
  console.log('Confidence:', result.confidence);
  console.log('Requires Workflow:', result.requiresWorkflow); // true
  console.log('Target Agents:', result.targetAgents);
  console.log('Extracted Entities:', result.entities);
  console.log('---');
}

// Example 3: Forecasting analysis (no workflow trigger)
function exampleForecastingAnalysis() {
  const analyzer = new IntentAnalyzer();
  
  const context: UserContext = {
    hasUploadedData: true,
    hasForecastResults: true, // User already has forecast results
    hasOutlierAnalysis: false,
    recentIntents: [],
  };
  
  const result = analyzer.analyze('How reliable is this forecast?', context);
  
  console.log('Query: "How reliable is this forecast?"');
  console.log('Intent Type:', result.type); // FORECASTING_ANALYSIS
  console.log('Confidence:', result.confidence);
  console.log('Requires Workflow:', result.requiresWorkflow); // false - uses existing results
  console.log('Target Agents:', result.targetAgents); // ['bi_analyst_agent']
  console.log('Contextual Hints:', result.contextualHints); // ['use_existing_forecast_results', 'avoid_workflow_trigger']
  console.log('---');
}

// Example 4: Outlier detection
function exampleOutlierDetection() {
  const analyzer = new IntentAnalyzer();
  
  const context: UserContext = {
    hasUploadedData: true,
    hasForecastResults: false,
    hasOutlierAnalysis: false,
    recentIntents: [],
  };
  
  const result = analyzer.analyze('Check for outliers and anomalies', context);
  
  console.log('Query: "Check for outliers and anomalies"');
  console.log('Intent Type:', result.type); // OUTLIER_DETECTION
  console.log('Confidence:', result.confidence);
  console.log('Requires Workflow:', result.requiresWorkflow); // true
  console.log('Target Agents:', result.targetAgents); // ['eda_agent', 'preprocessing_agent']
  console.log('Contextual Hints:', result.contextualHints);
  console.log('---');
}

// Example 5: Context-aware preprocessing suggestion
function examplePreprocessing() {
  const analyzer = new IntentAnalyzer();
  
  const context: UserContext = {
    hasUploadedData: true,
    hasForecastResults: false,
    hasOutlierAnalysis: true, // User has already detected outliers
    recentIntents: [],
  };
  
  const result = analyzer.analyze('How should I clean the data?', context);
  
  console.log('Query: "How should I clean the data?"');
  console.log('Intent Type:', result.type); // PREPROCESSING
  console.log('Confidence:', result.confidence); // Higher due to context
  console.log('Requires Workflow:', result.requiresWorkflow); // true
  console.log('Target Agents:', result.targetAgents); // ['preprocessing_agent']
  console.log('Contextual Hints:', result.contextualHints);
  console.log('---');
}

// Run all examples
export function runExamples() {
  console.log('=== Intent Analyzer Examples ===\n');
  exampleDataDescription();
  exampleForecastingExecution();
  exampleForecastingAnalysis();
  exampleOutlierDetection();
  examplePreprocessing();
}

// Uncomment to run examples
// runExamples();
