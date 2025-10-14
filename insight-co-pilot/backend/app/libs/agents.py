"""Agno-based AI Agents for Insight Co-Pilot.

This module contains all specialized agents built with Agno framework.
Each agent has its own LLM (Claude or GPT-4o) and reasoning capabilities.

Agents are organized into three categories:
- Data Onboarding Agents: DataFetcher, CRUDManager, ComparisonAnalyzer, ScenarioModeler
- Forecasting Agents: DataExplorer, DataCleaner, ModelSelector, ModelTrainer, ModelEvaluator
- Cross-Workflow Agents: Visualizer, InsightsAnalyzer
"""

from typing import Dict, Any, List, Optional
import asyncpg
import databutton as db
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import plotly.graph_objects as go
import plotly.express as px
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.models.openai import OpenAIChat
from agno.tools import tool


# ============================================================================
# SHARED TOOL FUNCTIONS
# ============================================================================

@tool
async def get_db_connection() -> str:
    """Get database connection. Returns connection status message.

    Returns:
        Status message indicating connection success or failure
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        await conn.close()
        return "Database connection successful"
    except Exception as e:
        return f"Database connection failed: {str(e)}"


@tool
async def fetch_datasets(filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Fetch datasets from database.

    Args:
        filters: Optional filters to apply (currently not implemented)

    Returns:
        Dictionary with success status, count, and list of datasets
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            query = "SELECT * FROM datasets ORDER BY uploaded_at DESC LIMIT 20"
            datasets = await conn.fetch(query)
            return {
                "success": True,
                "data_type": "datasets",
                "count": len(datasets),
                "datasets": [dict(row) for row in datasets]
            }
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch datasets: {str(e)}"}


@tool
async def fetch_metrics(lob_id: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
    """Fetch weekly metrics from database.

    Args:
        lob_id: Optional LOB ID to filter metrics
        limit: Maximum number of records to return (default 100)

    Returns:
        Dictionary with success status, count, and list of metrics
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            if lob_id:
                query = "SELECT * FROM weekly_metrics WHERE lob_id = $1 ORDER BY week_date DESC LIMIT $2"
                metrics = await conn.fetch(query, lob_id, limit)
            else:
                query = "SELECT * FROM weekly_metrics ORDER BY week_date DESC LIMIT $1"
                metrics = await conn.fetch(query, limit)

            return {
                "success": True,
                "data_type": "metrics",
                "count": len(metrics),
                "metrics": [dict(row) for row in metrics]
            }
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch metrics: {str(e)}"}


@tool
async def fetch_business_units() -> Dict[str, Any]:
    """Fetch business units and LOBs from database.

    Returns:
        Dictionary with success status, business units, and LOBs
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            bus = await conn.fetch("SELECT * FROM business_units ORDER BY name")
            lobs = await conn.fetch("SELECT * FROM lobs ORDER BY name")

            return {
                "success": True,
                "data_type": "business_structure",
                "business_units": [dict(row) for row in bus],
                "lobs": [dict(row) for row in lobs]
            }
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch business units: {str(e)}"}


@tool
async def create_entity(entity_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new entity (business_unit or lob).

    Args:
        entity_type: Type of entity to create ("business_unit" or "lob")
        data: Entity data including name and other required fields

    Returns:
        Dictionary with success status and created entity details
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            if entity_type == "business_unit":
                result = await conn.fetchrow(
                    "INSERT INTO business_units (name, description) VALUES ($1, $2) RETURNING id, name",
                    data.get("name"), data.get("description")
                )
                return {"success": True, "created": dict(result)}
            elif entity_type == "lob":
                result = await conn.fetchrow(
                    "INSERT INTO lobs (name, business_unit_id) VALUES ($1, $2) RETURNING id, name",
                    data.get("name"), data.get("business_unit_id")
                )
                return {"success": True, "created": dict(result)}
            else:
                return {"success": False, "error": f"Unknown entity_type: {entity_type}"}
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to create entity: {str(e)}"}


@tool
async def read_entity(entity_type: str, entity_id: str) -> Dict[str, Any]:
    """Read a specific entity by ID.

    Args:
        entity_type: Type of entity ("business_unit" or "lob")
        entity_id: ID of the entity to retrieve

    Returns:
        Dictionary with success status and entity data
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            if entity_type == "business_unit":
                result = await conn.fetchrow("SELECT * FROM business_units WHERE id = $1", entity_id)
            elif entity_type == "lob":
                result = await conn.fetchrow("SELECT * FROM lobs WHERE id = $1", entity_id)
            else:
                return {"success": False, "error": f"Unknown entity_type: {entity_type}"}

            if result:
                return {"success": True, "entity": dict(result)}
            return {"success": False, "error": "Entity not found"}
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to read entity: {str(e)}"}


