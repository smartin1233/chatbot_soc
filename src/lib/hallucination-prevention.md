# Hallucination Prevention Engine

## Overview

The Hallucination Prevention Engine ensures that all chatbot responses are grounded in actual data and prevents speculative or incorrect information. It implements comprehensive validation, source verification, confidence thresholding, and uncertainty quantification.

## Requirements Addressed

- **6.1**: Only use information from verified data sources or trained models
- **6.2**: Explicitly state limitations when lacking sufficient information
- **6.3**: Include confidence levels and uncertainty indicators
- **6.4**: Present alternatives with clear reasoning when multiple interpretations exist
- **6.5**: Suggest alternative approaches or clarifying questions when unable to fulfill requests

## Key Features

### 1. Response Validation

Validates agent responses against actual data to ensure all claims are grounded:

```typescript
const engine = createHallucinationPreventionEngine();
const validation = engine.validateResponse(response, context, data);

if (validation.isValid) {
  // Response is grounded and reliable
  console.log(`Confidence: ${validation.confidence}`);
} else {
  // Response has issues
  console.log(`Issues: ${validation.issues.length}`);
}
```

### 2. Source Verification

Checks if specific claims are supported by available data:

```typescript
const claim = 'The average value is 150';
const check = engine.checkGrounding(claim, availableData);

if (check.isGrounded) {
  console.log(`Sources: ${check.sources.length}`);
} else {
  console.log(`Uncertainties: ${check.uncertainties}`);
}
```

### 3. Uncertainty Quantification

Quantifies uncertainty in analysis results:

```typescript
const analysisResult = {
  type: 'forecast',
  data: forecastData,
  confidence: 0.85,
  sources: dataSources,
};

const metrics = engine.quantifyUncertainty(analysisResult);
console.log(`Overall Confidence: ${metrics.overallConfidence}`);
console.log(`Uncertainty Factors: ${metrics.uncertaintyFactors.length}`);
```

### 4. Alternative Suggestions

Provides alternatives when responses are invalid:

```typescript
const alternatives = engine.suggestAlternatives(invalidResponse, context);
alternatives.forEach(alt => console.log(alt));
```

## API Reference

### HallucinationPreventionEngine

#### `validateResponse(response: string, context: UserContext, data: WeeklyData[]): ResponseValidation`

Validates a response against actual data and context.

**Parameters:**
- `response`: The agent's response text
- `context`: User context including session and data
- `data`: Available data points

**Returns:**
- `ResponseValidation` object with validation results

**Example:**
```typescript
const validation = engine.validateResponse(
  'The data shows an increasing trend',
  context,
  data
);
```

#### `checkGrounding(claim: string, availableData: WeeklyData[]): HallucinationCheck`

Checks if a specific claim is grounded in available data.

**Parameters:**
- `claim`: The claim to verify
- `availableData`: Data points to verify against

**Returns:**
- `HallucinationCheck` object with grounding results

**Example:**
```typescript
const check = engine.checkGrounding(
  'The average is 150',
  data
);
```

#### `quantifyUncertainty(analysis: AnalysisResult): UncertaintyMetrics`

Quantifies uncertainty in analysis results.

**Parameters:**
- `analysis`: Analysis result to evaluate

**Returns:**
- `UncertaintyMetrics` with confidence scores and factors

**Example:**
```typescript
const metrics = engine.quantifyUncertainty({
  type: 'forecast',
  data: results,
  confidence: 0.8,
  sources: [dataSource],
});
```

#### `suggestAlternatives(invalidResponse: string, context: UserContext): string[]`

Suggests alternatives when a response is invalid.

**Parameters:**
- `invalidResponse`: The invalid response
- `context`: User context

**Returns:**
- Array of alternative response suggestions

**Example:**
```typescript
const alternatives = engine.suggestAlternatives(
  'Speculative response',
  context
);
```

## Utility Functions

### `addUncertaintyIndicators(response: string, confidence: number): string`

Adds uncertainty indicators to a response based on confidence level.

**Confidence Levels:**
- **≥ 0.9**: No indicators added (high confidence)
- **0.7 - 0.9**: Moderate confidence note
- **0.5 - 0.7**: Limited confidence warning
- **< 0.5**: Insufficient data warning

**Example:**
```typescript
const enhanced = addUncertaintyIndicators(
  'The trend is increasing',
  0.75
);
// Output: "The trend is increasing\n\n*Note: This analysis is based on available data with moderate confidence (75%).*"
```

### `formatValidationIssues(validation: ResponseValidation): string`

Formats validation issues for display to users.

**Example:**
```typescript
const formatted = formatValidationIssues(validation);
console.log(formatted);
// Output:
// **Critical Issues:**
// - No data sources
//   *Suggestion: Add data*
```

## Type Definitions

### ResponseValidation

```typescript
interface ResponseValidation {
  isValid: boolean;
  issues: ValidationIssue[];
  corrections: string[];
  confidence: number;
  groundedClaims: number;
  totalClaims: number;
}
```

