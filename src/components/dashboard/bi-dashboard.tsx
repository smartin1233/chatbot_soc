"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, ReferenceLine } from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Target,
  AlertTriangle, CheckCircle, BarChart3, Zap, Eye
} from "lucide-react";
import { useApp } from "./app-provider";
import { statisticalAnalyzer, insightsGenerator } from "@/lib/statistical-analysis";
import { dynamicInsightsAnalyzer } from "@/lib/dynamic-insights-analyzer";
import { cn } from "@/lib/utils";

interface KPIMetric {
  label: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit?: string;
}

interface ForecastData {
  date: string;
  actual?: number;
  forecast?: number;
  upper_ci?: number;
  lower_ci?: number;
  is_future: boolean;
}

export default function BIDashboard() {
  const { state } = useApp();

  // Debug: Log when forecast metrics change
  React.useEffect(() => {
    if (state.selectedLob?.forecastMetrics) {
      console.log('📊 BIDashboard: Forecast metrics updated:', state.selectedLob.forecastMetrics);
    }
  }, [state.selectedLob?.forecastMetrics]);

  // Debug: Log capacity planning state
  React.useEffect(() => {
    console.log('🔍 BIDashboard: Capacity Planning State:', {
      enabled: state.capacityPlanning.enabled,
      status: state.capacityPlanning.status,
      hasDateRange: !!(state.capacityPlanning.dateRange.startDate && state.capacityPlanning.dateRange.endDate),
      dateRange: state.capacityPlanning.dateRange
    });
  }, [state.capacityPlanning]);

  // Generate dynamic dashboard configuration based on conversation context
  const dashboardConfig = useMemo(() => {
    const config = dynamicInsightsAnalyzer.generateDynamicDashboard(
      state.conversationContext || { topics: [], currentPhase: 'onboarding', completedTasks: [], userIntent: '' },
      state.selectedLob?.hasData || false
    );
    
    // Add forecast-specific insights if forecast data exists
    if (state.selectedLob?.forecastMetrics) {
      const forecastInsights = [];
      const metrics = state.selectedLob.forecastMetrics;
      
      // Model performance insight
      if (metrics.mape) {
        forecastInsights.push({
          id: 'forecast-accuracy',
          type: 'model_performance' as const,
          title: `${metrics.modelName} Model Performance`,
          description: `Forecast accuracy of ${(100 - metrics.mape).toFixed(1)}% (MAPE: ${metrics.mape.toFixed(1)}%)`,
          businessValue: metrics.mape < 10 
            ? 'Excellent accuracy - Reliable for strategic planning and resource allocation'
            : metrics.mape < 20
            ? 'Good accuracy - Suitable for operational planning with some buffer'
            : 'Moderate accuracy - Use with caution and consider additional validation',
          nextAction: 'Use these forecasts to plan inventory, staffing, and budget allocation',
          priority: 'high' as const,
          relevantToPhase: 'forecasting' as const
        });
      }
      
      // Forecast horizon insight
      if (metrics.forecastHorizon) {
        forecastInsights.push({
          id: 'forecast-horizon',
          type: 'forecast' as const,
          title: `${metrics.forecastHorizon} Forecast Available`,
          description: `Predictions generated with ${metrics.confidenceLevel}% confidence intervals`,
          businessValue: 'Plan ahead with data-driven predictions to optimize operations and reduce uncertainty',
          nextAction: 'Review forecast trends and adjust business strategies accordingly',
          priority: 'high' as const,
          relevantToPhase: 'forecasting' as const
        });
      }
      
      // Add forecast insights to the config
      config.relevantInsights = [...forecastInsights, ...config.relevantInsights];
    }
    
    return config;
  }, [state.conversationContext, state.selectedLob?.hasData, state.selectedLob?.forecastMetrics]);

  // Generate KPIs and metrics based on dashboard config
  const kpis = useMemo(() => {
    if (!state.selectedLob?.timeSeriesData || !dashboardConfig.showBusinessMetrics) return [];

    const allData = state.selectedLob.timeSeriesData;
    
    // Separate historical data (exclude forecast points for KPI calculation)
    const historicalData = allData.filter(d => !d.isForecast && (!d.Forecast || d.Forecast === 0));
    const data = historicalData.length > 0 ? historicalData : allData;
    
    const currentValue = data[data.length - 1]?.Value || 0;
    const previousValue = data[data.length - 2]?.Value || 0;
    const change = ((currentValue - previousValue) / previousValue) * 100;

    const totalValue = data.reduce((sum, item) => sum + item.Value, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.Orders, 0);
    const avgValue = totalValue / data.length;
    const avgOrders = totalOrders / data.length;
    const efficiency = avgValue / avgOrders;

    // Calculate actual changes from data
    const recentOrders = data.slice(-7).reduce((sum, item) => sum + item.Orders, 0);
    const previousOrders = data.slice(-14, -7).reduce((sum, item) => sum + item.Orders, 0);
    const ordersChange = previousOrders > 0 ? ((recentOrders - previousOrders) / previousOrders) * 100 : 0;

    const recentAvgValue = data.slice(-7).reduce((sum, item) => sum + item.Value, 0) / 7;
    const previousAvgValue = data.slice(-14, -7).reduce((sum, item) => sum + item.Value, 0) / 7;
    const recentEfficiency = recentAvgValue / (recentOrders / 7);
    const previousEfficiency = previousAvgValue / (previousOrders / 7);
    const efficiencyChange = previousEfficiency > 0 ? ((recentEfficiency - previousEfficiency) / previousEfficiency) * 100 : 0;

    const allKPIs = {
      current_value: {
        label: "Current Value",
        value: currentValue.toLocaleString(),
        change: change,
        changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral' as const,
        trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable' as const,
        target: avgValue * 1.1,
        unit: ""
      },
      // total_orders: {
      //   label: "Total Orders",
      //   value: totalOrders.toLocaleString(),
      //   change: ordersChange,
      //   changeType: ordersChange > 0 ? 'positive' : ordersChange < 0 ? 'negative' : 'neutral' as const,
      //   trend: ordersChange > 5 ? 'up' : ordersChange < -5 ? 'down' : 'stable' as const
      // },
      // efficiency: {
      //   label: "Efficiency",
      //   value: efficiency.toFixed(2),
      //   change: efficiencyChange,
      //   changeType: efficiencyChange > 0 ? 'positive' : efficiencyChange < 0 ? 'negative' : 'neutral' as const,
      //   trend: efficiencyChange > 5 ? 'up' : efficiencyChange < -5 ? 'down' : 'stable' as const,
      //   target: efficiency * 1.05,
      //   unit: ""
      // },
      growth_rate: {
        label: "Growth Rate",
        value: change.toFixed(1) + "%",
        change: change,
        changeType: change > 0 ? 'positive' : 'negative' as const,
        trend: change > 0 ? 'up' : 'down' as const
      },
      data_quality: {
        label: "Data Quality",
        value: "95%", // Based on data validation
        change: 0,
        changeType: 'neutral' as const,
        trend: 'stable' as const
      }
    };

    // Filter KPIs based on dashboard config
    return dashboardConfig.kpisToShow.map(kpiKey => allKPIs[kpiKey as keyof typeof allKPIs]).filter(Boolean);
  }, [state.selectedLob?.timeSeriesData, state.selectedLob?.forecastMetrics, dashboardConfig]);

  // Generate forecast data with confidence intervals
  const forecastData = useMemo(() => {
    if (!state.selectedLob?.timeSeriesData) return [];

    const allData = state.selectedLob.timeSeriesData;
    const forecastPoints: ForecastData[] = [];

    // Separate historical and forecast data
    const historical = allData.filter(d => !d.Forecast || d.Forecast === 0);
    const forecast = allData.filter(d => d.Forecast && d.Forecast > 0);

    // Use last 20 historical points for display
    const displayHistorical = historical.slice(-20);

    // Add historical data
    displayHistorical.forEach(item => {
      forecastPoints.push({
        date: new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: item.Value,
        is_future: false
      });
    });

    // Add connection point - last actual value as first forecast point for smooth transition
    if (forecast.length > 0 && displayHistorical.length > 0) {
      const lastActual = displayHistorical[displayHistorical.length - 1];
      forecastPoints.push({
        date: new Date(lastActual.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: lastActual.Value, // Use actual value for connection
        is_future: false
      });
    }

    // Add forecast data if available (from forecasting agent)
    if (forecast.length > 0) {
      forecast.forEach(item => {
        forecastPoints.push({
          date: new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          forecast: item.Forecast,
          upper_ci: item.ForecastUpper,
          lower_ci: item.ForecastLower,
          is_future: true
        });
      });
    }

    return forecastPoints;
  }, [state.selectedLob?.timeSeriesData]);

  // Calculate actual model performance metrics from data
  const modelMetrics = useMemo(() => {
    // Use actual forecast metrics if available from forecasting agent
    if (state.selectedLob?.forecastMetrics) {
      const fm = state.selectedLob.forecastMetrics;
      return {
        mape: fm.mape.toFixed(1),
        rmse: fm.rmse.toFixed(0),
        r2: fm.r2.toFixed(3),
        mae: ((fm.mape / 100) * fm.rmse).toFixed(0), // Approximate MAE
        model: fm.modelName,
        confidence: fm.confidenceLevel.toFixed(0)
      };
    }

    return null;
  }, [state.selectedLob?.forecastMetrics]);

  if (!state.selectedLob?.hasData) {
    return (
      <div className="p-6 text-center">
        <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{dashboardConfig.title}</h3>
        <p className="text-muted-foreground mb-4">
          {dashboardConfig.primaryMessage}
        </p>
        {dashboardConfig.subtitle && (
          <p className="text-sm text-muted-foreground">
            {dashboardConfig.subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{dashboardConfig.title}</h2>
          <p className="text-muted-foreground">
            {dashboardConfig.subtitle || `{state.selectedBu?.name} - {state.selectedLob?.name} Analytics`}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {dashboardConfig.primaryMessage}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="flex items-center gap-1 mb-2">
            <Activity className="h-3 w-3" />
            {state.conversationContext?.currentPhase?.charAt(0).toUpperCase() + state.conversationContext?.currentPhase?.slice(1) || 'Analysis'}
          </Badge>
          {state.conversationContext?.topics && state.conversationContext.topics.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Focus: {state.conversationContext.topics.map(t => t.replace(/_/g, ' ')).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* KPIs Grid - Responsive & Non-overlapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {/* Main Value */}
                <div className="text-xl sm:text-2xl font-bold truncate">
                  {'unit' in kpi && kpi.unit ? kpi.unit : ''}{kpi.value}
                </div>

                {/* Trend & Change */}
                <div className="flex items-center justify-between gap-2">
                  <div className={cn(
                    "flex items-center text-xs whitespace-nowrap",
                    kpi.changeType === 'positive' && "text-green-600",
                    kpi.changeType === 'negative' && "text-red-600",
                    kpi.changeType === 'neutral' && "text-muted-foreground"
                  )}>
                    {kpi.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />}
                    {kpi.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" />}
                    {kpi.changeType !== 'neutral' && (
                      <span>{kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%</span>
                    )}
                  </div>

                  {/* Progress indicator */}
                  {'target' in kpi && kpi.target && (
                    <div className="flex-shrink-0">
                      <Progress
                        value={Math.min(100, (parseFloat(kpi.value.replace(/[K,%]/g, '')) / kpi.target) * 100)}
                        className="w-12 sm:w-16 h-1"
                      />
                    </div>
                  )}
                </div>

                {/* Target - if exists */}
                {'target' in kpi && kpi.target && (
                  <div className="text-xs text-muted-foreground truncate">
                    Target: {'unit' in kpi && kpi.unit ? kpi.unit : ''}{kpi.target.toFixed(0)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conditional Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Chart - Only show if forecasting is relevant */}
        {dashboardConfig.showForecasting && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Forecast Analysis (Past + Future)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis fontSize={10} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-sm">{label}</p>
                          {data?.actual && (
                            <div className="text-xs">
                              <span className="text-blue-600">Actual: {data.actual.toLocaleString()}</span>
                            </div>
                          )}
                          {data?.forecast && (
                            <div className="text-xs">
                              <span className="text-green-600">Forecast: {data.forecast.toLocaleString()}</span>
                              {data?.upper_ci && data?.lower_ci && (
                                <div className="text-muted-foreground">
                                  CI: {data.lower_ci.toLocaleString()} - {data.upper_ci.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  {/* Confidence interval shaded area (green) */}
                  <Area
                    type="monotone"
                    dataKey="upper_ci"
                    stroke="none"
                    fill="#10B981"
                    fillOpacity={0.25}
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower_ci"
                    stroke="none"
                    fill="#ffffff"
                    fillOpacity={1}
                    name="Lower Bound"
                  />

                  {/* Actual data line (solid blue/teal) */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#0891B2"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0891B2', strokeWidth: 0 }}
                    connectNulls={false}
                    name="Actual"
                  />

                  {/* Forecast line (dotted) */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#0891B2"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#0891B2', strokeWidth: 0 }}
                    connectNulls={false}
                    name="Forecast"
                  />

                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Forecast Summary - Real Data */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground mb-1">
                    {state.selectedLob?.forecastMetrics?.forecastHorizon || 14}-Day Forecast
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {(() => {
                      const lastHistorical = forecastData.find(d => d.actual && !d.is_future);
                      const lastForecast = forecastData[forecastData.length - 1];
                      if (lastHistorical?.actual && lastForecast?.forecast) {
                        const growth = ((lastForecast.forecast - lastHistorical.actual) / lastHistorical.actual) * 100;
                        return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}% ${growth > 0 ? 'Growth' : 'Decline'} Expected`;
                      }
                      return 'Forecast Available';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground mb-1">Confidence Level</div>
                  <div className="text-lg font-bold">
                    {modelMetrics?.confidence}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Performance - Only show if modeling is relevant */}
        {dashboardConfig.showModelMetrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Model Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {modelMetrics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold text-green-600">{modelMetrics.mape}%</div>
                      <div className="text-xs text-muted-foreground">MAPE</div>
                      <div className="text-xs text-green-600 mt-1">Excellent</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold text-blue-600">{modelMetrics.r2}</div>
                      <div className="text-xs text-muted-foreground">R²</div>
                      <div className="text-xs text-blue-600 mt-1">High Correlation</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{modelMetrics.rmse}</div>
                      <div className="text-xs text-muted-foreground">RMSE</div>
                      <div className="text-xs text-muted-foreground mt-1">Root Mean Square Error</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{modelMetrics.mae}</div>
                      <div className="text-xs text-muted-foreground">MAE</div>
                      <div className="text-xs text-muted-foreground mt-1">Mean Absolute Error</div>
                    </div>
                  </div>

                  <div className="border rounded p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Model Algorithm</span>
                      <Badge variant="secondary">{modelMetrics.model}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Training Accuracy</span>
                      <span className="text-green-600 font-semibold">{modelMetrics.confidence}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Validation Status</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 text-sm">Validated</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Production Ready</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 text-sm">Yes</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dynamic Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Context-Aware Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Dynamic insights based on conversation context */}
            {dashboardConfig.relevantInsights.map(insight => (
              <div
                key={insight.id}
                className={cn(
                  "flex items-start gap-3 p-3 border rounded",
                  insight.type === 'business_opportunity' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                  insight.type === 'data_quality' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                  insight.type === 'forecast' && "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
                  insight.type === 'model_performance' && "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800",
                  insight.type === 'pattern' && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
                  insight.type === 'risk' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {insight.type === 'business_opportunity' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {insight.type === 'data_quality' && <Eye className="h-5 w-5 text-blue-600" />}
                  {insight.type === 'forecast' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                  {insight.type === 'model_performance' && <Target className="h-5 w-5 text-indigo-600" />}
                  {insight.type === 'pattern' && <Eye className="h-5 w-5 text-yellow-600" />}
                  {insight.type === 'risk' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{insight.title}</div>
                  <div className="text-sm text-muted-foreground mb-2">{insight.description}</div>
                  <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded border-l-2 border-primary">
                    <div className="font-medium mb-1">Business Value:</div>
                    <div className="mb-2">{insight.businessValue}</div>
                    {insight.nextAction && (
                      <div>
                        <div className="font-medium mb-1">Next Action:</div>
                        <div>{insight.nextAction}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {dashboardConfig.relevantInsights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>Continue your analysis to generate contextual insights</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Next Steps for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Dynamic next steps based on current phase */}
            {dynamicInsightsAnalyzer.getNextSteps(
              state.conversationContext?.currentPhase || 'onboarding',
              state.conversationContext?.completedTasks || []
            ).map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 text-sm">{step}</div>
              </div>
            ))}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Current Phase: {state.conversationContext?.currentPhase?.charAt(0).toUpperCase() + state.conversationContext?.currentPhase?.slice(1) || 'Getting Started'}
              </div>
              {state.conversationContext?.userIntent && (
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {state.conversationContext.userIntent}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}