@tool
async def list_entities(entity_type: str) -> Dict[str, Any]:
    """List all entities of a specific type.

    Args:
        entity_type: Type of entities to list ("business_unit" or "lob")

    Returns:
        Dictionary with success status and list of entities
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            if entity_type == "business_unit":
                results = await conn.fetch("SELECT * FROM business_units ORDER BY name")
            elif entity_type == "lob":
                results = await conn.fetch("SELECT * FROM lobs ORDER BY name")
            else:
                return {"success": False, "error": f"Unknown entity_type: {entity_type}"}

            return {"success": True, "entities": [dict(row) for row in results]}
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to list entities: {str(e)}"}


@tool
async def train_prophet_model(data: List[Dict[str, Any]], periods: int = 12) -> Dict[str, Any]:
    """Train a Prophet forecasting model and generate predictions.

    Args:
        data: Training data with 'ds' (date) and 'y' (value) columns
        periods: Number of periods to forecast (default 12)

    Returns:
        Dictionary with success status, model info, and predictions
    """
    try:
        if len(data) < 10:
            return {"success": False, "error": "Insufficient data for training (need at least 10 data points)"}

        df = pd.DataFrame(data)

        # Ensure proper column names
        if 'ds' not in df.columns or 'y' not in df.columns:
            return {"success": False, "error": "Data must have 'ds' (date) and 'y' (value) columns"}

        # Train Prophet model
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False
        )
        model.fit(df)

        # Make future predictions
        future = model.make_future_dataframe(periods=periods, freq='W')
        forecast = model.predict(future)

        # Get predictions for future periods only
        predictions = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods).to_dict('records')

        return {
            "success": True,
            "model_type": "prophet",
            "training_samples": len(df),
            "forecast_periods": periods,
            "predictions": predictions
        }
    except Exception as e:
        return {"success": False, "error": f"Model training failed: {str(e)}"}


@tool
def calculate_metrics(predictions: List[float], actuals: List[float]) -> Dict[str, Any]:
    """Calculate forecasting accuracy metrics (MAE, RMSE, MAPE).

    Args:
        predictions: List of predicted values
        actuals: List of actual values

    Returns:
        Dictionary with success status and calculated metrics
    """
    try:
        if len(predictions) != len(actuals):
            return {"success": False, "error": "Predictions and actuals must have same length"}

        if len(predictions) == 0:
            return {"success": False, "error": "Empty data provided"}

        mae = mean_absolute_error(actuals, predictions)
        rmse = np.sqrt(mean_squared_error(actuals, predictions))

        # Calculate MAPE with zero-division handling
        actuals_array = np.array(actuals)
        predictions_array = np.array(predictions)
        non_zero_mask = actuals_array != 0

        if non_zero_mask.sum() > 0:
            mape = np.mean(np.abs((actuals_array[non_zero_mask] - predictions_array[non_zero_mask]) / actuals_array[non_zero_mask])) * 100
        else:
            mape = 0.0

        return {
            "success": True,
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "mape": round(float(mape), 2)
        }
    except Exception as e:
        return {"success": False, "error": f"Metrics calculation failed: {str(e)}"}


@tool
def create_plotly_chart(chart_type: str, data: List[Dict[str, Any]], config: Dict[str, Any] = None) -> Dict[str, Any]:
    """Create a Plotly chart configuration.

    Args:
        chart_type: Type of chart ("line", "bar", "scatter")
        data: Chart data as list of dictionaries
        config: Optional chart configuration (title, labels, etc.)

    Returns:
        Dictionary with success status and Plotly chart config
    """
    try:
        if not data:
            return {"success": False, "error": "No data provided for chart"}

        config = config or {}
        df = pd.DataFrame(data)

        if len(df.columns) < 2:
            return {"success": False, "error": "Data must have at least 2 columns"}

        title = config.get('title', f'{chart_type.title()} Chart')

        if chart_type == "line":
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df.iloc[:, 0],
                y=df.iloc[:, 1],
                mode='lines+markers',
                name=title
            ))
            fig.update_layout(title=title, template='plotly_dark')

        elif chart_type == "bar":
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=df.iloc[:, 0],
                y=df.iloc[:, 1],
                name=title
            ))
            fig.update_layout(title=title, template='plotly_dark')

        elif chart_type == "scatter":
            fig = px.scatter(df, x=df.columns[0], y=df.columns[1], title=title)
            fig.update_layout(template='plotly_dark')

        else:
            return {"success": False, "error": f"Chart type '{chart_type}' not supported"}

        chart_json = fig.to_json()

        return {
            "success": True,
            "chart_type": chart_type,
            "chart_config": json.loads(chart_json)
        }
    except Exception as e:
        return {"success": False, "error": f"Chart creation failed: {str(e)}"}


@tool
async def fetch_dataset_by_id(dataset_id: str) -> Dict[str, Any]:
    """Fetch a specific dataset by ID.

    Args:
        dataset_id: ID of the dataset to retrieve

    Returns:
        Dictionary with success status and dataset details
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            dataset = await conn.fetchrow("SELECT * FROM datasets WHERE id = $1", dataset_id)

            if not dataset:
                return {"success": False, "error": "Dataset not found"}

            # Parse column info
            columns_info = json.loads(dataset['columns_info']) if dataset['columns_info'] else {}

            return {
                "success": True,
                "dataset_id": dataset_id,
                "row_count": dataset['row_count'],
                "column_count": dataset['column_count'],
                "columns": columns_info,
                "uploaded_at": str(dataset['uploaded_at'])
            }
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch dataset: {str(e)}"}


