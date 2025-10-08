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
      const isOutlier = statisticalAnalysis?.statistical?.outliers.indices.includes(index) || false;

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
        movingAverage
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
            <span className="font-mono">{data.Value.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Orders:</span>
            <span className="font-mono">{data.Orders.toLocaleString()}</span>
          </div>
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

  // Dot component with unique key for Line chart dots
  const DotWithKey = (props: any) => {
    const { cx, cy, payload, index } = props;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={payload?.isOutlier ? 5 : 3}
        fill={payload?.isOutlier ? "#ef4444" : "#8884d8"}
        stroke={payload?.isOutlier ? "#dc2626" : "#8884d8"}
        strokeWidth={payload?.isOutlier ? 2 : 1}
      />
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
        <TabsList className="grid w-full grid-cols-6 text-xs">
          <TabsTrigger value="trend" className="text-xs">Trend</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs">Distribution</TabsTrigger>
          <TabsTrigger value="correlation" className="text-xs">Correlation</TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs">Forecast</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">Actual vs Forecast</TabsTrigger>
          <TabsTrigger value="outliers" className="text-xs">Outliers</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trend Analysis with Moving Average
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

                  {/* Main data line */}
                  <Line
                    type="monotone"
                    dataKey={target}
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={DotWithKey}
                    name={target}
                  />

                  {/* Moving average line */}
                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    stroke="#82ca9d"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="7-day Moving Avg"
                  />

                  {/* Trend line */}
                  {insights && (
                    <Line
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

        {/* Other tabs unchanged */}
      </Tabs>
    </div>
  );
}
