/**
 * Example usage of the Hallucination Prevention Engine
 * 
 * This file demonstrates how to use the hallucination prevention system
 * to validate agent responses and ensure they are grounded in actual data.
 */

import {
  createHallucinationPreventionEngine,
  addUncertaintyIndicators,
  formatValidationIssues,
  type UserContext,
  type AnalysisResult,
} from './hallucination-prevention';
import type { WeeklyData } from './types';

// ============================================================================
// Example 1: Validating Agent Responses
// ============================================================================

export function exampleValidateAgentResponse() {
  const engine = createHallucinationPreventionEngine();

  // Sample data
  const data: WeeklyData[] = [
    { Date: new Date('2024-01-01'), Value: 100, Orders: 50, CreatedDate: new Date() },
    { Date: new Date('2024-01-08'), Value: 105, Orders: 52, CreatedDate: new Date() },
    { Date: new Date('2024-01-15'), Value: 110, Orders: 55, CreatedDate: new Date() },
    { Date: new Date('2024-01-22'), Value: 115, Orders: 58, CreatedDate: new Date() },
    { Date: new Date('2024-01-29'), Value: 120, Orders: 60, CreatedDate: new Date() },
  ];

  const context: UserContext = {
    sessionId: 'example-session',
    uploadedData: data,
  };

  // Agent response to validate
  const agentResponse = 'The data shows an increasing trend with values ranging from 100 to 120. The average value is approximately 110.';

  // Validate the response
  const validation = engine.validateResponse(agentResponse, context, data);

  console.log('Validation Result:', {
    isValid: validation.isValid,
    confidence: validation.confidence,
    groundedClaims: validation.groundedClaims,
    totalClaims: validation.totalClaims,
    issues: validation.issues.length,
  });

  // Add uncertainty indicators if needed
  const enhancedResponse = addUncertaintyIndicators(agentResponse, validation.confidence);
  console.log('Enhanced Response:', enhancedResponse);

  return validation;
}

// ============================================================================
// Example 2: Checking Claim Grounding
// ============================================================================

export function exampleCheckClaimGrounding() {
  const engine = createHallucinationPreventionEngine();

  const data: WeeklyData[] = Array.from({ length: 20 }, (_, i) => ({
    Date: new Date(2024, 0, i + 1),
    Value: 100 + i * 5,
    Orders: 50 + i * 2,
    CreatedDate: new Date(),
  }));

  // Check if a specific claim is grounded
  const claim = 'The average value is approximately 150';
  const check = engine.checkGrounding(claim, data);

  console.log('Grounding Check:', {
    isGrounded: check.isGrounded,
    confidence: check.confidence,
    sources: check.sources.length,
    uncertainties: check.uncertainties,
    recommendations: check.recommendations,
  });

  return check;
}

// ============================================================================
// Example 3: Quantifying Uncertainty
// ============================================================================

export function exampleQuantifyUncertainty() {
  const engine = createHallucinationPreventionEngine();

  // Analysis result from a forecasting model
  const analysisResult: AnalysisResult = {
    type: 'forecast',
    data: { predictions: [120, 125, 130] },
    confidence: 0.85,
    sources: [
      {
        type: 'historical_data',
        reference: 'Time series data from 2024',
        dataPoints: 20,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-05-20'),
        },
      },
    ],
    metadata: {
      confidenceIntervals: true,
      validationMetrics: {
        mape: 5.2,
        rmse: 8.5,
      },
    },
  };

  // Quantify uncertainty
  const metrics = engine.quantifyUncertainty(analysisResult);

  console.log('Uncertainty Metrics:', {
    overallConfidence: metrics.overallConfidence,
    dataQualityScore: metrics.dataQualityScore,
    modelReliability: metrics.modelReliability,
    uncertaintyFactors: metrics.uncertaintyFactors.length,
    recommendations: metrics.recommendations,
  });

  return metrics;
}

// ============================================================================
// Example 4: Suggesting Alternatives for Invalid Responses
// ============================================================================

export function exampleSuggestAlternatives() {
  const engine = createHallucinationPreventionEngine();

  // Context with no data
  const emptyContext: UserContext = {
    sessionId: 'example-session',
  };

  // Invalid response (no data to support it)
  const invalidResponse = 'The forecast shows a 50% increase in the next quarter.';

  // Get alternative suggestions
  const alternatives = engine.suggestAlternatives(invalidResponse, emptyContext);

  console.log('Alternative Suggestions:');
  alternatives.forEach((alt, index) => {
    console.log(`${index + 1}. ${alt}`);
  });

  return alternatives;
}

