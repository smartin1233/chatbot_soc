/**
 * Example usage of the Outlier Detector module
 * 
 * This demonstrates how to use the outlier detection functionality
 * in the chatbot enhancement system.
 */

import { outlierDetector, OutlierConfig } from './outlier-detector';
import { DataPoint } from './statistical-analysis';

// Example 1: Check if user query should trigger outlier detection
export function checkUserQuery(userMessage: string): boolean {
  return outlierDetector.shouldActivate(userMessage);
}

// Example 2: Detect outliers using IQR method
export function detectOutliersIQR(data: DataPoint[]) {
  const config: OutlierConfig = {
    method: 'iqr',
    sensitivity: 'medium'
  };
  
  const result = outlierDetector.detect(data, config);
  
  console.log('Outlier Detection Results:');
  console.log(`- Total points: ${result.statistics.totalPoints}`);
  console.log(`- Outliers found: ${result.statistics.outlierCount}`);
  console.log(`- Percentage: ${result.statistics.outlierPercentage.toFixed(2)}%`);
  console.log(`- Summary: ${result.summary}`);
  
  return result;
}

// Example 3: Detect outliers using Z-Score method
export function detectOutliersZScore(data: DataPoint[]) {
  const config: OutlierConfig = {
    method: 'zscore',
    sensitivity: 'high' // More sensitive detection
  };
  
  const result = outlierDetector.detect(data, config);
  
  // Display outlier details
  result.outliers.forEach((outlier, index) => {
    console.log(`\nOutlier ${index + 1}:`);
    console.log(`  - Value: ${outlier.value}`);
    console.log(`  - Date: ${outlier.date.toISOString()}`);
    console.log(`  - Severity: ${outlier.severity}`);
    console.log(`  - Z-Score: ${outlier.zScore.toFixed(2)}`);
    console.log(`  - Reason: ${outlier.reason}`);
    console.log(`  - Suggested Action: ${outlier.suggestedAction}`);
  });
  
  return result;
}

// Example 4: Get preprocessing suggestions
export function getPreprocessingSuggestions(data: DataPoint[]) {
  const config: OutlierConfig = {
    method: 'iqr',
    sensitivity: 'medium'
  };
  
  const result = outlierDetector.detect(data, config);
  const suggestions = outlierDetector.suggestPreprocessing(result);
  
  console.log('\nPreprocessing Suggestions:');
  suggestions.forEach((suggestion, index) => {
    console.log(`\n${index + 1}. ${suggestion.title} (${suggestion.type})`);
    console.log(`   Applicability: ${(suggestion.applicability * 100).toFixed(0)}%`);
    console.log(`   Description: ${suggestion.description}`);
    console.log(`   Pros: ${suggestion.pros.join(', ')}`);
    console.log(`   Cons: ${suggestion.cons.join(', ')}`);
    console.log(`   Expected Outcome: ${suggestion.implementation.expectedOutcome}`);
  });
  
  return suggestions;
}

// Example 5: Use visualization data for charting
export function getVisualizationConfig(data: DataPoint[]) {
  const config: OutlierConfig = {
    method: 'iqr',
    sensitivity: 'medium'
  };
  
  const result = outlierDetector.detect(data, config);
  const vizData = result.visualizationData;
  
  // This data can be used to render charts with highlighted outliers
  return {
    dataPoints: vizData.dataPoints,
    outlierIndices: vizData.outlierIndices,
    colors: {
      normal: vizData.normalColor,
      outliers: vizData.highlightColors
    },
    thresholds: vizData.thresholds
  };
}

// Example 6: Complete workflow - from user query to suggestions
export function completeOutlierWorkflow(userMessage: string, data: DataPoint[]) {
  // Step 1: Check if outlier detection should be triggered
  if (!outlierDetector.shouldActivate(userMessage)) {
    console.log('Outlier detection not triggered for this query.');
    return null;
  }
  
  console.log('Outlier detection activated!');
  
  // Step 2: Detect outliers
  const config: OutlierConfig = {
    method: 'iqr',
    sensitivity: 'medium'
  };
  
  const result = outlierDetector.detect(data, config);
  
  // Step 3: Display results
  console.log(`\n${result.summary}`);
  
  // Step 4: Show severity breakdown
  console.log('\nSeverity Breakdown:');
  console.log(`  - Critical: ${result.statistics.severityBreakdown.critical}`);
  console.log(`  - High: ${result.statistics.severityBreakdown.high}`);
  console.log(`  - Medium: ${result.statistics.severityBreakdown.medium}`);
  console.log(`  - Low: ${result.statistics.severityBreakdown.low}`);
  
  // Step 5: Get preprocessing suggestions
  const suggestions = outlierDetector.suggestPreprocessing(result);
  
  console.log(`\nTop recommendation: ${suggestions[0].title}`);
  console.log(`Applicability: ${(suggestions[0].applicability * 100).toFixed(0)}%`);
  
  return {
    result,
    suggestions,
    visualizationData: result.visualizationData
  };
}

// Example usage with sample data
export function runExample() {
  // Create sample data with outliers
  const sampleData: DataPoint[] = [
    { date: new Date('2024-01-01'), value: 100, orders: 50 },
    { date: new Date('2024-01-02'), value: 105, orders: 52 },
    { date: new Date('2024-01-03'), value: 102, orders: 51 },
    { date: new Date('2024-01-04'), value: 500, orders: 250 }, // Outlier
    { date: new Date('2024-01-05'), value: 103, orders: 51 },
    { date: new Date('2024-01-06'), value: 101, orders: 50 },
    { date: new Date('2024-01-07'), value: 104, orders: 52 },
    { date: new Date('2024-01-08'), value: 5, orders: 2 },    // Outlier
    { date: new Date('2024-01-09'), value: 102, orders: 51 },
    { date: new Date('2024-01-10'), value: 103, orders: 51 }
  ];
  
  // Test different user queries
  const queries = [
    'Can you check for outliers?',
    'Show me data quality issues',
    'Are there any anomalies?',
    'Describe the data' // Should not trigger
  ];
  
  queries.forEach(query => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log('='.repeat(60));
    
    const shouldActivate = outlierDetector.shouldActivate(query);
    console.log(`Should activate: ${shouldActivate}`);
    
    if (shouldActivate) {
      completeOutlierWorkflow(query, sampleData);
    }
  });
}

// Uncomment to run the example
// runExample();
