# Testing Checklist - Forecasting Workflow Fix

## Pre-Testing Setup

### 1. Fix Port Issue
```bash
# Kill process on port 3001
kill -9 $(lsof -ti:3001) 2>/dev/null

# Start dev server
npm run dev
```

### 2. Open Application
```
http://localhost:3001
```

### 3. Prepare Test Data
- [ ] Have a Business Unit created
- [ ] Have a Line of Business selected
- [ ] Have time series data uploaded

---

## Test Suite

### ✅ Test 1: Form Appears
**Steps:**
1. Type in chat: `run forecast`
2. Press Enter

**Expected Results:**
- [ ] Model training form dialog opens
- [ ] Form shows all sections:
  - [ ] Model Selection (5 models listed)
  - [ ] Forecast Horizon (input + dropdown)
  - [ ] Confidence Intervals (4 badges)
  - [ ] Additional Features (2 checkboxes)
  - [ ] Feature Engineering (3 checkboxes)
  - [ ] Validation Method (dropdown + slider)
- [ ] Default values are pre-selected:
  - [ ] Prophet, XGBoost, LightGBM checked
  - [ ] 30 days
  - [ ] 80%, 90%, 95% selected
  - [ ] All features enabled

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 2: Form Validation
**Steps:**
1. Open form with `run forecast`
2. Uncheck all models
3. Click "Start Training"

**Expected Results:**
- [ ] Alert appears: "Please select at least one model"
- [ ] Form stays open
- [ ] No workflow starts

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 3: Configuration Confirmation
**Steps:**
1. Type: `generate forecast`
2. In form, select:
   - Models: Prophet, XGBoost only
   - Horizon: 60 days
   - Confidence: 95% only
3. Click "Start Training"

**Expected Results:**
- [ ] Form closes
- [ ] Chat shows confirmation message with:
  - [ ] "Models: Prophet, XGBoost"
  - [ ] "Forecast Horizon: 60 days"
  - [ ] "Confidence Levels: 95%"
  - [ ] "🚀 Starting 6-agent forecasting workflow..."

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 4: Workflow Steps Appear
**Steps:**
1. After submitting form
2. Open workflow drawer (if not auto-opened)

**Expected Results:**
- [ ] 6 workflow steps visible:
  1. [ ] Data Analysis (EDA)
  2. [ ] Data Preprocessing
  3. [ ] Model Training
  4. [ ] Model Testing & Evaluation
  5. [ ] Generate Forecast
  6. [ ] Dashboard Generation
- [ ] Each step shows:
  - [ ] Name
  - [ ] Details
  - [ ] Agent name
  - [ ] Estimated time

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 5: Workflow Execution
**Steps:**
1. Watch workflow execute
2. Observe step status changes

**Expected Results:**
- [ ] Steps execute in order (1 → 2 → 3 → 4 → 5 → 6)
- [ ] Each step goes through states:
  - [ ] Pending (⏸️)
  - [ ] Active (⏳)
  - [ ] Completed (✅)
- [ ] Thinking steps show:
  - [ ] "🚀 Initializing 6-agent sequential workflow..."
  - [ ] "[Agent] working..." for each agent
  - [ ] "✅ [Agent] complete" for each agent
  - [ ] "✅ 6-agent workflow completed successfully!"

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 6: Comprehensive Report
**Steps:**
1. Wait for workflow to complete
2. Read the final chat message

**Expected Results:**
- [ ] Message contains 6 sections:
  1. [ ] Step 1: Exploratory Data Analysis
  2. [ ] Step 2: Data Preprocessing
  3. [ ] Step 3: Model Training
  4. [ ] Step 4: Model Validation
  5. [ ] Step 5: Forecast Generation
  6. [ ] Step 6: Strategic Business Intelligence
- [ ] Each section has:
  - [ ] Title with emoji
  - [ ] Relevant metrics
  - [ ] Business context (BU/LOB names)
  - [ ] Actionable insights
- [ ] No hallucinations or impossible values
- [ ] Data flows logically between sections

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 7: Configuration Applied
**Steps:**
1. Review Step 3 (Model Training) in report
2. Review Step 5 (Forecast Generation) in report

**Expected Results:**
- [ ] Step 3 mentions the models you selected
  - Example: "Models trained: Prophet, XGBoost"
- [ ] Step 5 mentions your forecast horizon
  - Example: "60-Day Forecast for [LOB]"