@tool
def calculate_statistics(data: List[float]) -> Dict[str, Any]:
    """Calculate basic statistical measures.

    Args:
        data: List of numerical values

    Returns:
        Dictionary with success status and statistics (mean, median, std, min, max)
    """
    try:
        if not data:
            return {"success": False, "error": "Empty data provided"}

        arr = np.array(data)

        return {
            "success": True,
            "mean": round(float(np.mean(arr)), 2),
            "median": round(float(np.median(arr)), 2),
            "std": round(float(np.std(arr)), 2),
            "min": round(float(np.min(arr)), 2),
            "max": round(float(np.max(arr)), 2),
            "count": len(arr)
        }
    except Exception as e:
        return {"success": False, "error": f"Statistics calculation failed: {str(e)}"}


@tool
async def compare_lobs() -> Dict[str, Any]:
    """Compare metrics across different LOBs.

    Returns:
        Dictionary with success status and comparison results
    """
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV")
        conn = await asyncpg.connect(database_url)
        try:
            metrics = await conn.fetch(
                """
                SELECT l.name as lob_name,
                       AVG(m.metric_value) as avg_value,
                       COUNT(m.id) as data_points
                FROM weekly_metrics m
                JOIN lobs l ON m.lob_id = l.id
                GROUP BY l.name
                ORDER BY avg_value DESC
                """
            )

            if not metrics:
                return {
                    "success": True,
                    "comparison_data": [],
                    "message": "No metrics data available for comparison"
                }

            return {
                "success": True,
                "comparison_data": [dict(row) for row in metrics],
                "count": len(metrics)
            }
        finally:
            await conn.close()
    except Exception as e:
        return {"success": False, "error": f"LOB comparison failed: {str(e)}"}


