"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Maximize2, RefreshCw } from 'lucide-react';
import DynamicChartRenderer from './dynamic-chart-renderer';
import { dynamicChartGenerator, type ChartConfig, type ProcessedChartData } from '@/lib/dynamic-chart-generator';
import type { WeeklyData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InlineChartMessageProps {
  data: WeeklyData[];
  query: string;
  statisticalAnalysis?: any;
  className?: string;
  onExpand?: () => void;
  onRefresh?: () => void;
}

/**
 * Inline Chart Message Component
 * Renders charts directly in chat messages like ChatGPT/Gemini
 */
export default function InlineChartMessage({
  data,
  query,
  statisticalAnalysis,
  className,
  onExpand,
  onRefresh
}: InlineChartMessageProps) {

  // Analyze query to determine chart configuration
  const chartConfig: ChartConfig = React.useMemo(() => {
    return dynamicChartGenerator.analyzeQuery(query);
  }, [query]);

  // Process data with statistical enhancements
  const processedData: ProcessedChartData[] = React.useMemo(() => {
    return dynamicChartGenerator.processData(data, chartConfig, statisticalAnalysis);
  }, [data, chartConfig, statisticalAnalysis]);

  // Get visualization intent
  const vizIntent = React.useMemo(() => {
    return dynamicChartGenerator.detectVisualizationIntent(query);
  }, [query]);

  // Export chart as image
  const handleExport = () => {
    // Implementation for exporting chart
    console.log('Export chart functionality');
  };

  if (!processedData || processedData.length === 0) {
    return null;
  }

  return (
    <div className={cn("my-3 space-y-2", className)}>
      {/* Chart context header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>Generated visualization</span>
          {vizIntent.features.length > 0 && (
            <div className="flex gap-1">
              {vizIntent.features.map((feature, i) => (
                <Badge key={i} variant="secondary" className="text-xs capitalize">
                  {feature}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onRefresh}
              title="Refresh chart"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={handleExport}
            title="Download chart"
          >
            <Download className="h-3 w-3" />
          </Button>
          {onExpand && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onExpand}
              title="Expand chart"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic chart renderer */}
      <DynamicChartRenderer
        data={processedData}
        config={chartConfig}
        className="shadow-sm"
      />

      {/* Chart insights footer */}
      {statisticalAnalysis && (
        <div className="text-xs text-muted-foreground px-1 space-y-1">
          {statisticalAnalysis.statistical?.outliers?.values?.length > 0 && (
            <div>
              • {statisticalAnalysis.statistical.outliers.values.length} outliers detected
            </div>
          )}
          {statisticalAnalysis.trend?.direction && (
            <div>
              • Trend: {statisticalAnalysis.trend.direction}
              {statisticalAnalysis.trend.linearRegression?.rSquared &&
                ` (R² = ${statisticalAnalysis.trend.linearRegression.rSquared.toFixed(3)})`
              }
            </div>
          )}
          {statisticalAnalysis.quality?.score && (
            <div>
              • Data quality score: {statisticalAnalysis.quality.score}/100
            </div>
          )}
        </div>
      )}
    </div>
  );
}
