# Hallucination Prevention Engine - Quick Start Guide

## Installation

The engine is already implemented in `src/lib/hallucination-prevention.ts`. No installation needed.

## Basic Usage

### 1. Import the Engine

```typescript
import { createHallucinationPreventionEngine } from '@/lib/hallucination-prevention';
```

### 2. Create an Instance

```typescript
const engine = createHallucinationPreventionEngine();
```

### 3. Validate a Response

```typescript
const validation = engine.validateResponse(
  agentResponse,
  userContext,
  uploadedData
);

if (validation.isValid) {
  // Response is good to go
  console.log(`Confidence: ${validation.confidence}`);
} else {
  // Handle validation issues
  console.log(`Issues found: ${validation.issues.length}`);
}
```

## Common Patterns

### Pattern 1: Validate Before Display

```typescript
import { 
  createHallucinationPreventionEngine,
  addUncertaintyIndicators 
} from '@/lib/hallucination-prevention';

const engine = createHallucinationPreventionEngine();

function displayAgentResponse(response: string, context: UserContext, data: WeeklyData[]) {
  // Validate
  const validation = engine.validateResponse(response, context, data);
  
  if (validation.isValid) {
    // Add uncertainty indicators based on confidence
    const enhanced = addUncertaintyIndicators(response, validation.confidence);
    return enhanced;
  } else {
    // Get alternatives
    const alternatives = engine.suggestAlternatives(response, context);
    return alternatives[0];
  }
}
```

### Pattern 2: Check Specific Claims

```typescript
function verifyClaim(claim: string, data: WeeklyData[]) {
  const check = engine.checkGrounding(claim, data);
  
  if (check.isGrounded) {
    console.log(`✓ Claim verified (confidence: ${check.confidence})`);
    console.log(`Sources: ${check.sources.length}`);
  } else {
    console.log(`✗ Claim not verified`);
    console.log(`Uncertainties: ${check.uncertainties.join(', ')}`);
  }
}
```

### Pattern 3: Quantify Analysis Uncertainty

```typescript
function analyzeWithUncertainty(analysisResult: AnalysisResult) {
  const metrics = engine.quantifyUncertainty(analysisResult);
  
  console.log(`Overall Confidence: ${(metrics.overallConfidence * 100).toFixed(1)}%`);
  console.log(`Data Quality: ${(metrics.dataQualityScore * 100).toFixed(1)}%`);
  console.log(`Model Reliability: ${(metrics.modelReliability * 100).toFixed(1)}%`);
  
  if (metrics.uncertaintyFactors.length > 0) {
    console.log('\nUncertainty Factors:');
    metrics.uncertaintyFactors.forEach(factor => {
      console.log(`- ${factor.factor} (${factor.impact} impact)`);
    });
  }
  
  return metrics;
}
```

## Integration with Existing Code

### With Agent Orchestrator

```typescript
// In src/ai/enhanced-agent-orchestrator.ts
import { createHallucinationPreventionEngine } from '@/lib/hallucination-prevention';

class EnhancedAgentOrchestrator {
  private hallucinationEngine = createHallucinationPreventionEngine();

  async processResponse(response: string, context: UserContext, data: WeeklyData[]) {
    const validation = this.hallucinationEngine.validateResponse(
      response,
      context,
      data
    );

    if (!validation.isValid) {
      const alternatives = this.hallucinationEngine.suggestAlternatives(
        response,
        context
      );
      return alternatives[0];
    }

    return addUncertaintyIndicators(response, validation.confidence);
  }
}
```

### With Chat Panel

```typescript
// In src/components/dashboard/chat-panel.tsx
import { 
  createHallucinationPreventionEngine,
  addUncertaintyIndicators 
} from '@/lib/hallucination-prevention';

function ChatPanel() {
  const engine = createHallucinationPreventionEngine();

  const handleAgentMessage = (message: string) => {
    const validation = engine.validateResponse(
      message,
      userContext,
      uploadedData
    );

    if (validation.isValid) {
      const enhanced = addUncertaintyIndicators(message, validation.confidence);
      addMessage({ role: 'assistant', content: enhanced });
    } else {
      const alternatives = engine.suggestAlternatives(message, userContext);
      addMessage({ role: 'assistant', content: alternatives[0] });
    }
  };
}
```

