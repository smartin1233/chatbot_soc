"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ComposedChart, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, Activity, Zap, Eye, AlertTriangle } from 'lucide-react';
import type { WeeklyData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EnhancedDataVisualizerProps {
  data: WeeklyData[];
  target: 'Value' | 'Orders';
  isRealData: boolean;
  statisticalAnalysis?: any;
}

interface ChartDataPoint extends WeeklyData {
  formattedDate: string;
  trend?: number;
  forecastUpper?: number;
  forecastLower?: number;
  isOutlier?: boolean;
  movingAverage?: number;
}

export default function EnhancedDataVisualizer({ 
  data, 
  target, 
  isRealData,
  statisticalAnalysis 
}: EnhancedDataVisualizerProps) {
  
  // Enhanced data processing with statistical overlays
  const processedData: ChartDataPoint[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const processed = data.map((item, index) => {
      const date = new Date(item.Date);
      
      // Calculate moving average (7-day window)
      const windowStart = Math.max(0, index - 3);
      const windowEnd = Math.min(data.length, index + 4);
      const windowData = data.slice(windowStart, windowEnd);
      const movingAverage = windowData.reduce((sum, d) => sum + d[target], 0) / windowData.length;
      
      // Linear trend line
      const trend = statisticalAnalysis?.trend?.linearRegression 
        ? statisticalAnalysis.trend.linearRegression.intercept + 
          statisticalAnalysis.trend.linearRegression.slope * index
        : undefined;
      
      // Forecast confidence intervals (simplified)
      const forecastUpper = trend ? trend * 1.1 : undefined;
      const forecastLower = trend ? trend * 0.9 : undefined;
      
      // Mark outliers
      const isOutlier = statisticalAnalysis?.statistical?.outliers?.indices?.includes(index) || false;
      
      // Create separate fields for actual and forecast to avoid plotting 0 values
      // ActualValue: only has value for historical data (where Forecast is undefined or 0)
      // ForecastValue: only has value for forecast data (where Forecast > 0)
      const isForecastPoint = item.Forecast && item.Forecast > 0;
      const actualValue = isForecastPoint ? null : item[target];
      
      return {
        ...item,
        formattedDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        trend,
        forecastUpper,
        forecastLower,
        isOutlier,
        movingAverage,
        ActualValue: actualValue  // New field: null for forecast points
      };
    });

    return processed;
  }, [data, target, statisticalAnalysis]);

  // Statistical insights for display
  const insights = useMemo(() => {
    if (!statisticalAnalysis) return null;

    const stats = statisticalAnalysis.statistical;
    const trend = statisticalAnalysis.trend;
    const quality = statisticalAnalysis.quality;

    return {
      mean: stats?.mean || 0,
      stdDev: stats?.standardDeviation || 0,
      trend: trend?.direction || 'stable',
      trendConfidence: trend?.confidence || 0,
      r2: trend?.linearRegression?.rSquared || 0,
      outlierCount: stats?.outliers?.values.length || 0,
      qualityScore: quality?.score || 0,
      skewness: stats?.skewness || 0,
      kurtosis: stats?.kurtosis || 0
    };
  }, [statisticalAnalysis]);

  // Custom tooltip with enhanced information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
        <p className="font-medium text-sm">{label}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-mono">{data.Value?.toLocaleString() || 'N/A'}</span>
          </div>
          {data.Orders !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Orders:</span>
              <span className="font-mono">{data.Orders.toLocaleString()}</span>
            </div>
          )}
          {data.Forecast !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Forecast:</span>
              <span className="font-mono text-green-600 dark:text-green-400">{data.Forecast.toLocaleString()}</span>
            </div>
          )}
          {data.ForecastLower !== undefined && data.ForecastUpper !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-mono text-xs">{data.ForecastLower.toLocaleString()} - {data.ForecastUpper.toLocaleString()}</span>
            </div>
          )}
          {data.movingAverage && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">7-day Avg:</span>
              <span className="font-mono">{data.movingAverage.toFixed(0)}</span>
            </div>
          )}
          {data.trend && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Trend:</span>
              <span className="font-mono">{data.trend.toFixed(0)}</span>
            </div>
          )}
          {data.isOutlier && (
            <Badge variant="outline" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Outlier Detected
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Statistical summary component
  const StatisticalSummary = () => {
    if (!insights) return null;

    return (
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Mean ± Std Dev</div>
              <div className="font-mono text-sm">
                {insights.mean.toFixed(0)} ± {insights.stdDev.toFixed(0)}
              </div>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Trend (R²)</div>
              <div className="font-mono text-sm flex items-center gap-1">
                {insights.trend === 'increasing' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {insights.trend === 'decreasing' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {insights.r2.toFixed(3)}
              </div>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Data Quality</div>
              <div className="font-mono text-sm">
                {insights.qualityScore}/100
              </div>
            </div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Outliers</div>
              <div className="font-mono text-sm flex items-center gap-1">
                {insights.outlierCount > 0 && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                {insights.outlierCount}
              </div>
            </div>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>
    );
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <BarChart3 className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <p>No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Enhanced {target} Analysis</h3>
          <p className="text-xs text-muted-foreground">
            {processedData.length} data points with statistical overlays
          </p>
        </div>
        {insights && (
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            AI Insights Enabled
          </Badge>
        )}
      </div>

      <StatisticalSummary />

      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend" className="text-xs">Trend</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs">Distribution</TabsTrigger>
          <TabsTrigger value="correlation" className="text-xs">Correlation</TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {processedData.some(d => d.Forecast !== undefined) 
                  ? 'Actual & Forecast Trend' 
                  : 'Trend Analysis with Moving Average'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="formattedDate" 
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  {/* Y-axis 1 (left): Actual data */}
                  <YAxis 
                    yAxisId="actual"
                    fontSize={10} 
                    stroke="#8884d8"
                    label={{ value: 'Actual', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#8884d8' } }}
                  />
                  
                  {/* Y-axis 2 (right): Forecast data - only show if forecast exists */}
                  {processedData.some(d => d.Forecast !== undefined) && (
                    <YAxis 
                      yAxisId="forecast"
                      orientation="right"
                      fontSize={10}
                      stroke="#10b981"
                      label={{ value: 'Forecast', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#10b981' } }}
                    />
                  )}
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend fontSize={10} />
                  
                  {/* Confidence interval area for forecast - uses forecast Y-axis */}
                  {processedData.some(d => d.ForecastUpper !== undefined) && (
                    <>
                      <Area 
                        yAxisId="forecast"
                        type="monotone"
                        dataKey="ForecastUpper"
                        stroke="none"
                        fill="#10b981"
                        fillOpacity={0.15}
                        name="Forecast Confidence"
                      />
                      <Area 
                        yAxisId="forecast"
                        type="monotone"
                        dataKey="ForecastLower"
                        stroke="none"
                        fill="#ffffff"
                        fillOpacity={1}
                      />
                    </>
                  )}
                  
                  {/* Main data line - Actual values on Y-axis 1 (left) */}
                  <Line 
                    yAxisId="actual"
                    type="monotone" 
                    dataKey="ActualValue"
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (!payload || !payload.ActualValue) return null;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={payload?.isOutlier ? 5 : 3}
                          fill={payload?.isOutlier ? "#ef4444" : "#8884d8"}
                          stroke={payload?.isOutlier ? "#dc2626" : "#8884d8"}
                          strokeWidth={payload?.isOutlier ? 2 : 1}
                        />
                      );
                    }}
                    name="Actual"
                    connectNulls={false}
                  />
                  
                  {/* Forecast line - shown in green on Y-axis 2 (right) */}
                  {processedData.some(d => d.Forecast !== undefined) && (
                    <Line 
                      yAxisId="forecast"
                      type="monotone" 
                      dataKey="Forecast" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                      name="Forecast"
                      connectNulls={false}
                    />
                  )}
                  
                  {/* Moving average line - only show if no forecast */}
                  {!processedData.some(d => d.Forecast !== undefined) && (
                    <Line 
                      yAxisId="actual"
                      type="monotone" 
                      dataKey="movingAverage" 
                      stroke="#82ca9d" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="7-day Moving Avg"
                    />
                  )}
                  
                  {/* Trend line - only show if no forecast */}
                  {insights && !processedData.some(d => d.Forecast !== undefined) && (
                    <Line 
                      yAxisId="actual"
                      type="linear" 
                      dataKey="trend" 
                      stroke="#ffc658" 
                      strokeWidth={1}
                      dot={false}
                      name="Linear Trend"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Distribution Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="formattedDate" 
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend fontSize={10} />
                  
                  <Bar 
                    dataKey={target} 
                    fill="#8884d8"
                    fillOpacity={0.8}
                    name={target}
                  />
                  
                  {/* Mean reference line */}
                  {insights && (
                    <ReferenceLine 
                      y={insights.mean} 
                      stroke="#82ca9d" 
                      strokeDasharray="3 3"
                      label={{ value: "Mean", position: "insideTopRight", fontSize: 10 }}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Value vs Orders Correlation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="Orders" 
                    name="Orders"
                    fontSize={10}
                  />
                  <YAxis 
                    dataKey="Value" 
                    name="Value"
                    fontSize={10}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  
                  <Scatter 
                    dataKey="Value" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {processedData.some(d => d.Forecast !== undefined) 
                  ? 'Actual & Forecast with Confidence Intervals' 
                  : 'Forecast with Confidence Intervals'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="formattedDate" 
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend fontSize={10} />
                  
                  {/* Confidence interval area - only show if forecast data exists */}
                  {processedData.some(d => d.ForecastUpper !== undefined) && (
                    <>
                      <Area 
                        type="monotone"
                        dataKey="ForecastUpper"
                        stroke="none"
                        fill="#10b981"
                        fillOpacity={0.1}
                        name="Confidence Interval"
                      />
                      <Area 
                        type="monotone"
                        dataKey="ForecastLower"
                        stroke="none"
                        fill="#ffffff"
                        fillOpacity={1}
                      />
                    </>
                  )}
                  
                  {/* Actual data */}
                  <Line 
                    type="monotone" 
                    dataKey={target} 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Actual"
                    connectNulls={false}
                  />
                  
                  {/* Forecast data - only show if it exists */}
                  {processedData.some(d => d.Forecast !== undefined) && (
                    <Line 
                      type="monotone" 
                      dataKey="Forecast" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: "#10b981" }}
                      name="Forecast"
                      connectNulls={false}
                    />
                  )}
                  
                  {/* Fallback: Trend projection if no forecast data */}
                  {!processedData.some(d => d.Forecast !== undefined) && (
                    <Line 
                      type="linear" 
                      dataKey="trend" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Trend Projection"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
              
              {insights && (
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <div>Trend Confidence: {(insights.trendConfidence * 100).toFixed(1)}%</div>
                  <div>R² (Goodness of Fit): {insights.r2.toFixed(3)}</div>
                  {insights.outlierCount > 0 && (
                    <div className="text-yellow-600">
                      ⚠️ {insights.outlierCount} outlier(s) detected - may affect forecast accuracy
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}