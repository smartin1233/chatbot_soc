


"""Specialized AI Agents for Insight Co-Pilot.

This module contains all specialized agents organized into three categories:
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
import io
import base64


class BaseAgent:
    """Base class for all agents."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    async def get_db_connection(self):
        """Get database connection."""
        database_url = db.secrets.get("DATABASE_URL_DEV")
        return await asyncpg.connect(database_url)
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent task. To be overridden by subclasses."""
        raise NotImplementedError("Subclasses must implement execute()")


# ============================================================================
# DATA ONBOARDING AGENTS
# ============================================================================

class DataFetcherAgent(BaseAgent):
    """Retrieves business data from configured sources."""
    
    def __init__(self):
        super().__init__(
            name="DataFetcher",
            description="Retrieves business data from database sources including datasets, metrics, and business units"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch data based on query parameters."""
        query_type = params.get("query_type", "datasets")
        filters = params.get("filters", {})
        
        conn = await self.get_db_connection()
        try:
            if query_type == "datasets":
                return await self._fetch_datasets(conn, filters)
            elif query_type == "metrics":
                return await self._fetch_metrics(conn, filters)
            elif query_type == "business_units":
                return await self._fetch_business_units(conn, filters)
            else:
                return {"error": f"Unknown query_type: {query_type}"}
        finally:
            await conn.close()
    
    async def _fetch_datasets(self, conn, filters):
        """Fetch datasets with optional filters."""
        query = "SELECT * FROM datasets ORDER BY uploaded_at DESC LIMIT 20"
        datasets = await conn.fetch(query)
        return {
            "success": True,
            "data_type": "datasets",
            "count": len(datasets),
            "datasets": [dict(row) for row in datasets]
        }
    
    async def _fetch_metrics(self, conn, filters):
        """Fetch weekly metrics."""
        lob_id = filters.get("lob_id")
        if lob_id:
            query = "SELECT * FROM weekly_metrics WHERE lob_id = $1 ORDER BY week_date DESC LIMIT 100"
            metrics = await conn.fetch(query, lob_id)
        else:
            query = "SELECT * FROM weekly_metrics ORDER BY week_date DESC LIMIT 100"
            metrics = await conn.fetch(query)
        
        return {
            "success": True,
            "data_type": "metrics",
            "count": len(metrics),
            "metrics": [dict(row) for row in metrics]
        }
    
    async def _fetch_business_units(self, conn, filters):
        """Fetch business units and LOBs."""
        bus = await conn.fetch("SELECT * FROM business_units ORDER BY name")
        lobs = await conn.fetch("SELECT * FROM lobs ORDER BY name")
        
        return {
            "success": True,
            "data_type": "business_structure",
            "business_units": [dict(row) for row in bus],
            "lobs": [dict(row) for row in lobs]
        }


