# Business Follow-Up Questions Feature

## Overview
After generating a forecast, users can now ask follow-up questions about business decisions, outcomes, comparisons, and what-if scenarios. The system intelligently routes these questions to a specialized Business Advisor agent that provides actionable, data-driven insights.

## Supported Question Types

### 1. Decision-Making Questions
**Examples:**
- "What decisions can I take from this forecast?"
- "What actions should I take based on these results?"
- "What are my options?"
- "How can I use this forecast?"

**Response Includes:**
- Specific, actionable decisions with timelines
- Cost estimates and resource requirements
- Expected outcomes and ROI
- Risk mitigation strategies

**Example Response:**
```
💼 Based on 12% growth forecast:

**Immediate Actions (Next 2 weeks):**
• Increase inventory by 10-15% to meet demand
  - Cost: $12K-$15K
  - Lead time: 2 weeks
  - Expected ROI: 18-22%

• Hire 2-3 additional staff for peak periods
  - Cost: $8K/month
  - Training time: 1 week
  - Capacity increase: 25%

**Strategic Decisions (1-3 months):**
• Negotiate bulk supplier contracts now
  - Potential savings: 5-8% ($6K-$10K)
  - Lock in prices before Q4 surge

• Expand marketing budget by $5K
  - Target high-demand weeks (weeks 3-5)
  - Expected conversion increase: 15-20%
```

### 2. Forecast vs Actual Comparison
**Examples:**
- "How accurate is the forecast?"
- "Compare forecast vs actual data"
- "What's the difference between forecast and actual?"
- "Is the forecast reliable?"

**Response Includes:**
- Accuracy metrics with specific percentages
- Gap analysis with explanations
- Reliability assessment
- Recommendations for adjustments

**Example Response:**
```
📊 Forecast vs Actual Analysis:

**Accuracy Assessment:**
• Overall accuracy: 94% (MAPE: 5.8%)
• Forecast predicted 15% growth, actual shows 12%
• Variance: 3% (within acceptable range)

**Pattern Analysis:**
• Model accurately captured weekly seasonality
• Slight underestimation in holiday periods (+8% adjustment needed)
• Weekend predictions: 96% accurate
• Weekday predictions: 92% accurate

**Reliability Score: 94/100**
✅ Safe for business planning and resource allocation
```

### 3. Business Outcomes & Impact
**Examples:**
- "What does this mean for my business?"
- "What are the business outcomes?"
- "How will this affect revenue?"
- "What's the business impact?"

**Response Includes:**
- Revenue and profit projections
- Market share opportunities
- Risk assessment
- ROI estimates

**Example Response:**
```
💰 Expected Business Outcomes:

**Financial Impact:**
• Revenue increase: $45K-$52K (based on forecast range)
• Profit margin improvement: 3-5%
• Cash flow impact: +$38K over forecast period

**Market Position:**
• Market share opportunity: 3-5% growth potential
• Competitive advantage: 2-week lead time over competitors
• Customer retention: Expected +12% from improved availability

**Risk Assessment:**
• Supply chain risk: Needs 2-week lead time buffer
• Capacity risk: Can handle up to 18% growth (current forecast: 12%)
• Financial risk: Low - positive cash flow throughout period

**ROI on Forecast-Driven Decisions:**
• Expected return: 15-20% improvement
• Payback period: 6-8 weeks
• Break-even point: Week 3 of implementation
```

### 4. What-If Scenarios
**Examples:**
- "What if demand increases 20%?"
- "What if we lose a major client?"
- "Suppose demand drops by 10%"
- "What happens if costs increase?"

**Response Includes:**
- Scenario analysis with specific numbers
- Alternative strategies
- Cost-benefit analysis
- Contingency recommendations

