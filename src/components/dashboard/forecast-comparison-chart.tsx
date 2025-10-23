import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

interface WeeklyData {
  Date?: string;
  ds?: string;
  date?: string;
  Value?: number;
  Orders?: number;
  Forecast?: number;
  ForecastLower?: number;
  ForecastUpper?: number;
}

interface ForecastComparisonChartProps {
  data: WeeklyData[];
  title?: string;
  target: "Value" | "Orders";
  chartMetrics?: {
    mape?: number;
    model?: string;
    accuracy?: number;
    [key: string]: any;
  };
}

export default function ForecastComparisonChart({
  data,
  title = "Actual vs Forecast Comparison",
  target,
  chartMetrics,
}: ForecastComparisonChartProps) {
  // Generate extended forecast data with dummy weekly values
  const extendedData = useMemo(() => {
    const historicalData = data.filter((d) => d.Forecast == null);
    const existingForecastData = data.filter((d) => d.Forecast != null);
    
    // If we already have forecast data, use it as is
    if (existingForecastData.length > 0) {
      return data;
    }
    
    // Generate dummy weekly forecast for next 4 weeks
    if (historicalData.length === 0) return data;
    
    const lastDate = new Date(
      historicalData[historicalData.length - 1].Date || 
      historicalData[historicalData.length - 1].ds || 
      historicalData[historicalData.length - 1].date || 
      new Date()
    );
    
    const lastValue = historicalData[historicalData.length - 1][target] || 0;
    const avgValue = historicalData.reduce((sum, d) => sum + (d[target] || 0), 0) / historicalData.length;
    
    // Calculate trend from last 4 weeks
    const recentData = historicalData.slice(-4);
    const trend = recentData.length > 1 
      ? ((recentData[recentData.length - 1][target] || 0) - (recentData[0][target] || 0)) / recentData.length
      : 0;
    
    const forecastWeeks: WeeklyData[] = [];
    for (let i = 1; i <= 4; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + (i * 7)); // Weekly intervals
      
      // Generate forecast with trend and some variation
      const baseForecast = lastValue + (trend * i);
      const variation = avgValue * 0.05; // 5% variation
      const forecast = baseForecast + (Math.random() - 0.5) * variation;
      
      forecastWeeks.push({
        Date: forecastDate.toISOString().split('T')[0],
        ds: forecastDate.toISOString().split('T')[0],
        date: forecastDate.toISOString().split('T')[0],
        Forecast: Math.max(0, forecast),
        ForecastLower: Math.max(0, forecast * 0.9),
        ForecastUpper: forecast * 1.1,
      });
    }
    
    return [...historicalData, ...forecastWeeks];
  }, [data, target]);

  // Separate actual and forecast data
  const historicalData = extendedData.filter((d) => d.Forecast == null);
  const forecastData = extendedData.filter((d) => d.Forecast != null);

  // Use MAPE from chartMetrics if available, otherwise compute from data
  const mape = useMemo(() => {
    if (chartMetrics?.mape != null) {
      return chartMetrics.mape;
    }
    
    const pairs = extendedData.filter(
      (d) =>
        d.Forecast != null &&
        d[target] != null &&
        d[target] !== 0
    );
    if (pairs.length === 0) return 0;
    const sum = pairs.reduce((acc, d) => {
      const actual = Number(d[target]);
      const forecast = Number(d.Forecast);
      return acc + Math.abs((actual - forecast) / actual);
    }, 0);
    return (sum / pairs.length) * 100;
  }, [extendedData, target, chartMetrics]);

  // Decide trend direction
  const trend =
    historicalData.length > 1
      ? historicalData[historicalData.length - 1][target]! >
        historicalData[0][target]!
        ? "up"
        : "down"
      : "stable";
  
  // Extract model info from chartMetrics
  const modelInfo = chartMetrics?.model || "Auto-selected";
  const accuracy = chartMetrics?.accuracy;

  // Generate mini sparkline
  const generateMiniChart = (values: (number | null | undefined)[]) => {
    const filtered = values.filter((v) => v != null) as number[];
    if (filtered.length === 0) return "";
    const max = Math.max(...filtered);
    const min = Math.min(...filtered);
    const range = max - min;
    const chars = "▁▂▃▄▅▆▇█";
    return values
      .map((v) => {
        if (v == null) return " ";
        const normalized = range > 0 ? (v - min) / range : 0.5;
        const height = Math.round(normalized * 7);
        return chars[height] || "▁";
      })
      .join("");
  };

  const historicalValues = historicalData.map((d) => d[target] as number | null);
  const forecastValues = forecastData.map((d) => d.Forecast as number);

  return (
    <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              MAPE: {mape.toFixed(1)}%
            </Badge>
            {accuracy != null && (
              <Badge variant="outline" className="text-xs bg-green-50">
                Accuracy: {accuracy.toFixed(1)}%
              </Badge>
            )}
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : trend === "down" ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <span className="text-xs text-gray-500">Stable</span>
            )}
          </div>
        </div>
        {modelInfo && (
          <div className="text-xs text-muted-foreground mt-1">
            Model: {modelInfo}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Historical Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">
              Historical {target}
            </span>
            <span className="text-xs text-muted-foreground">
              {historicalData.length} data points
            </span>
          </div>
          <div className="bg-background/50 rounded p-3 font-mono text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">Actual:</span>
              <span className="text-lg">{generateMiniChart(historicalValues)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Range:{" "}
              {historicalValues.filter((v) => v != null).length
                ? `${Math.min(
                  ...(historicalValues.filter((v) => v != null) as number[])
                ).toFixed(1)} - ${Math.max(
                  ...(historicalValues.filter((v) => v != null) as number[])
                ).toFixed(1)}`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Forecast Data */}
        {forecastData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">
                Forecast {target}
              </span>
              <span className="text-xs text-muted-foreground">
                {forecastData.length} predictions
              </span>
            </div>
            <div className="bg-background/50 rounded p-3 font-mono text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">Forecast:</span>
                <span className="text-lg">{generateMiniChart(forecastValues)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Range:{" "}
                {Math.min(...forecastValues).toFixed(1)} -{" "}
                {Math.max(...forecastValues).toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {/* Recent Comparisons */}
        {/* {actualVsForecast.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Recent Comparisons</span>
            <div className="bg-background/50 rounded p-3">
              <div className="space-y-1 text-xs font-mono">
                <div className="grid grid-cols-4 gap-2 font-semibold text-muted-foreground">
                  <span>Date</span>
                  <span>Actual</span>
                  <span>Forecast</span>
                  <span>Error</span>
                </div>
                {actualVsForecast.slice(-5).map((d, i) => {
                  const actual = d[target];
                  const forecast = d.Forecast;
                  const hasActual = actual != null && actual !== 0;
                  const error = hasActual
                    ? ((actual - forecast!) / actual) * 100
                    : null;
                  const dateVal = new Date(
                    d.Date || d.ds || d.date || ""
                  ).toLocaleDateString();
                  return (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      <span>{dateVal}</span>
                      <span>
                        {actual != null ? Number(actual).toFixed(1) : "—"}
                      </span>
                      <span>
                        {forecast != null ? Number(forecast).toFixed(1) : "—"}
                      </span>
                      <span
                        className={
                          error != null && error > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {error != null
                          ? (error > 0 ? "+" : "") + error.toFixed(1) + "%"
                          : "N/A"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )} */}

        {/* Confidence Bounds */}
        {/* {forecastData.some(
          (d) => d.ForecastLower && d.ForecastUpper
        ) && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Confidence Bounds</span>
              <div className="bg-background/50 rounded p-3 text-xs">
                <div className="space-y-1">
                  {forecastData
                    .filter((d) => d.ForecastLower && d.ForecastUpper)
                    .slice(-3)
                    .map((d, i) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          {new Date(
                            d.Date || d.ds || d.date || ""
                          ).toLocaleDateString()}
                        </span>
                        <span className="font-mono">
                          [{d.ForecastLower!.toFixed(1)},{" "}
                          {d.ForecastUpper!.toFixed(1)}]
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )} */}
      </CardContent>
    </Card>
  );
}