### HallucinationCheck

```typescript
interface HallucinationCheck {
  isGrounded: boolean;
  confidence: number;
  sources: DataSource[];
  uncertainties: string[];
  recommendations: string[];
}
```

### UncertaintyMetrics

```typescript
interface UncertaintyMetrics {
  overallConfidence: number;
  dataQualityScore: number;
  modelReliability: number;
  uncertaintyFactors: UncertaintyFactor[];
  recommendations: string[];
}
```

### ValidationIssue

```typescript
interface ValidationIssue {
  type: 'ungrounded_claim' | 'speculative_content' | 'missing_source' | 'contradictory_info' | 'low_confidence';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: string;
  suggestedFix?: string;
}
```

## Integration Examples

### With Agent Orchestrator

```typescript
import { createHallucinationPreventionEngine } from './hallucination-prevention';

class EnhancedAgentOrchestrator {
  private hallucinationEngine = createHallucinationPreventionEngine();

  async processAgentResponse(response: string, context: UserContext, data: WeeklyData[]) {
    // Validate response
    const validation = this.hallucinationEngine.validateResponse(
      response,
      context,
      data
    );

    if (!validation.isValid) {
      // Get alternatives
      const alternatives = this.hallucinationEngine.suggestAlternatives(
        response,
        context
      );
      return alternatives[0];
    }

    // Add uncertainty indicators
    return addUncertaintyIndicators(response, validation.confidence);
  }
}
```

### With Chat Panel

```typescript
import { createHallucinationPreventionEngine, addUncertaintyIndicators } from './hallucination-prevention';

function ChatPanel() {
  const engine = createHallucinationPreventionEngine();

  const handleAgentResponse = (response: string) => {
    const validation = engine.validateResponse(
      response,
      userContext,
      uploadedData
    );

    if (validation.isValid) {
      const enhanced = addUncertaintyIndicators(
        response,
        validation.confidence
      );
      displayMessage(enhanced);
    } else {
      const alternatives = engine.suggestAlternatives(response, userContext);
      displayMessage(alternatives[0]);
    }
  };
}
```

## Best Practices

### 1. Always Validate Before Display

```typescript
// ✅ Good
const validation = engine.validateResponse(response, context, data);
if (validation.isValid) {
  displayResponse(response);
}

// ❌ Bad
displayResponse(response); // No validation
```

### 2. Provide Context

```typescript
// ✅ Good
const context = {
  sessionId: 'session-123',
  uploadedData: data,
  forecastData: forecasts,
};

// ❌ Bad
const context = { sessionId: 'session-123' }; // Missing data
```

### 3. Handle Low Confidence

```typescript
// ✅ Good
if (validation.confidence < 0.7) {
  const alternatives = engine.suggestAlternatives(response, context);
  return alternatives[0];
}

// ❌ Bad
return response; // Ignore low confidence
```

### 4. Add Uncertainty Indicators

```typescript
// ✅ Good
const enhanced = addUncertaintyIndicators(response, validation.confidence);

// ❌ Bad
return response; // No uncertainty indicators
```

## Configuration

### Confidence Threshold

The default confidence threshold is 0.7. Responses with confidence below this are considered invalid.

```typescript
// In the engine class
private readonly CONFIDENCE_THRESHOLD = 0.7;
```

### Minimum Data Points

The minimum number of data points required for reliable analysis is 10.

```typescript
// In the engine class
private readonly MIN_DATA_POINTS = 10;
```

## Error Handling

The engine handles various error scenarios:

1. **Insufficient Data**: Returns low confidence with recommendations
2. **No Data Sources**: Flags as critical issue
3. **Speculative Language**: Detects and flags speculative content
4. **Ungrounded Claims**: Identifies claims not supported by data

## Performance Considerations

- **Claim Extraction**: O(n) where n is response length
- **Validation**: O(m) where m is number of claims
- **Statistical Calculations**: O(d) where d is data points
- **Memory**: Minimal, processes data in-place

## Testing

See `hallucination-prevention-example.ts` for comprehensive usage examples and `__tests__/hallucination-prevention.test.ts` for unit tests.

## Future Enhancements

1. **Machine Learning Integration**: Use ML models for claim verification
2. **External Knowledge Base**: Verify claims against external sources
3. **Multi-language Support**: Support for non-English responses
4. **Advanced Statistics**: More sophisticated statistical tests
5. **Caching**: Cache validation results for repeated claims

## Troubleshooting

### Issue: Low confidence scores

**Solution**: Ensure sufficient data points (minimum 10) and verify data quality.

### Issue: False positives in claim detection

**Solution**: Adjust claim patterns or use more specific language in responses.

### Issue: Missing sources

**Solution**: Ensure context includes all relevant data (uploadedData, forecastData, etc.).

## Support

For issues or questions, refer to:
- Example file: `hallucination-prevention-example.ts`
- Test file: `__tests__/hallucination-prevention.test.ts`
- Design document: `.kiro/specs/chatbot-enhancement/design.md`
