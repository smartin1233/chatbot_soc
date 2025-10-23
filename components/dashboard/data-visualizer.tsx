
'use client';

import React, { useState } from 'react';
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
  ReferenceDot
} from 'recharts';
import type { WeeklyData } from '@/lib/types';
import { format } from 'date-fns';

type ChartType = 'line' | 'bar';

interface DataVisualizerProps {
  data: WeeklyData[];
  target: 'Value' | 'Orders';
  isRealData: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    let valueText = `Value: ${payload[0].value?.toLocaleString()}`;
    if (dataPoint.isMissing) {
      valueText = 'Value: Missing';
    }

    return (
      <div className="bg-background border p-2 rounded-lg shadow-lg">
        <p className="font-bold">{format(new Date(label), 'PPP')}</p>
        <p className="text-sm text-foreground">{valueText}</p>
        {dataPoint.isOutlier && <p className="text-sm text-destructive font-semibold">Outlier Detected</p>}
        {dataPoint.isMissing && <p className="text-sm text-amber-600 font-semibold">Missing Data</p>}
      </div>
    );
  }
  return null;
};

export default function DataVisualizer({ data, target, isRealData }: DataVisualizerProps) {
  const [chartType, setChartType] = useState<ChartType>('line');

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

  const formattedData = data.map(item => ({
    ...item,
    dateString: format(new Date(item.Date), 'MMM d'),
  }));

  // These fields do not exist in WeeklyData, so filter will always be empty
  const outliers: typeof formattedData = [];
  const missing: typeof formattedData = [];

  const ChartComponent = chartType === 'line' ? RechartsLineChart : RechartsBarChart;
  const ChartElement: React.ComponentType<any> = chartType === 'line' ? Line : Bar;

  // Map 'target' prop to WeeklyData property
  const dataKey = target === 'units' ? 'Orders' : 'Value';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          Data Visualization - {target}
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
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateString" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={['dataMin', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ChartElement
                type="monotone"
                dataKey={dataKey}
                stroke={chartType === 'line' ? "hsl(var(--primary))" : undefined}
                fill={chartType === 'bar' ? "hsl(var(--primary))" : undefined}
                name={target.charAt(0).toUpperCase() + target.slice(1)}
                connectNulls={true}
              />
              {/* Outlier and missing markers are not supported in WeeklyData */}
              {/* If you add outlier/missing logic, update here */}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
