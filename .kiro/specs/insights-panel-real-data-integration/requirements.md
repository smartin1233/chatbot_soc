# Requirements Document

## Introduction

This feature addresses critical issues in the Enhanced Insights Panel and related data visualization components. Currently, the system displays mock data instead of real analysis results, sends duplicate requests from the main page, and has UI conflicts when visualizing data. The goal is to integrate real-time data from chat analysis into the insights panel, eliminate duplicate requests, fix visualization conflicts, and enhance charts with analysis-specific features like outlier highlighting and forecast data display.

## Requirements

### Requirement 1: Replace Mock Data with Real Analysis Data in Enhanced Insights Panel

**User Story:** As a business analyst, I want the Enhanced Insights Panel to display actual analysis results from my chat interactions, so that I can see real insights based on my data rather than mock information.

#### Acceptance Criteria

1. WHEN a user completes EDA analysis in chat THEN the Enhanced Insights Panel SHALL display actual data statistics, trends, and quality metrics from that analysis
2. WHEN a user completes forecasting in chat THEN the Enhanced Insights Panel SHALL display the trained model name, accuracy, MAPE values, and forecast data points
3. WHEN forecast data is available THEN the Enhanced Insights Panel SHALL show the optimal model with best MAPE and accuracy metrics
4. WHEN creating distribution charts THEN the system SHALL use actual data values from the selected LOB
5. IF forecasting has not been completed THEN the system SHALL NOT mention or display forecast-related metrics
6. WHEN displaying insights THEN the system SHALL only show information derived from actual chat analysis, not generated mock data

### Requirement 2: Eliminate Duplicate Request Sending from Main Page

**User Story:** As a user, I want my initial prompts from the main page to be sent only once to the chat, so that I don't receive incomplete or duplicate responses.

#### Acceptance Criteria

1. WHEN a user submits an initial prompt from the main page THEN the system SHALL send exactly one request to the chat API
2. WHEN processing the initial prompt THEN the system SHALL NOT send a second duplicate request
3. WHEN displaying the response THEN the system SHALL show only the complete, final response without intermediate incomplete versions
4. WHEN transitioning from main page to chat page THEN the queued prompt SHALL be processed exactly once
5. IF a prompt is already being processed THEN the system SHALL prevent duplicate submissions

### Requirement 3: Fix Visualization Panel Conflicts

**User Story:** As a user, I want to visualize data without the insights panel automatically opening, so that I can focus on the specific visualization I requested.

#### Acceptance Criteria

1. WHEN a user clicks the "Visualize Data" option/chipset THEN only the chart visualization SHALL open
2. WHEN the chart visualization opens THEN the insights panel SHALL NOT automatically open
3. WHEN the user explicitly requests insights THEN the insights panel SHALL open independently
4. WHEN both chart and insights panel are open THEN they SHALL function independently without conflicts
5. IF the user closes one panel THEN the other panel SHALL remain in its current state

### Requirement 4: Enhance Charts with Analysis-Specific Features

**User Story:** As a data analyst, I want charts to dynamically display analysis results like outliers and forecasts, so that I can visually identify important patterns and predictions in my data.

#### Acceptance Criteria

1. WHEN outliers are detected during analysis THEN the chart SHALL highlight those specific data points with distinct visual markers
2. WHEN forecasting is completed THEN the chart SHALL add forecast data points with visual distinction from actual data
3. WHEN displaying forecast data THEN the chart SHALL show confidence intervals if available
4. WHEN outliers are highlighted THEN the system SHALL provide tooltips or labels indicating why they are outliers
5. WHEN switching between different analysis types THEN the chart SHALL update to show relevant features (outliers for EDA, forecasts for forecasting)
6. IF no outliers exist THEN the chart SHALL display normally without outlier markers
7. IF no forecast data exists THEN the chart SHALL display only actual data without forecast elements

### Requirement 5: Synchronize Insights Panel with Real-Time Chat Data

**User Story:** As a business user, I want the insights panel to automatically update with information from my chat analysis, so that I have a consolidated view of all my analysis results.

#### Acceptance Criteria

1. WHEN EDA analysis completes in chat THEN the insights panel SHALL update with actual data statistics, trends, and patterns
2. WHEN forecasting completes in chat THEN the insights panel SHALL display model performance metrics and forecast results
3. WHEN the user gathers insights in chat THEN those exact insights SHALL appear in the insights panel
4. WHEN actual data is available THEN the insights panel SHALL use that data for all calculations and visualizations
5. WHEN forecast data is available THEN the insights panel SHALL display forecast vs actual comparisons
6. IF the selected LOB changes THEN the insights panel SHALL update to show data for the new LOB
7. WHEN no analysis has been performed THEN the insights panel SHALL show a clear message indicating no data is available yet