## Utility Functions

### Add Uncertainty Indicators

```typescript
import { addUncertaintyIndicators } from '@/lib/hallucination-prevention';

const response = 'The trend is increasing';
const confidence = 0.75;

const enhanced = addUncertaintyIndicators(response, confidence);
// Output: "The trend is increasing\n\n*Note: This analysis is based on available data with moderate confidence (75%).*"
```

### Format Validation Issues

```typescript
import { formatValidationIssues } from '@/lib/hallucination-prevention';

const formatted = formatValidationIssues(validation);
console.log(formatted);
// Displays formatted issues with severity and suggestions
```

## Configuration

### Confidence Levels

- **High (≥ 0.9)**: No uncertainty indicators
- **Moderate (0.7 - 0.9)**: Moderate confidence note
- **Low (0.5 - 0.7)**: Limited confidence warning
- **Very Low (< 0.5)**: Insufficient data warning

### Thresholds

```typescript
// Default thresholds (in the engine)
CONFIDENCE_THRESHOLD = 0.7  // Minimum for valid response
MIN_DATA_POINTS = 10        // Minimum data points for analysis
```

## Common Scenarios

### Scenario 1: No Data Available

```typescript
const context = { sessionId: 'test' }; // No data
const alternatives = engine.suggestAlternatives(response, context);
// Returns: "I don't have sufficient data to provide a detailed analysis..."
```

### Scenario 2: Insufficient Data

```typescript
const limitedData = data.slice(0, 5); // Only 5 points
const validation = engine.validateResponse(response, context, limitedData);
// validation.confidence will be low
// validation.issues will include insufficient data warning
```

### Scenario 3: Speculative Response

```typescript
const response = 'I guess the data might possibly show some trends';
const validation = engine.validateResponse(response, context, data);
// validation.issues will include speculative_content warnings
```

### Scenario 4: Ungrounded Claims

```typescript
const response = 'The forecast shows 500% growth';
const validation = engine.validateResponse(response, context, data);
// validation.issues will include ungrounded_claim errors
```

## Best Practices

### ✅ DO

1. Always validate responses before displaying to users
2. Provide context with all available data
3. Add uncertainty indicators based on confidence
4. Handle validation issues gracefully
5. Use alternatives when validation fails

### ❌ DON'T

1. Display responses without validation
2. Ignore low confidence scores
3. Skip uncertainty indicators
4. Provide context without data
5. Make claims without data support

## Troubleshooting

### Issue: All responses marked as invalid

**Cause**: Missing data in context
**Solution**: Ensure `context.uploadedData` is populated

```typescript
const context = {
  sessionId: 'test',
  uploadedData: data, // ← Make sure this is included
};
```

### Issue: Low confidence scores

**Cause**: Insufficient data points
**Solution**: Ensure at least 10 data points

```typescript
if (data.length < 10) {
  console.warn('Insufficient data for reliable analysis');
}
```

### Issue: False positive claim detection

**Cause**: Overly broad claim patterns
**Solution**: Use more specific language in responses

```typescript
// Instead of: "The data might show trends"
// Use: "The data shows an increasing trend with 85% confidence"
```

## Examples

See `src/lib/hallucination-prevention-example.ts` for complete working examples:

1. Basic validation
2. Claim grounding
3. Uncertainty quantification
4. Alternative suggestions
5. Complete workflow
6. Agent integration

## API Reference

For detailed API documentation, see `src/lib/hallucination-prevention.md`.

## Testing

Run tests (when test framework is configured):

```bash
npm test -- src/lib/__tests__/hallucination-prevention.test.ts
```

## Support

- **Documentation**: `src/lib/hallucination-prevention.md`
- **Examples**: `src/lib/hallucination-prevention-example.ts`
- **Tests**: `src/lib/__tests__/hallucination-prevention.test.ts`
- **Design**: `.kiro/specs/chatbot-enhancement/design.md`
