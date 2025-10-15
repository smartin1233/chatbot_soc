'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  Bar,
  Scatter,
  ComposedChart,
  Area
} from 'recharts';
import type { WeeklyData } from '@/lib/types';
import { format } from 'date-fns';

type ChartType = 'line' | 'bar';

interface DataVisualizerProps {
  data: WeeklyData[];
  target: 'Value' | 'Orders';
  isRealData: boolean;
  showOutliers?: boolean; // Only show outliers when user asks about exploration/preprocessing
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;

    // Check if this is a forecast point or actual data point
    const isForecastPoint = dataPoint.Forecast !== undefined && dataPoint.Forecast > 0;

    return (
      <div className="bg-background border p-2 rounded-lg shadow-lg">
        <p className="font-bold">{dataPoint.formattedDate}</p>

        {/* Show Actual data label for historical points */}
        {!isForecastPoint && dataPoint.Value !== undefined && dataPoint.Value !== null && (
          <p className="text-sm text-primary font-semibold">Actual: {dataPoint.Value?.toLocaleString()}</p>
        )}

        {/* Show Orders for actual data points */}
        {!isForecastPoint && dataPoint.Orders !== undefined && dataPoint.Orders > 0 && (
          <p className="text-sm text-muted-foreground">Orders: {dataPoint.Orders?.toLocaleString()}</p>
        )}

        {/* Show Forecast data label for forecast points */}
        {isForecastPoint && (
          <p className="text-sm text-blue-600 font-semibold">Forecast: {dataPoint.Forecast?.toLocaleString()}</p>
        )}

        {/* Show confidence interval for forecast points */}
        {isForecastPoint && dataPoint.ForecastLower !== undefined && dataPoint.ForecastUpper !== undefined && (
          <p className="text-xs text-muted-foreground">
            Range: {dataPoint.ForecastLower?.toLocaleString()} - {dataPoint.ForecastUpper?.toLocaleString()}
          </p>
        )}

        {/* Show outlier warning for actual data */}
        {!isForecastPoint && dataPoint.isCriticalOutlier && (
          <p className="text-sm text-destructive font-semibold">⚠️ Outlier Detected</p>
        )}
      </div>
    );
  }
  return null;
};

export default function DataVisualizer({ data, target, isRealData, showOutliers = false }: DataVisualizerProps) {
  const [chartType, setChartType] = useState<ChartType>('line');

  // Process data: detect CRITICAL outliers only, format dates, separate actual vs forecast
  const processedData = useMemo(() => {
    // Calculate CRITICAL outliers using stricter IQR method (3.0 instead of 1.5)
    const values = data.map(d => d.Value).filter(v => v !== undefined && v !== null);
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 3.0 * iqr; // Critical outliers only (3.0 instead of 1.5)
    const upperBound = q3 + 3.0 * iqr;

    return data.map(item => {
      const isForecast = item.Forecast !== undefined && item.Forecast !== null;
      return {
        ...item,
        Value: isForecast ? null : item.Value,
        Forecast: isForecast ? item.Forecast : null,
        ForecastUpper: isForecast ? item.ForecastUpper : null,
        ForecastLower: isForecast ? item.ForecastLower : null,
        formattedDate: format(new Date(item.Date), 'dd-MM-yyyy'),
        dateString: format(new Date(item.Date), 'MMM d, yyyy'),
        isCriticalOutlier: !isForecast && (item.Value < lowerBound || item.Value > upperBound),
        timestamp: new Date(item.Date).getTime()
      }
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  if (!isRealData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-destructive">
            Data Visualization Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>
              Visualization is disabled because the data is not from a validated backend workflow.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasForecast = processedData.some(d => d.Forecast !== null && d.Forecast !== undefined);
  const hasOrders = processedData.some(d => d.Orders && d.Orders > 0);

  // Get CRITICAL outliers only (for red dots) - only in actual data
  const criticalOutliers = processedData.filter(d => d.isCriticalOutlier && d.Forecast === undefined);

  const dataKey = target === 'Orders' ? 'Orders' : 'Value';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {hasForecast ? 'Actual vs Forecast' : 'Historical Data'} - {target}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={chartType === 'line' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <LineChart className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === 'bar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateString"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              {/* Left Y-axis: Actual values */}
              <YAxis yAxisId="actual" tick={{ fontSize: 12 }} domain={['auto', 'auto']} label={{ value: 'Actual', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Actual Data */}
              {chartType === 'line' ? (
                <Line
                  yAxisId="actual"
                  type="monotone"
                  dataKey={dataKey}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Actual"
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ) : (
                <Bar
                  dataKey={dataKey}
                  fill="hsl(var(--primary))"
                  name="Actual"
                />
              )}

              {/* Forecast Data */}
              {hasForecast && (
                <>
                  {/* Right Y-axis: Forecast values */}
                  <YAxis yAxisId="forecast" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Forecast', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
                  <Line
                    yAxisId="forecast"
                    type="monotone"
                    dataKey="Forecast"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 3, fill: '#3b82f6' }}
                    connectNulls={false}
                  />
                  {/* Confidence Interval */}
                  <Area
                    yAxisId="forecast"
                    type="monotone"
                    dataKey="ForecastUpper"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Upper Bound"
                  />
                  <Area
                    yAxisId="forecast"
                    type="monotone"
                    dataKey="ForecastLower"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Lower Bound"
                  />
                </>
              )}

              {/* Orders as Regressor (if available) */}
              {hasOrders && target === 'Value' && (
                <Line
                  type="monotone"
                  dataKey="Orders"
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Orders (Regressor)"
                  dot={false}
                  yAxisId="right"
                />
              )}

              {/* Outliers as Red Dots - Only show when requested (exploration/preprocessing) */}
              {showOutliers && criticalOutliers.length > 0 && (
                <Scatter
                  data={criticalOutliers}
                  dataKey={dataKey}
                  fill="#ef4444"
                  shape="circle"
                  name="Outliers"
                />
              )}

              {hasOrders && target === 'Value' && (
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Info */}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Actual Data</span>
          </div>
          {hasForecast && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed' }}></div>
                <span>Forecast</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 opacity-20"></div>
                <span>Confidence Interval</span>
              </div>
            </>
          )}
          {showOutliers && criticalOutliers.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{criticalOutliers.length} Outlier{criticalOutliers.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {hasOrders && target === 'Value' && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500" style={{ borderTop: '2px dashed' }}></div>
              <span>Orders (Regressor)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