// ============================================================================
// Example 5: Complete Workflow
// ============================================================================

export function exampleCompleteWorkflow() {
  const engine = createHallucinationPreventionEngine();

  // Simulate uploaded data
  const data: WeeklyData[] = Array.from({ length: 15 }, (_, i) => ({
    Date: new Date(2024, 0, i + 1),
    Value: 100 + i * 3 + Math.random() * 10,
    Orders: 50 + i,
    CreatedDate: new Date(),
  }));

  const context: UserContext = {
    sessionId: 'workflow-example',
    uploadedData: data,
  };

  // Step 1: Agent generates a response
  const agentResponse = `Based on the data analysis:
  - The average value is approximately 130
  - There is a clear increasing trend
  - The data shows consistent growth over the period
  - We can expect this trend to continue`;

  console.log('Original Response:', agentResponse);

  // Step 2: Validate the response
  const validation = engine.validateResponse(agentResponse, context, data);

  console.log('\nValidation Results:');
  console.log(`- Valid: ${validation.isValid}`);
  console.log(`- Confidence: ${(validation.confidence * 100).toFixed(1)}%`);
  console.log(`- Grounded Claims: ${validation.groundedClaims}/${validation.totalClaims}`);

  // Step 3: Handle validation issues
  if (!validation.isValid) {
    console.log('\nValidation Issues:');
    const issuesSummary = formatValidationIssues(validation);
    console.log(issuesSummary);

    // Get alternative suggestions
    const alternatives = engine.suggestAlternatives(agentResponse, context);
    console.log('\nSuggested Alternatives:');
    alternatives.forEach((alt, i) => console.log(`${i + 1}. ${alt}`));
  }

  // Step 4: Add uncertainty indicators
  const finalResponse = addUncertaintyIndicators(agentResponse, validation.confidence);
  console.log('\nFinal Response with Uncertainty Indicators:');
  console.log(finalResponse);

  return {
    validation,
    finalResponse,
  };
}

// ============================================================================
// Example 6: Integration with Agent Orchestrator
// ============================================================================

export function exampleAgentIntegration() {
  const engine = createHallucinationPreventionEngine();

  // Simulated agent response
  const agentResponse = {
    content: 'The forecast indicates a 25% growth in the next quarter based on historical trends.',
    agentType: 'forecasting',
    confidence: 0.8,
  };

  const data: WeeklyData[] = Array.from({ length: 30 }, (_, i) => ({
    Date: new Date(2024, 0, i + 1),
    Value: 100 + i * 2,
    Orders: 50 + i,
    CreatedDate: new Date(),
  }));

  const context: UserContext = {
    sessionId: 'agent-integration',
    uploadedData: data,
  };

  // Validate before sending to user
  const validation = engine.validateResponse(agentResponse.content, context, data);

  if (validation.isValid) {
    // Response is valid, add uncertainty indicators based on confidence
    const enhancedContent = addUncertaintyIndicators(
      agentResponse.content,
      validation.confidence
    );

    return {
      ...agentResponse,
      content: enhancedContent,
      validationPassed: true,
      confidence: validation.confidence,
    };
  } else {
    // Response is invalid, suggest alternatives
    const alternatives = engine.suggestAlternatives(agentResponse.content, context);

    return {
      ...agentResponse,
      content: alternatives[0] || 'I need more information to provide an accurate analysis.',
      validationPassed: false,
      confidence: validation.confidence,
      issues: validation.issues,
    };
  }
}

// ============================================================================
// Run Examples (for testing)
// ============================================================================

if (require.main === module) {
  console.log('=== Example 1: Validate Agent Response ===');
  exampleValidateAgentResponse();

  console.log('\n=== Example 2: Check Claim Grounding ===');
  exampleCheckClaimGrounding();

  console.log('\n=== Example 3: Quantify Uncertainty ===');
  exampleQuantifyUncertainty();

  console.log('\n=== Example 4: Suggest Alternatives ===');
  exampleSuggestAlternatives();

  console.log('\n=== Example 5: Complete Workflow ===');
  exampleCompleteWorkflow();

  console.log('\n=== Example 6: Agent Integration ===');
  console.log(exampleAgentIntegration());
}