@tool
def project_growth(baseline_value: float, growth_rate: float, periods: int) -> Dict[str, Any]:
    """Project growth over multiple periods.

    Args:
        baseline_value: Starting value
        growth_rate: Growth rate as decimal (e.g., 0.05 for 5%)
        periods: Number of periods to project

    Returns:
        Dictionary with success status and projection results
    """
    try:
        projections = []
        current_value = baseline_value

        for i in range(periods):
            current_value *= (1 + growth_rate)
            projections.append({
                "period": i + 1,
                "projected_value": round(current_value, 2)
            })

        return {
            "success": True,
            "baseline": baseline_value,
            "growth_rate": growth_rate,
            "periods": periods,
            "projections": projections
        }
    except Exception as e:
        return {"success": False, "error": f"Growth projection failed: {str(e)}"}


@tool
def detect_seasonality(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Detect seasonality patterns in time series data.

    Args:
        data: Time series data with date and value fields

    Returns:
        Dictionary with success status and seasonality detection results
    """
    try:
        if len(data) < 12:
            return {
                "success": True,
                "has_seasonality": False,
                "confidence": "low",
                "reason": "Insufficient data for seasonality detection (need at least 12 points)"
            }

        # Simple seasonality detection based on data length and variance
        df = pd.DataFrame(data)
        if 'y' in df.columns:
            values = df['y'].values
            std = np.std(values)
            mean = np.mean(values)
            cv = std / mean if mean != 0 else 0

            # High coefficient of variation suggests seasonality
            has_seasonality = cv > 0.2
            confidence = "high" if len(data) >= 24 else "medium"

            return {
                "success": True,
                "has_seasonality": has_seasonality,
                "confidence": confidence,
                "coefficient_of_variation": round(float(cv), 3),
                "reason": f"Data shows {'significant' if has_seasonality else 'low'} variation suggesting {'seasonal' if has_seasonality else 'stable'} patterns"
            }

        return {"success": False, "error": "Data must contain 'y' column"}
    except Exception as e:
        return {"success": False, "error": f"Seasonality detection failed: {str(e)}"}


@tool
def detect_trend(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Detect trend in time series data.

    Args:
        data: Time series data with date and value fields

    Returns:
        Dictionary with success status and trend detection results
    """
    try:
        if len(data) < 3:
            return {"success": False, "error": "Insufficient data for trend detection (need at least 3 points)"}

        df = pd.DataFrame(data)
        if 'y' not in df.columns:
            return {"success": False, "error": "Data must contain 'y' column"}

        values = df['y'].values

        # Simple trend detection using linear regression slope
        x = np.arange(len(values))
        slope, _ = np.polyfit(x, values, 1)

        # Determine trend direction and strength
        mean_val = np.mean(values)
        trend_strength = abs(slope) / mean_val if mean_val != 0 else 0

        if trend_strength > 0.01:
            trend_direction = "increasing" if slope > 0 else "decreasing"
            has_trend = True
        else:
            trend_direction = "flat"
            has_trend = False

        return {
            "success": True,
            "has_trend": has_trend,
            "trend_direction": trend_direction,
            "slope": round(float(slope), 4),
            "trend_strength": round(float(trend_strength), 4)
        }
    except Exception as e:
        return {"success": False, "error": f"Trend detection failed: {str(e)}"}


# ============================================================================
# AGNO AGENTS
# ============================================================================

# 1. DataFetcherAgent
data_fetcher_agent = Agent(
    name="DataFetcher",
    model=Claude(id="claude-sonnet-4"),
    tools=[fetch_datasets, fetch_metrics, fetch_business_units],
    instructions="""You are a data retrieval specialist for business intelligence.

Analyze user requests to determine what data they need:
- Use fetch_datasets for dataset lists
- Use fetch_metrics for time series data
- Use fetch_business_units for organizational structure

Always provide context about the data you retrieve:
- Row counts and date ranges
- Business units covered
- Data quality observations

If filters are mentioned (specific LOB, date range), apply them appropriately.
Return structured data ready for analysis.""",
    markdown=True,
    show_tool_calls=True
)


# 2. CRUDManagerAgent
crud_manager_agent = Agent(
    name="CRUDManager",
    model=Claude(id="claude-sonnet-4"),
    tools=[create_entity, read_entity, list_entities],
    instructions="""You manage business organizational structures (business units, LOBs, locations).

Determine the user's intent: create, read, update, or delete.

For create operations:
- Validate that required fields are provided
- Use create_entity with proper entity_type and data

For read operations:
- Use read_entity for specific items
- Use list_entities to show all items of a type

Always confirm successful operations with details of what changed.
Provide clear error messages if operations fail.""",
    markdown=True,
    show_tool_calls=True
)


# 3. ComparisonAnalyzerAgent
comparison_analyzer_agent = Agent(
    name="ComparisonAnalyzer",
    model=Claude(id="claude-sonnet-4"),
    tools=[fetch_metrics, compare_lobs, calculate_statistics],
    instructions="""You are a business metrics comparison specialist.

Analyze metrics across business units, LOBs, or time periods:
- Use compare_lobs for cross-LOB analysis
- Use fetch_metrics for time-based comparisons
- Use calculate_statistics for statistical analysis

Identify and explain:
- Top performers and bottom performers
- Significant differences with percentage changes
- Statistical significance of differences

Provide actionable insights about WHY differences exist.
Focus on business impact, not just numbers.""",
    markdown=True,
    show_tool_calls=True
)


# 4. ScenarioModelerAgent
scenario_modeler_agent = Agent(
    name="ScenarioModeler",
    model=OpenAIChat(id="gpt-4o"),
    tools=[project_growth, fetch_metrics, calculate_statistics],
    instructions="""You simulate business scenarios and what-if analyses.

For growth projections:
- Determine appropriate growth rate based on historical data if available
- Use project_growth with baseline, rate, and periods
- Generate multiple scenarios (optimistic, baseline, pessimistic) when appropriate

For sensitivity analysis:
- Test parameter variations systematically
- Show impact ranges and breakeven points

Always explain assumptions clearly and provide confidence ranges.
Help users understand risks and opportunities in different scenarios.""",
    markdown=True,
    show_tool_calls=True
)


# 5. DataExplorerAgent
data_explorer_agent = Agent(
    name="DataExplorer",
    model=Claude(id="claude-sonnet-4"),
    tools=[fetch_dataset_by_id, calculate_statistics, fetch_metrics],
    instructions="""You are a data quality and exploration specialist.

Analyze datasets for:
- Statistical properties (mean, median, std, min, max, quartiles)
- Data distributions and patterns
- Outliers and anomalies
- Missing values and data quality issues

Use fetch_dataset_by_id to get dataset metadata.
Use calculate_statistics to compute summary statistics.

Flag any data quality concerns that would impact analysis.
Recommend data quality improvements before modeling.

Provide clear, actionable insights about data characteristics.""",
    markdown=True,
    show_tool_calls=True
)


# 6. DataCleanerAgent
data_cleaner_agent = Agent(
    name="DataCleaner",
    model=Claude(id="claude-sonnet-4"),
    tools=[calculate_statistics],
    instructions="""You clean and prepare data for analysis.

Decide appropriate cleaning strategy based on data characteristics and use case:

For missing values:
- Choose between fill (mean/median/mode), forward fill, or remove
- Consider the percentage of missing data and its pattern

For outliers:
- Decide whether to cap, remove, or keep based on context
- Business outliers may be valid (e.g., holiday sales spikes)

Document all cleaning operations performed.
Explain WHY each cleaning decision was made.

Return cleaned data summary with before/after statistics.""",
    markdown=True,
    show_tool_calls=True
)


# 7. ModelSelectorAgent
model_selector_agent = Agent(
    name="ModelSelector",
    model=OpenAIChat(id="gpt-4o"),
    tools=[detect_seasonality, detect_trend, calculate_statistics],
    instructions="""You are a forecasting model selection expert.

Analyze time series properties to recommend the best forecasting model:

Key considerations:
- Seasonality: Use detect_seasonality to check for patterns
- Trend: Use detect_trend to identify direction
- Stationarity: Assess data stability
- Data volume: Check if sufficient for complex models
- Forecast horizon: Match model to prediction distance

Models to consider:
- Prophet: Best for seasonality + trend, handles holidays
- ARIMA: Good for stationary data, trend patterns
- Exponential Smoothing: Simple trends, limited data
- Moving Average: Very limited data, stable patterns

Explain your recommendation with specific reasoning about data characteristics.
Provide confidence level (high/medium/low) with justification.

Be honest about limitations and alternatives.""",
    markdown=True,
    show_tool_calls=True
)


# 8. ModelTrainerAgent
model_trainer_agent = Agent(
    name="ModelTrainer",
    model=OpenAIChat(id="gpt-4o"),
    tools=[train_prophet_model, fetch_metrics],
    instructions="""You train forecasting models (primarily Prophet).

Workflow:
1. Fetch historical data using fetch_metrics
2. Validate data quality and quantity (need at least 10 data points)
3. Prepare data in Prophet format (ds, y columns)
4. Train model using train_prophet_model
5. Generate forecasts for requested periods

Configure model parameters based on data characteristics:
- Enable yearly_seasonality if data shows seasonal patterns
- Set forecast periods based on user request (default 12 weeks)

Provide prediction intervals (lower/upper bounds) with forecasts.
Explain model configuration choices and training results.

If training fails, provide clear guidance on what's needed.""",
    markdown=True,
    show_tool_calls=True
)


# 9. ModelEvaluatorAgent
model_evaluator_agent = Agent(
    name="ModelEvaluator",
    model=Claude(id="claude-sonnet-4"),
    tools=[calculate_metrics],
    instructions="""You evaluate forecasting model performance.

Calculate and interpret accuracy metrics:
- MAE (Mean Absolute Error): Average prediction error
- RMSE (Root Mean Squared Error): Penalizes large errors more
- MAPE (Mean Absolute Percentage Error): Percentage accuracy

Interpretation guidelines:
- MAPE < 10%: Excellent accuracy
- MAPE 10-20%: Good accuracy
- MAPE 20-50%: Acceptable accuracy
- MAPE > 50%: Poor accuracy, model needs improvement

Provide business context interpretation, not just numbers.
Identify where model performs well vs poorly (time periods, value ranges).

Recommend improvements if accuracy is insufficient:
- More training data
- Different model
- Better feature engineering
- Data quality improvements""",
    markdown=True,
    show_tool_calls=True
)


# 10. VisualizerAgent
visualizer_agent = Agent(
    name="Visualizer",
    model=Claude(id="claude-sonnet-4"),
    tools=[create_plotly_chart, fetch_metrics],
    instructions="""You create data visualizations using Plotly.

Determine appropriate chart type based on data and intent:
- Line charts: Time series, trends over time
- Bar charts: Comparisons across categories
- Scatter plots: Relationships between variables

Workflow:
1. Fetch data if not provided using fetch_metrics
2. Prepare data for visualization
3. Create chart using create_plotly_chart
4. Return Plotly chart config as JSON for frontend rendering

Use plotly_dark theme for consistency with application design.

If data is insufficient or unavailable, explain what's needed clearly.
Provide context about what the visualization shows.""",
    markdown=True,
    show_tool_calls=True
)


# 11. InsightsAnalyzerAgent
insights_analyzer_agent = Agent(
    name="InsightsAnalyzer",
    model=OpenAIChat(id="gpt-4o"),
    tools=[calculate_statistics, detect_trend, fetch_metrics],
    instructions="""You are a business insights and recommendations specialist.

Analyze data to identify trends, patterns, anomalies, and opportunities.

Provide actionable business recommendations, not just observations:
- What is happening (the insight)
- Why it's happening (the analysis)
- What should be done (the recommendation)

For trends:
- Identify direction, magnitude, acceleration/deceleration
- Compare to historical patterns and benchmarks

For anomalies:
- Explain potential causes
- Suggest investigations or actions

Recommendations should be:
- Specific and measurable
- Tied to business impact
- Prioritized by impact (high/medium/low)
- Actionable by the business team

Focus on business value, not technical details.""",
    markdown=True,
    show_tool_calls=True
)


# ============================================================================
# AGENT REGISTRY
# ============================================================================

AGENT_REGISTRY = {
    "data_fetcher": {
        "agent": data_fetcher_agent,
        "description": "Retrieves business data from database sources including datasets, metrics, and business units",
        "category": "data_onboarding"
    },
    "crud_manager": {
        "agent": crud_manager_agent,
        "description": "Creates, reads, updates, and deletes business units, LOBs, and organizational structures",
        "category": "data_onboarding"
    },
    "comparison_analyzer": {
        "agent": comparison_analyzer_agent,
        "description": "Compares metrics across business units, LOBs, or time periods and identifies trends",
        "category": "data_onboarding"
    },
    "scenario_modeler": {
        "agent": scenario_modeler_agent,
        "description": "Simulates what-if scenarios like revenue impact, growth projections, and sensitivity analysis",
        "category": "data_onboarding"
    },
    "data_explorer": {
        "agent": data_explorer_agent,
        "description": "Analyzes datasets to identify patterns, outliers, missing values, and statistical properties",
        "category": "forecasting"
    },
    "data_cleaner": {
        "agent": data_cleaner_agent,
        "description": "Cleans data by handling missing values, outliers, and normalizing formats",
        "category": "forecasting"
    },
    "model_selector": {
        "agent": model_selector_agent,
        "description": "Analyzes data characteristics and recommends the best forecasting model (Prophet, ARIMA, etc.)",
        "category": "forecasting"
    },
    "model_trainer": {
        "agent": model_trainer_agent,
        "description": "Trains forecasting models (primarily Prophet) with automatic hyperparameter optimization",
        "category": "forecasting"
    },
    "model_evaluator": {
        "agent": model_evaluator_agent,
        "description": "Evaluates forecast accuracy using metrics like MAE, RMSE, and generates diagnostic plots",
        "category": "forecasting"
    },
    "visualizer": {
        "agent": visualizer_agent,
        "description": "Generates interactive visualizations including time series plots, comparisons, and dashboards",
        "category": "cross_workflow"
    },
    "insights_analyzer": {
        "agent": insights_analyzer_agent,
        "description": "Analyzes data to identify trends, anomalies, and generate business recommendations",
        "category": "cross_workflow"
    }
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_agent(agent_name: str) -> Optional[Agent]:
    """Get an agent by name from the registry.

    Args:
        agent_name: Name of the agent to retrieve

    Returns:
        Agent instance or None if not found
    """
    agent_config = AGENT_REGISTRY.get(agent_name)
    if agent_config:
        return agent_config["agent"]
    return None


def list_all_agents() -> Dict[str, Dict[str, str]]:
    """List all available agents with their descriptions.

    Returns:
        Dictionary mapping agent names to their description and category
    """
    return {
        name: {
            "description": config["description"],
            "category": config["category"]
        }
        for name, config in AGENT_REGISTRY.items()
    }


async def execute_agent(agent_name: str, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute an agent with error handling.

    Args:
        agent_name: Name of the agent to execute
        query: User query or instruction
        context: Optional context data

    Returns:
        Dictionary with response, data, reasoning, and tool_calls
    """
    try:
        agent = get_agent(agent_name)
        if not agent:
            return {
                "success": False,
                "error": f"Agent '{agent_name}' not found",
                "available_agents": list(AGENT_REGISTRY.keys())
            }

        # Run the agent
        response = agent.run(query)

        # Extract response data
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)

        return {
            "success": True,
            "agent": agent_name,
            "response": response_text,
            "context": context
        }

    except Exception as e:
        return {
            "success": False,
            "agent": agent_name,
            "error": f"Agent execution failed: {str(e)}"
        }