**Example Response:**
```
🔮 Scenario Analysis: Demand +20% (vs forecast +12%)

**Current Capacity Assessment:**
• Forecast capacity: Handles up to 18% growth
• Scenario demand: 20% growth
• Capacity gap: 6% shortfall (approximately 150 units/week)

**Impact Analysis:**
• Lost revenue opportunity: $8K-$12K
• Customer satisfaction risk: Medium-High
• Competitive risk: Customers may switch to competitors

**Recommended Actions:**

Option 1: Add Temporary Capacity
• Cost: +$8K operational costs
• Timeline: 2 weeks to implement
• Benefit: Capture full demand, maintain customer satisfaction
• ROI: 18-22%

Option 2: Prioritize High-Margin Products
• Cost: Minimal (reallocation only)
• Timeline: Immediate
• Benefit: Maintain profit despite volume constraints
• Trade-off: Some customer segments underserved

Option 3: Hybrid Approach (Recommended)
• Add 50% temporary capacity (+$4K)
• Prioritize top 70% margin products
• Result: Capture 85% of opportunity at 50% of cost
• ROI: 25-30%
```

### 5. Forecast Interpretation
**Examples:**
- "What does the forecast mean?"
- "Explain the forecast results"
- "Help me understand the forecast"

**Response Includes:**
- Plain-language explanation
- Key trends and patterns
- Business implications
- Next steps

## Technical Implementation

### 1. Business Question Router (`src/lib/business-question-router.ts`)

Routes questions to the appropriate agent based on pattern matching:

```typescript
const routing = businessQuestionRouter.route(userMessage, context);
// Returns: { agent: 'business_insights', hints: [...], requiresContext: [...] }
```

**Pattern Detection:**
- Decision questions: "what decisions", "what should I do", "my options"
- Comparison questions: "forecast vs actual", "how accurate", "compare"
- Outcome questions: "business impact", "what does this mean", "outcomes"
- Scenario questions: "what if", "suppose", "in case of"
- Interpretation: "explain forecast", "what does forecast mean"

### 2. Context Validation

Before answering, checks if required context is available:

```typescript
const contextCheck = businessQuestionRouter.hasRequiredContext(routing, context);
if (!contextCheck.sufficient) {
  // Show helpful message about what's missing
  return;
}
```

**Required Context:**
- `forecast_results`: Forecast has been generated
- `actual_data`: Historical data is available
- `business_unit`: BU is selected
- `lob`: LOB is selected

### 3. Business Insights Agent

Specialized agent with access to:
- Forecast results and metrics
- Actual historical data
- Business unit and LOB context
- Previous analysis results

**System Prompt Features:**
- Provides specific, measurable recommendations
- Includes costs, timelines, and expected outcomes
- Addresses risks and opportunities
- Uses actual data for calculations
- Avoids generic advice

### 4. Response Enhancement

Every business question response includes:
- Structured format with clear sections
- Bullet points with specific numbers
- Actionable recommendations
- Follow-up suggestions

**Suggested Next Steps:**
- "What if demand increases 20%?"
- "Compare forecast vs actual"
- "Show me business outcomes"
- "What decisions should I take?"
- "Run scenario analysis"
- "Visualize actual vs forecast"

## User Experience Flow

### Complete Flow Example

```
1. User generates forecast
   ↓
2. Forecast completes with suggestions
   Suggested Next Steps:
   • Visualize actual vs forecast
   • Generate business insights
   • What decisions can I take?
   ↓
3. User clicks "What decisions can I take?"
   ↓
4. System checks context (forecast ✓, data ✓)
   ↓
5. Routes to Business Advisor agent
   ↓
6. Agent analyzes forecast + actual data
   ↓
7. Provides specific, actionable decisions
   With costs, timelines, ROI
   ↓
8. Shows follow-up suggestions
   • What if demand increases 20%?
   • Compare forecast vs actual
   • Show business outcomes
   ↓
9. User asks follow-up: "What if demand increases 20%?"
   ↓
10. Agent runs scenario analysis
    Compares to forecast, shows gaps
    Provides 3 options with cost-benefit
    ↓
11. Continuous conversation continues...
```

### Missing Context Flow

```
1. User asks "What decisions can I take?"
   (No forecast generated yet)
   ↓
2. System detects missing context
   ↓
3. Shows helpful message:
   "To answer this question, I need forecast results.
   Please:
   • Generate a forecast first
   Then ask your question again!"
   ↓
4. Provides suggestions:
   • Generate forecast
   • Upload data
   • Help me get started
```

## Example Conversations

### Conversation 1: Decision Making

```
User: "Generate forecast"
[Forecast completes]

User: "What decisions can I take from this forecast?"