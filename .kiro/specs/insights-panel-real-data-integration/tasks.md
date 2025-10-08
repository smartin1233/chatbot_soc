# Implementation Plan

- [x] 1. Update AppState to track analysis results and prevent duplicate requests
  - Add `analyzedData` object to AppState with fields for EDA, forecasting, insights, outliers, and forecast data
  - Add `queuedUserPrompt` field to AppState for queuing prompts from main page
  - Extend `ForecastMetrics` to include `isOptimal` flag and comparison metrics
  - Create `OutlierData` and `ForecastData` in types.ts
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 2. Carry out reducer actions for analysis tracking
  - Add `SET_ANALYZED_DATA` action to update analysis results
  - Add `QUEUE_USER_PROMPT` action to queue prompts
  - Add `CLEAR_QUEUED_PROMPT` action to clear queue after processing
  - Update `SET_PROCESSING` action handling to prevent duplicates
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 3. Fix duplicate request handling in chat panel
  - Add useEffect hook to process queued prompts on mount
  - Add processing flag check in submitMessage to prevent duplicates
  - Clear queued prompt after processing
  - Add console warning for duplicate attempts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4. Change main page to queue prompts instead of direct submission
  - Change prompt click handlers to dispatch QUEUE_USER_PROMPT
  - Remove direct message submission logic
  - Add navigation to chat page after queuing
  - _Requirements: 2.1, 2.4_

- [x] 5. Change chat handler to populate analyzedData after analysis
  - Change EDA agent response handler to extract and store outliers
  - Change forecasting agent response handler to extract and store forecast data
  - Update `analyzedData` state after each analysis completes
  - Store analysis type and timestamp
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ] 6. Remove mock data generation from Enhanced Insights Panel
  - Remove all mock data generation functions
  - Remove fallback data creation logic
  - Remove hardcoded statistics and metrics
  - _Requirements: 1.1, 1.6_

- [ ] 7. Update Enhanced Insights Panel to read from analyzedData
  - Replace mock metrics with data from `state.analyzedData`
  - Read forecast metrics from `state.selectedLob.forecastMetrics`
  - Read outliers from `state.analyzedData.outliers`
  - Implement conditional rendering based on `hasEDA`, `hasForecasting`, `hasInsights`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3_

- [ ] 8. Add empty states to Enhanced Insights Panel
  - Create empty state component for no analysis performed
  - Add guidance messages for each analysis type
  - Add suggestion buttons to trigger analysis
  - Show different messages based on what analysis is missing
  - _Requirements: 1.5, 1.6, 5.7_

- [ ] 9. Implement conditional forecast display in insights panel
  - Check `state.analyzedData.hasForecasting` before showing forecast metrics
  - Hide forecast-related sections if forecasting not performed
  - Show "Run forecast" prompt if forecast data is missing
  - _Requirements: 1.5, 5.2_

- [ ] 10. Separate visualization and insights panel state management
  - Ensure `dataPanelOpen` and `insightsPanelOpen` are independent
  - Remove any automatic panel opening logic
  - Update click handlers to only affect their respective panels
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Fix "Visualize Data" button to only open chart panel
  - Update `handleVisualizeClick` to only dispatch `SET_DATA_PANEL_OPEN`
  - Remove any insights panel opening logic from visualization handler
  - Test that insights panel remains closed when visualizing
  - _Requirements: 3.1, 3.2_

- [ ] 12. Add outlier highlighting to Enhanced Data Visualizer
  - Accept `outliers` prop in EnhancedDataVisualizer part
  - Map outlier indices to data points
  - Make outlier points with distinct visual markers (red color, larger size)
  - Add `isOutlier` flag to ChartDataPoint
  - _Requirements: 4.1, 4.4, 4.6_

- [ ] 13. Add forecast data rendering to charts
  - Accept `forecastData` prop in EnhancedDataVisualizer part
  - Add forecast line to trend chart
  - Add confidence interval shading
  - Distinguish forecast from actual data visually
  - _Requirements: 4.2, 4.3, 4.5, 4.7_

- [ ] 14. Implement dynamic chart updates based on analysis type
  - Show outliers only when EDA is performed
  - Show forecast only when forecasting is performed
  - Update chart tabs based on available analysis
  - Disable unavailable chart types
  - _Requirements: 4.5, 4.6, 4.7_

- [ ] 15. Add enhanced tooltips for outliers
  - Create custom tooltip part for outlier points
  - Display outlier reason and severity
  - Show statistical context (for example, "3.2σ above mean")
  - Add visual indicator in tooltip
  - _Requirements: 4.4_

- [ ] 16. Carry out real-time insights panel updates
  - Add useEffect hook to watch `state.analyzedData` changes
  - Trigger panel refresh when analysis completes
  - Update metrics and insights automatically
  - Handle LOB switching to reset insights
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 17. Add forecast vs actual comparison in insights panel
  - Create comparison chart component
  - Show actual data vs forecast predictions
  - Display accuracy metrics
  - Highlight prediction errors
  - _Requirements: 5.5_

- [ ] 18. Update insights panel to show optimal model selection
  - Display model comparison table if multiple models trained
  - Highlight optimal model with best MAPE/accuracy
  - Show why model was selected as optimal
  - Add model performance visualization
  - _Requirements: 1.3_

- [ ] 19. Add distribution charts using actual data
  - Create histogram component for value distribution
  - Use actual data values from selected LOB
  - Show statistical overlays (mean, median, std dev)
  - Add outlier markers to distribution
  - _Requirements: 1.4_

- [ ] 20. Carry out error boundaries for panel parts
  - Wrap Enhanced Insights Panel in error boundary
  - Wrap Enhanced Data Visualizer in error boundary
  - Add fallback UI for errors
  - Log errors for debugging
  - _Requirements: All (error handling)_

- [ ] 21. Add loading states for analysis updates
  - Show loading indicator when analysis is in progress
  - Disable panel interactions during updates
  - Show progress for long-running analyses
  - Add skeleton loaders for metrics
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 22. Confirm and test duplicate request prevention
  - Test rapid clicking on main page prompts
  - Test navigation during request processing
  - Verify only one request is sent
  - Verify only one response is displayed
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 23. Confirm and test visualization independence
  - Test opening chart panel alone
  - Test opening insights panel alone
  - Test opening both panels simultaneously
  - Test closing one panel while other is open
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 24. Validate and test real data integration
  - Upload test CSV with known outliers
  - Run EDA and verify outliers are detected and displayed
  - Run forecasting and verify forecast data is displayed
  - Verify insights panel shows actual metrics
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 25. Validate and test chart enhancements
  - Verify outliers are highlighted correctly
  - Verify forecast line appears after forecasting
  - Verify confidence intervals are displayed
  - Verify tooltips show correct information
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
