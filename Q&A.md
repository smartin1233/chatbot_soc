# Frequently Asked Questions (FAQ)

This guide provides answers to common questions about using the application, covering general, technical, and usage-related topics.

## General Questions

### Q1: What is the main purpose of this application?
**A:** This application is an advanced business intelligence (BI) and forecasting tool. It allows you to upload your sales data, explore insights, and generate accurate forecasts to help you make informed business decisions. You can interact with specialized AI agents to perform tasks like exploratory data analysis (EDA), data preprocessing, model training, and forecasting.

### Q2: Who is this application for?
**A:** This tool is designed for business owners, analysts, and decision-makers who need to understand their data and predict future trends without needing a deep background in data science. It simplifies complex analysis and provides actionable insights.

### Q3: What kind of data can I use?
**A:** You can upload your sales or time-series data in CSV or Excel format. The data should ideally contain a date column and a numerical value column (e.g., "Sales" or "Revenue"). Additional columns, like "Orders," can also be used as external regressors to improve forecast accuracy.

## Technical Questions

### Q4: How does the forecasting work?
**A:** The application uses a multi-agent system to perform a complete machine learning pipeline. When you request a forecast, the following steps are executed:
1.  **EDA Agent:** Analyzes your data for patterns, trends, and quality issues.
2.  **Data Engineer Agent:** Cleans the data, handles missing values, and creates features for modeling.
3.  **ML Engineer Agent:** Trains multiple ML models (like XGBoost, Prophet, and LSTM) and selects the best-performing one.
4.  **Quality Analyst Agent:** Validates the chosen model on a holdout dataset to ensure its reliability.
5.  **Forecast Analyst Agent:** Generates the final forecast with confidence intervals.

### Q5: What do the model performance metrics (MAPE, R², RMSE) mean?
**A:** These metrics help you understand the accuracy of the forecast model:
*   **MAPE (Mean Absolute Percentage Error):** Shows the average percentage error between the forecasted values and the actual values. A lower MAPE is better. For example, a MAPE of 5% means the forecast is, on average, 5% off from the actual values.
*   **R-squared (R²):** Indicates how well the model explains the variance in your data. It ranges from 0 to 1, where 1 means the model perfectly explains the data's movement. A higher R² is better.
*   **RMSE (Root Mean Square Error):** Measures the average magnitude of the errors. It is in the same unit as your data (e.g., dollars or units sold). A lower RMSE is better.

### Q6: Why do I need to provide an API key?
**A:** The AI agents are powered by large language models (LLMs) from providers like OpenAI. An API key is required to authenticate your requests and allow the application to use these models for analysis and generating responses. Your key is stored securely and used only for processing your requests.

## How to Use the Application

### Q7: How do I get started?
**A:**
1.  **Select a Business Unit (BU) and Line of Business (LOB):** Use the selectors at the top-left to choose an existing BU/LOB or create a new one.
2.  **Upload Your Data:** Click the "Upload Data" button and select your CSV or Excel file.
3.  **Start a Conversation:** Ask the AI assistant to perform an analysis. For example, you can say, "Explore my data" or "Generate a 30-day forecast."

### Q8: How do I see the forecast chart?
**A:** After running a forecast, a "Visualize Actual & Forecast" button will appear in the chat. Click this button to open the data visualizer, which will display a chart with your historical data, the forecast, and confidence intervals.

### Q9: What is the "Enhanced Insight Panel"?
**A:** The Enhanced Insight Panel provides a comprehensive dashboard view of your analysis. It includes:
*   **KPIs:** Key performance indicators like current value, growth rate, and data quality.
*   **Forecast Chart:** A detailed view of the forecast with confidence intervals.
*   **Model Performance:** Metrics (MAPE, R², etc.) for the trained forecasting model.
*   **Context-Aware Insights:** Actionable recommendations based on the analysis.

### Q10: How can I interpret the "Actual vs. Forecast" chart?
**A:** The chart shows three key elements:
*   **Actual Data (Solid Line):** Your historical data points.
*   **Forecast (Dashed Line):** The model's prediction for the future.
*   **Confidence Interval (Shaded Area):** The range within which the actual values are likely to fall. A wider interval indicates more uncertainty, while a narrower one suggests higher confidence.

### Q11: What should I do if the forecast doesn't look right?
**A:** If a forecast seems off, consider the following:
*   **Data Quality:** Ensure your data is clean and doesn't have significant gaps or errors. The EDA agent can help you identify quality issues.
*   **More Data:** Longer historical data can often lead to more accurate forecasts.
*   **Context:** Were there any special events (like promotions or holidays) that the model might not be aware of? You can mention these in the chat to provide more context.
*   **Try a Different Model:** In future versions, you may be able to suggest different models for the ML Engineer to try.