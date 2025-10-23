# Agentic Onboarding Chatbot Enhancement Plan

## Objective
Transform the onboarding workflow for Business Units (BUs) and Lines of Business (LOBs) into a fully dynamic, agentic, and user-friendly experience, covering:
- Dynamic, stepwise onboarding (BU/LOB creation, data upload, demo/mock data, analysis, dashboard, chart, insights)
- Agentic, context-aware guidance and non-generic responses at every step
- Seamless integration of mock data (5 years: date, value, orders) for demo/analysis if real data is not uploaded
- Enhanced progress tracking and user feedback throughout onboarding

## Enhancement Steps

- [x] Analyze requirements from design_1.md and current code
- [x] Identify current dynamic/static areas in onboarding workflow (chat, data panel, BU/LOB selector)
- [ ] Design and implement a stepwise onboarding workflow with visible progress (e.g., Step 1: Create BU, Step 2: Add LOB, Step 3: Upload/Generate Data, Step 4: Analyze)
- [ ] Enhance onboarding agent logic to:
  - Dynamically adapt prompts, suggestions, and next actions based on onboarding state
  - Offer to generate and use 5-year mock data (date, value, orders) if user skips upload
  - Clearly explain the use and limitations of mock/demo data
  - Provide context-aware, non-generic, business-focused guidance at each step
- [ ] Integrate onboarding progress and state into chat panel, data panel, and BU/LOB selector
- [ ] Ensure all dashboard, chart, and insight creation is fully dynamic and data-driven (real or mock)
- [ ] Test the improved onboarding workflow with both real and mock data
- [ ] Finalize, optimize, and verify results

## Mock Data Structure

- 5 years of weekly data (approx. 260 points)
- Columns: Date, Value (units), Orders (units)
- Value and Orders generated with trend, seasonality, and randomness

## Key UX/Agentic Features

- Stepwise onboarding progress indicator (UI and chat)
- Dynamic agentic prompts and suggestions at each step
- Option to use/generate mock data for demo/analysis
- Contextual explanations and next actions (never generic)
- Seamless transition from onboarding to full analysis/dashboarding