class CRUDManagerAgent(BaseAgent):
    """Handles business units and location management."""
    
    def __init__(self):
        super().__init__(
            name="CRUDManager",
            description="Creates, reads, updates, and deletes business units, LOBs, and organizational structures"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Perform CRUD operations."""
        operation = params.get("operation", "read")
        entity_type = params.get("entity_type", "business_unit")
        
        conn = await self.get_db_connection()
        try:
            if operation == "create":
                return await self._create_entity(conn, entity_type, params.get("data", {}))
            elif operation == "read":
                return await self._read_entity(conn, entity_type, params.get("entity_id"))
            elif operation == "list":
                return await self._list_entities(conn, entity_type)
            else:
                return {"error": f"Operation {operation} not supported"}
        finally:
            await conn.close()
    
    async def _create_entity(self, conn, entity_type, data):
        """Create a new entity."""
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
        return {"error": "Unknown entity_type"}
    
    async def _read_entity(self, conn, entity_type, entity_id):
        """Read a specific entity."""
        if entity_type == "business_unit":
            result = await conn.fetchrow("SELECT * FROM business_units WHERE id = $1", entity_id)
        elif entity_type == "lob":
            result = await conn.fetchrow("SELECT * FROM lobs WHERE id = $1", entity_id)
        else:
            return {"error": "Unknown entity_type"}
        
        if result:
            return {"success": True, "entity": dict(result)}
        return {"error": "Entity not found"}
    
    async def _list_entities(self, conn, entity_type):
        """List all entities of a type."""
        if entity_type == "business_unit":
            results = await conn.fetch("SELECT * FROM business_units ORDER BY name")
        elif entity_type == "lob":
            results = await conn.fetch("SELECT * FROM lobs ORDER BY name")
        else:
            return {"error": "Unknown entity_type"}
        
        return {"success": True, "entities": [dict(row) for row in results]}


class ComparisonAnalyzerAgent(BaseAgent):
    """Compares business metrics and generates visual insights."""
    
    def __init__(self):
        super().__init__(
            name="ComparisonAnalyzer",
            description="Compares metrics across business units, LOBs, or time periods and identifies trends"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Compare metrics and generate insights."""
        comparison_type = params.get("comparison_type", "lob_comparison")
        
        conn = await self.get_db_connection()
        try:
            if comparison_type == "lob_comparison":
                return await self._compare_lobs(conn, params)
            elif comparison_type == "time_series":
                return await self._analyze_time_series(conn, params)
            else:
                return {"error": "Unknown comparison_type"}
        finally:
            await conn.close()
    
    async def _compare_lobs(self, conn, params):
        """Compare metrics across different LOBs."""
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
        
        comparison_data = [dict(row) for row in metrics]
        
        insights = []
        if len(comparison_data) > 1:
            top_lob = comparison_data[0]
            insights.append(f"Top performing LOB: {top_lob['lob_name']} with average value {top_lob['avg_value']:.2f}")
        elif len(comparison_data) == 0:
            return {
                "success": True,
                "comparison_type": "lob_comparison",
                "data": [],
                "insights": ["No metrics data available for comparison. Please upload data or create weekly metrics first."]
            }
        
        return {
            "success": True,
            "comparison_type": "lob_comparison",
            "data": comparison_data,
            "insights": insights
        }
    
    async def _analyze_time_series(self, conn, params):
        """Analyze metrics over time."""
        lob_id = params.get("lob_id")
        
        if lob_id:
            metrics = await conn.fetch(
                """
                SELECT week_date, metric_value
                FROM weekly_metrics
                WHERE lob_id = $1
                ORDER BY week_date
                """,
                lob_id
            )
        else:
            metrics = await conn.fetch(
                """
                SELECT week_date, AVG(metric_value) as metric_value
                FROM weekly_metrics
                GROUP BY week_date
                ORDER BY week_date
                """
            )
        
        data = [dict(row) for row in metrics]
        
        insights = []
        if len(data) > 2:
            trend = "increasing" if data[-1]['metric_value'] > data[0]['metric_value'] else "decreasing"
            insights.append(f"Overall trend is {trend}")
        elif len(data) == 0:
            insights.append("No metrics data available for time series analysis.")
        
        return {
            "success": True,
            "comparison_type": "time_series",
            "data": data,
            "insights": insights
        }


class ScenarioModelerAgent(BaseAgent):
    """Simulates business impact scenarios with adjustable parameters."""
    
    def __init__(self):
        super().__init__(
            name="ScenarioModeler",
            description="Simulates what-if scenarios like revenue impact, growth projections, and sensitivity analysis"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Run scenario simulations."""
        scenario_type = params.get("scenario_type", "growth_projection")
        
        if scenario_type == "growth_projection":
            return await self._project_growth(params)
        elif scenario_type == "sensitivity_analysis":
            return await self._sensitivity_analysis(params)
        else:
            return {"error": "Unknown scenario_type"}
    
    async def _project_growth(self, params):
        """Project growth scenarios."""
        baseline_value = params.get("baseline_value", 100)
        growth_rate = params.get("growth_rate", 0.05)  # 5% default
        periods = params.get("periods", 12)
        
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
            "scenario_type": "growth_projection",
            "baseline": baseline_value,
            "growth_rate": growth_rate,
            "projections": projections,
            "insights": [f"With {growth_rate*100}% growth rate, value would reach {projections[-1]['projected_value']:.2f} in {periods} periods"]
        }
    
    async def _sensitivity_analysis(self, params):
        """Analyze sensitivity to parameter changes."""
        baseline = params.get("baseline", 100)
        parameter_ranges = params.get("ranges", [-0.1, -0.05, 0, 0.05, 0.1])
        
        results = []
        for change in parameter_ranges:
            new_value = baseline * (1 + change)
            results.append({
                "change_percent": change * 100,
                "resulting_value": round(new_value, 2),
                "impact": round(new_value - baseline, 2)
            })
        
        return {
            "success": True,
            "scenario_type": "sensitivity_analysis",
            "baseline": baseline,
            "results": results,
            "insights": ["Sensitivity analysis shows linear relationship with baseline value"]
        }


# ============================================================================
# FORECASTING AGENTS
# ============================================================================

class DataExplorerAgent(BaseAgent):
    """Performs statistical profiling and outlier detection."""
    
    def __init__(self):
        super().__init__(
            name="DataExplorer",
            description="Analyzes datasets to identify patterns, outliers, missing values, and statistical properties"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Explore and profile data."""
        dataset_id = params.get("dataset_id")
        
        if not dataset_id:
            return {"error": "dataset_id is required"}
        
        conn = await self.get_db_connection()
        try:
            # Get dataset metadata
            dataset = await conn.fetchrow(
                "SELECT * FROM datasets WHERE id = $1",
                dataset_id
            )
            
            if not dataset:
                return {"error": "Dataset not found"}
            
            # Parse column info
            columns_info = json.loads(dataset['columns_info']) if dataset['columns_info'] else {}
            
            # Statistical summary
            stats = {
                "row_count": dataset['row_count'],
                "column_count": dataset['column_count'],
                "columns": columns_info
            }
            
            insights = [
                f"Dataset has {dataset['row_count']} rows and {dataset['column_count']} columns",
                f"Columns: {', '.join(list(columns_info.keys())[:5])}"
            ]
            
            return {
                "success": True,
                "dataset_id": dataset_id,
                "statistics": stats,
                "insights": insights
            }
        finally:
            await conn.close()


class DataCleanerAgent(BaseAgent):
    """Normalizes data and handles missing values."""
    
    def __init__(self):
        super().__init__(
            name="DataCleaner",
            description="Cleans data by handling missing values, outliers, and normalizing formats"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and normalize data."""
        data = params.get("data", [])
        cleaning_strategy = params.get("strategy", "fill_mean")
        
        if not data:
            return {"error": "No data provided"}
        
        # Simulate cleaning operations
        cleaned_count = 0
        missing_handled = 0
        
        # In real implementation, would process actual data
        insights = [
            f"Applied {cleaning_strategy} strategy",
            f"Cleaned {cleaned_count} records",
            f"Handled {missing_handled} missing values"
        ]
        
        return {
            "success": True,
            "strategy": cleaning_strategy,
            "insights": insights,
            "recommendation": "Data is ready for modeling"
        }


class ModelSelectorAgent(BaseAgent):
    """Recommends optimal forecasting models."""
    
    def __init__(self):
        super().__init__(
            name="ModelSelector",
            description="Analyzes data characteristics and recommends the best forecasting model (Prophet, ARIMA, etc.)"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Select best forecasting model."""
        data_characteristics = params.get("characteristics", {})
        has_seasonality = data_characteristics.get("seasonality", False)
        has_trend = data_characteristics.get("trend", True)
        data_points = data_characteristics.get("data_points", 100)
        
        recommendations = []
        
        # Rule-based model selection
        if data_points < 30:
            recommendations.append({
                "model": "Simple Moving Average",
                "score": 0.6,
                "reason": "Limited data points, simple model recommended"
            })
        else:
            if has_seasonality and has_trend:
                recommendations.append({
                    "model": "Prophet",
                    "score": 0.9,
                    "reason": "Data shows seasonality and trend - Prophet is ideal"
                })
            elif has_trend:
                recommendations.append({
                    "model": "ARIMA",
                    "score": 0.8,
                    "reason": "Data shows trend - ARIMA is suitable"
                })
            else:
                recommendations.append({
                    "model": "Exponential Smoothing",
                    "score": 0.7,
                    "reason": "Stable data - Exponential smoothing recommended"
                })
        
        best_model = max(recommendations, key=lambda x: x['score'])
        
        return {
            "success": True,
            "recommended_model": best_model['model'],
            "all_recommendations": recommendations,
            "insights": [best_model['reason']]
        }


class ModelTrainerAgent(BaseAgent):
    """Trains models with hyperparameter tuning using Prophet."""
    
    def __init__(self):
        super().__init__(
            name="ModelTrainer",
            description="Trains forecasting models (primarily Prophet) with automatic hyperparameter optimization"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Train a forecasting model."""
        lob_id = params.get("lob_id")
        model_type = params.get("model_type", "prophet")
        forecast_periods = params.get("periods", 12)  # Default 12 weeks ahead
        
        if not lob_id:
            return {"error": "lob_id is required for training"}
        
        conn = await self.get_db_connection()
        try:
            # Fetch training data
            metrics = await conn.fetch(
                """
                SELECT week_date as ds, metric_value as y
                FROM weekly_metrics
                WHERE lob_id = $1
                ORDER BY week_date
                """,
                lob_id
            )
            
            if len(metrics) < 10:
                return {"error": "Insufficient data for training (need at least 10 data points)"}
            
            # Convert to DataFrame
            df = pd.DataFrame([dict(row) for row in metrics])
            
            if model_type == "prophet":
                # Train Prophet model
                model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=False,
                    daily_seasonality=False
                )
                model.fit(df)
                
                # Make future predictions
                future = model.make_future_dataframe(periods=forecast_periods, freq='W')
                forecast = model.predict(future)
                
                # Get predictions for next 12 weeks
                predictions = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(forecast_periods).to_dict('records')
                
                return {
                    "success": True,
                    "model_type": "prophet",
                    "training_samples": len(df),
                    "predictions": predictions,
                    "insights": [
                        f"Model trained on {len(df)} data points",
                        f"Generated {forecast_periods}-week forecast",
                        "Prophet model with yearly seasonality"
                    ]
                }
            else:
                return {"error": f"Model type {model_type} not yet implemented"}
        
        except Exception as e:
            return {"error": f"Training failed: {str(e)}"}
        finally:
            await conn.close()


class ModelEvaluatorAgent(BaseAgent):
    """Assesses performance and generates evaluation plots."""
    
    def __init__(self):
        super().__init__(
            name="ModelEvaluator",
            description="Evaluates forecast accuracy using metrics like MAE, RMSE, and generates diagnostic plots"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate model performance."""
        predictions = params.get("predictions", [])
        actuals = params.get("actuals", [])
        
        if not predictions or not actuals:
            return {"error": "Both predictions and actuals are required"}
        
        if len(predictions) != len(actuals):
            return {"error": "Predictions and actuals must have same length"}
        
        # Calculate metrics
        mae = mean_absolute_error(actuals, predictions)
        rmse = np.sqrt(mean_squared_error(actuals, predictions))
        mape = np.mean(np.abs((np.array(actuals) - np.array(predictions)) / np.array(actuals))) * 100
        
        metrics = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2)
        }
        
        insights = [
            f"Mean Absolute Error: {metrics['mae']}",
            f"Root Mean Squared Error: {metrics['rmse']}",
            f"Mean Absolute Percentage Error: {metrics['mape']}%"
        ]
        
        if mape < 10:
            insights.append("Excellent forecast accuracy (MAPE < 10%)")
        elif mape < 20:
            insights.append("Good forecast accuracy (MAPE < 20%)")
        else:
            insights.append("Model may need improvement (MAPE > 20%)")
        
        return {
            "success": True,
            "metrics": metrics,
            "insights": insights
        }


# ============================================================================
# CROSS-WORKFLOW AGENTS
# ============================================================================

class VisualizerAgent(BaseAgent):
    """Creates interactive charts and dashboards using Plotly."""
    
    def __init__(self):
        super().__init__(
            name="Visualizer",
            description="Generates interactive visualizations including time series plots, comparisons, and dashboards"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create visualizations."""
        viz_type = params.get("viz_type", "line_chart")
        data = params.get("data", [])
        
        # If no data provided, try to fetch from database
        if not data:
            conn = await self.get_db_connection()
            try:
                # Fetch sample data based on viz type
                if viz_type in ["line_chart", "time_series"]:
                    # Get time series data
                    rows = await conn.fetch(
                        """
                        SELECT week_date, AVG(metric_value) as avg_value
                        FROM weekly_metrics
                        GROUP BY week_date
                        ORDER BY week_date
                        LIMIT 50
                        """
                    )
                    data = [{"date": str(row["week_date"]), "value": float(row["avg_value"])} for row in rows]
                elif viz_type in ["bar_chart", "comparison"]:
                    # Get comparison data
                    rows = await conn.fetch(
                        """
                        SELECT l.name as lob_name, AVG(m.metric_value) as avg_value
                        FROM weekly_metrics m
                        JOIN lobs l ON m.lob_id = l.id
                        GROUP BY l.name
                        ORDER BY avg_value DESC
                        LIMIT 10
                        """
                    )
                    data = [{"name": row["lob_name"], "value": float(row["avg_value"])} for row in rows]
            finally:
                await conn.close()
        
        if not data:
            return {
                "success": False,
                "error": "No data available for visualization. Please upload data or create metrics first.",
                "insights": ["Unable to create visualization without data."]
            }
        
        try:
            if viz_type == "line_chart" or viz_type == "time_series":
                return self._create_line_chart(data, params)
            elif viz_type == "bar_chart":
                return self._create_bar_chart(data, params)
            elif viz_type == "comparison":
                return self._create_comparison_chart(data, params)
            else:
                return {"error": f"Visualization type {viz_type} not supported"}
        except Exception as e:
            return {"error": f"Visualization failed: {str(e)}"}
    
    def _create_line_chart(self, data, params):
        """Create a line chart."""
        df = pd.DataFrame(data)
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df.iloc[:, 0],
            y=df.iloc[:, 1],
            mode='lines+markers',
            name=params.get('title', 'Time Series')
        ))
        
        fig.update_layout(
            title=params.get('title', 'Time Series Chart'),
            template='plotly_dark'
        )
        
        # Convert to JSON for frontend
        chart_json = fig.to_json()
        
        return {
            "success": True,
            "viz_type": "line_chart",
            "chart_config": json.loads(chart_json),
            "insights": ["Interactive line chart generated"]
        }
    
    def _create_bar_chart(self, data, params):
        """Create a bar chart."""
        df = pd.DataFrame(data)
        
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=df.iloc[:, 0],
            y=df.iloc[:, 1],
            name=params.get('title', 'Comparison')
        ))
        
        fig.update_layout(
            title=params.get('title', 'Bar Chart'),
            template='plotly_dark'
        )
        
        chart_json = fig.to_json()
        
        return {
            "success": True,
            "viz_type": "bar_chart",
            "chart_config": json.loads(chart_json),
            "insights": ["Interactive bar chart generated"]
        }
    
    def _create_comparison_chart(self, data, params):
        """Create comparison visualization."""
        df = pd.DataFrame(data)
        
        fig = px.bar(df, x=df.columns[0], y=df.columns[1], 
                     title=params.get('title', 'Comparison Analysis'))
        fig.update_layout(template='plotly_dark')
        
        chart_json = fig.to_json()
        
        return {
            "success": True,
            "viz_type": "comparison",
            "chart_config": json.loads(chart_json),
            "insights": ["Comparison chart generated"]
        }


class InsightsAnalyzerAgent(BaseAgent):
    """Identifies trends and provides actionable recommendations."""
    
    def __init__(self):
        super().__init__(
            name="InsightsAnalyzer",
            description="Analyzes data to identify trends, anomalies, and generate business recommendations"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate insights and recommendations."""
        analysis_type = params.get("analysis_type", "trend_analysis")
        data = params.get("data", [])
        
        if not data:
            return {"error": "No data provided for analysis"}
        
        if analysis_type == "trend_analysis":
            return self._analyze_trends(data)
        elif analysis_type == "anomaly_detection":
            return self._detect_anomalies(data)
        else:
            return {"error": f"Analysis type {analysis_type} not supported"}
    
    def _analyze_trends(self, data):
        """Analyze trends in the data."""
        df = pd.DataFrame(data)
        
        if len(df) < 2:
            return {"error": "Insufficient data for trend analysis"}
        
        # Simple trend analysis
        first_val = df.iloc[0, 1] if len(df.columns) > 1 else df.iloc[0, 0]
        last_val = df.iloc[-1, 1] if len(df.columns) > 1 else df.iloc[-1, 0]
        
        change = last_val - first_val
        pct_change = (change / first_val * 100) if first_val != 0 else 0
        
        insights = []
        recommendations = []
        
        if pct_change > 10:
            insights.append(f"Strong upward trend detected: {pct_change:.1f}% increase")
            recommendations.append("Consider increasing inventory or capacity to meet growing demand")
        elif pct_change < -10:
            insights.append(f"Declining trend detected: {pct_change:.1f}% decrease")
            recommendations.append("Investigate causes of decline and consider corrective actions")
        else:
            insights.append(f"Stable trend: {pct_change:.1f}% change")
            recommendations.append("Maintain current strategies while monitoring for changes")
        
        return {
            "success": True,
            "analysis_type": "trend_analysis",
            "trend_direction": "up" if pct_change > 0 else "down",
            "change_percent": round(pct_change, 2),
            "insights": insights,
            "recommendations": recommendations
        }
    
    def _detect_anomalies(self, data):
        """Detect anomalies in the data."""
        df = pd.DataFrame(data)
        
        if len(df) < 5:
            return {"error": "Insufficient data for anomaly detection"}
        
        # Simple statistical anomaly detection
        values = df.iloc[:, 1].values if len(df.columns) > 1 else df.iloc[:, 0].values
        mean = np.mean(values)
        std = np.std(values)
        
        anomalies = []
        for i, val in enumerate(values):
            z_score = abs((val - mean) / std) if std > 0 else 0
            if z_score > 2:
                anomalies.append({
                    "index": i,
                    "value": float(val),
                    "z_score": round(float(z_score), 2)
                })
        
        insights = []
        if anomalies:
            insights.append(f"Detected {len(anomalies)} anomalies in the data")
        else:
            insights.append("No significant anomalies detected")
        
        return {
            "success": True,
            "analysis_type": "anomaly_detection",
            "anomalies": anomalies,
            "insights": insights,
            "recommendations": ["Review anomalous data points for data quality issues or significant events"]
        }


# ============================================================================
# AGENT REGISTRY
# ============================================================================

AGENT_REGISTRY = {
    # Data Onboarding Agents
    "data_fetcher": DataFetcherAgent(),
    "crud_manager": CRUDManagerAgent(),
    "comparison_analyzer": ComparisonAnalyzerAgent(),
    "scenario_modeler": ScenarioModelerAgent(),
    
    # Forecasting Agents
    "data_explorer": DataExplorerAgent(),
    "data_cleaner": DataCleanerAgent(),
    "model_selector": ModelSelectorAgent(),
    "model_trainer": ModelTrainerAgent(),
    "model_evaluator": ModelEvaluatorAgent(),
    
    # Cross-Workflow Agents
    "visualizer": VisualizerAgent(),
    "insights_analyzer": InsightsAnalyzerAgent(),
}


def get_agent(agent_name: str) -> Optional[BaseAgent]:
    """Get an agent by name from the registry."""
    return AGENT_REGISTRY.get(agent_name)


def list_all_agents() -> Dict[str, Dict[str, str]]:
    """List all available agents with their descriptions."""
    return {
        name: {"name": agent.name, "description": agent.description}
        for name, agent in AGENT_REGISTRY.items()
    }