- [ ] Step 5 mentions your confidence levels
  - Example: "95% Confidence: [range]"

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 8: Error Handling (No Data)
**Steps:**
1. Select a LOB with no data uploaded
2. Type: `run forecast`
3. Submit form

**Expected Results:**
- [ ] Error message appears:
  - [ ] "No data available for forecasting"
  - [ ] Suggestion to upload data first
- [ ] Workflow stops gracefully
- [ ] No crash or blank screen

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 9: Multiple Runs
**Steps:**
1. Run forecast with config A
2. Wait for completion
3. Run forecast again with config B
4. Compare results

**Expected Results:**
- [ ] Both workflows complete successfully
- [ ] Each uses its own configuration
- [ ] Results are different (if configs differ)
- [ ] No interference between runs
- [ ] Chat history shows both reports

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 10: Form Cancel
**Steps:**
1. Type: `run forecast`
2. Form opens
3. Click "Cancel"

**Expected Results:**
- [ ] Form closes
- [ ] No workflow starts
- [ ] No error messages
- [ ] Can type new message

**Status:** ⬜ Pass / ⬜ Fail

---

## Advanced Tests

### ✅ Test 11: All Models Selected
**Steps:**
1. Select all 5 models
2. Submit form

**Expected Results:**
- [ ] Step 3 mentions all 5 models
- [ ] Workflow completes successfully
- [ ] Report shows best model selected

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 12: Different Time Units
**Steps:**
1. Test with "30 days"
2. Test with "4 weeks"
3. Test with "1 months"

**Expected Results:**
- [ ] Each configuration works
- [ ] Forecast horizon reflects choice
- [ ] Results are reasonable

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 13: Feature Engineering Impact
**Steps:**
1. Run with all features enabled
2. Run with all features disabled
3. Compare results

**Expected Results:**
- [ ] Both complete successfully
- [ ] Step 2 (Preprocessing) reflects choices
- [ ] Results may differ slightly

**Status:** ⬜ Pass / ⬜ Fail

---

## Performance Tests

### ✅ Test 14: Execution Time
**Steps:**
1. Note start time
2. Run forecast
3. Note end time

**Expected Results:**
- [ ] Total time: 3-5 minutes
- [ ] Step times roughly match estimates:
  - [ ] EDA: ~30s
  - [ ] Preprocessing: ~25s
  - [ ] Modeling: ~90s
  - [ ] Validation: ~30s
  - [ ] Forecasting: ~35s
  - [ ] Insights: ~15s

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 15: UI Responsiveness
**Steps:**
1. Start forecast workflow
2. Try to interact with UI

**Expected Results:**
- [ ] Can scroll chat
- [ ] Can open/close workflow drawer
- [ ] Can view previous messages
- [ ] Cannot send new messages (disabled)
- [ ] No UI freezing or lag

**Status:** ⬜ Pass / ⬜ Fail

---

## Regression Tests

### ✅ Test 16: Other Workflows Still Work
**Steps:**
1. Test: "explore data"
2. Test: "show outliers"
3. Test: "analyze trends"

**Expected Results:**
- [ ] All other workflows work normally
- [ ] No interference from forecast changes
- [ ] Form only appears for forecast requests

**Status:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 17: Forecast Questions (No Workflow)
**Steps:**
1. Type: "How reliable is this forecast?"
2. Type: "What confidence level should I use?"

**Expected Results:**
- [ ] Form does NOT appear
- [ ] Quick answer provided
- [ ] No workflow triggered
- [ ] Insights agent responds

**Status:** ⬜ Pass / ⬜ Fail

---

## Summary

### Test Results
- Total Tests: 17
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues Found
1. 
2. 
3. 

### Minor Issues Found
1. 
2. 
3. 

### Recommendations
1. 
2. 
3. 

---

## Sign-Off

**Tester:** _______________
**Date:** _______________
**Version:** _______________
**Status:** ⬜ Approved / ⬜ Needs Work

---

## Quick Test Commands

```bash
# Start server
npm run dev

# Test messages to try:
"run forecast"
"generate forecast"
"start forecast"
"create forecast"
"How reliable is this forecast?" (should NOT show form)
"explore data" (should NOT show form)
```

## Expected vs Actual

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Form appears | ✅ | | |
| 6 agents run | ✅ | | |
| Config applied | ✅ | | |
| No hallucinations | ✅ | | |
| Error handling | ✅ | | |
