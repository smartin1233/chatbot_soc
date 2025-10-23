"use client";

import React, { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import type { ChartConfig, ProcessedChartData } from '@/lib/dynamic-chart-generator';
import { cn } from '@/lib/utils';

interface DynamicChartRendererProps {
  data: ProcessedChartData[];
  config: ChartConfig;
  className?: string;
}

export default function DynamicChartRenderer({
  data,
  config,
  className
}: DynamicChartRendererProps) {
  
  // Custom tooltip with rich information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const dataPoint = payload[0]?.payload as ProcessedChartData;
    if (!dataPoint) return null;

    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 space-y-2">
        <p className="font-semibold text-sm border-b pb-1">{label}</p>
        <div className="space-y-1 text-xs">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 items-center">
              <span className="flex items-center gap-1">
                <span 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </span>
              <span className="font-mono font-medium">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
          
          {dataPoint.isOutlier && (
            <div className="pt-2 border-t mt-2">
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Outlier Detected
                {dataPoint.anomalyScore && ` (${dataPoint.anomalyScore.toFixed(1)}σ)`}
              </Badge>
            </div>
          )}
          
          {dataPoint.movingAverage && (
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>7-day Avg:</span>
              <span className="font-mono">{dataPoint.movingAverage.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom dot for outlier highlighting
  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    
    if (payload?.isOutlier) {
      return (
        <g key={`outlier-${index}`}>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="#ef4444"
            fillOpacity={0.2}
            stroke="#ef4444"
            strokeWidth={2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill="#ef4444"
          />
        </g>
      );
    }
    
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="#8884d8"
        stroke="#fff"
        strokeWidth={1}
      />
    );
  };

  // Render appropriate chart based on config
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const commonAxisProps = {
      xAxis: {
        dataKey: "formattedDate",
        fontSize: 11,
        tick: { fill: 'currentColor' },
        interval: 'preserveStartEnd' as const
      },
      yAxis: {
        fontSize: 11,
        tick: { fill: 'currentColor' }
      }
    };

    switch (config.type) {
      case 'forecast-comparison':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* Confidence interval area */}
            {config.showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="forecastUpper"
                stroke="none"
                fill="#82ca9d"
                fillOpacity={0.1}
                name="Confidence Range"
              />
            )}
            
            {/* Actual data line */}
            <Line
              type="monotone"
              dataKey="Value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={config.showOutliers ? CustomDot : { r: 3 }}
              name="Actual"
              connectNulls
            />

            {/* Forecast line */}
            {config.showForecast && (
              <Line
                type="monotone"
                dataKey="forecastValue"
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="Forecast"
                connectNulls
              />
            )}

            {/* Trend line */}
            {config.showTrend && (
              <Line
                type="linear"
                dataKey="trend"
                stroke="#ffc658"
                strokeWidth={1.5}
                dot={false}
                name="Trend"
              />
            )}
          </ComposedChart>
        );

      case 'outlier-detection':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* Upper and lower bounds */}
            {config.showConfidenceInterval && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Upper Bound"
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Lower Bound"
                />
              </>
            )}

            {/* Main data with outliers highlighted */}
            <Line
              type="monotone"
              dataKey="Value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={CustomDot}
              name="Value"
            />

            {/* Moving average */}
            {config.showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#82ca9d"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                name="Moving Avg"
              />
            )}
          </ComposedChart>
        );

      case 'trend-analysis':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* Area chart for visual impact */}
            <Area
              type="monotone"
              dataKey="Value"
              fill="#8884d8"
              fillOpacity={0.2}
              stroke="#8884d8"
              strokeWidth={2}
              name="Value"
            />

            {/* Trend line */}
            <Line
              type="linear"
              dataKey="trend"
              stroke="#ffc658"
              strokeWidth={2}
              dot={false}
              name="Trend Line"
            />

            {/* Moving average */}
            {config.showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#82ca9d"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                name="7-day MA"
              />
            )}
          </ComposedChart>
        );

      case 'distribution':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            <Bar
              dataKey="Value"
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
              name="Value"
            />
            
            {config.showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Moving Avg"
              />
            )}
          </BarChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {config.dataKeys.map((key, index) => {
              const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
              const color = colors[index % colors.length];
              
              if (key === 'Forecast' || key.toLowerCase().includes('forecast')) {
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name={key}
                    connectNulls
                  />
                );
              }
              
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={key}
                  connectNulls
                />
              );
            })}

            {config.showTrend && (
              <Line
                type="linear"
                dataKey="trend"
                stroke="#ffc658"
                strokeWidth={1}
                dot={false}
                name="Trend"
              />
            )}
          </ComposedChart>
        );
    }
  };

  // Calculate statistics for display
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.Value).filter(v => v !== undefined && v !== null);
    const outlierCount = data.filter(d => d.isOutlier).length;
    const hasForecast = data.some(d => d.forecastValue !== undefined);
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;

    return {
      dataPoints: values.length,
      outlierCount,
      hasForecast,
      change,
      changePercent,
      trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable'
    };
  }, [data]);

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              {config.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {config.description}
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-1.5 justify-end">
            {config.showForecast && (
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Forecast
              </Badge>
            )}
            {config.showOutliers && stats && stats.outlierCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.outlierCount} Outliers
              </Badge>
            )}
            {config.showTrend && stats && (
              <Badge variant="secondary" className="text-xs">
                {stats.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : stats.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                ) : (
                  <Activity className="h-3 w-3 mr-1" />
                )}
                {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {renderChart()}
        </ResponsiveContainer>

        {/* Quick stats footer */}
        {stats && (
          <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-mono font-medium">{stats.dataPoints}</div>
            </div>
            {stats.hasForecast && (
              <div>
                <div className="text-muted-foreground">Forecast</div>
                <div className="font-mono font-medium text-green-600">Available</div>
              </div>
            )}
            {stats.outlierCount > 0 && (
              <div>
                <div className="text-muted-foreground">Anomalies</div>
                <div className="font-mono font-medium text-red-600">{stats.outlierCount}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
